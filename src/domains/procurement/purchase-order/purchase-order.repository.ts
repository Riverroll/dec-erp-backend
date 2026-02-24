import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePODto } from './dto/create-po.dto';

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      supplier: { select: { supplier_name: true, supplier_code: true } },
      items: {
        include: {
          product: { select: { product_name: true, product_code: true, uom: true } },
          warehouse: { select: { warehouse_name: true } },
        },
      },
    };
  }

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { flag: 1 };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { po_number: { contains: search } },
        { supplier: { supplier_name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: this.include,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.purchaseOrder.findFirst({
      where: { id, flag: 1 },
      include: this.include,
    });
  }

  async create(dto: CreatePODto, createdBy: number) {
    const last = await this.prisma.purchaseOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { po_number: true },
    });

    const nextNum = last ? parseInt(last.po_number.replace('PO-', '')) + 1 : 1;
    const po_number = `PO-${String(nextNum).padStart(5, '0')}`;

    const ppn_rate = dto.ppn_rate ?? 11;
    const subtotal = dto.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    return this.prisma.purchaseOrder.create({
      data: {
        po_number,
        supplier_id: dto.supplier_id,
        notes: dto.notes,
        ppn_rate,
        subtotal,
        ppn_amount,
        grand_total,
        created_by: createdBy,
        items: {
          create: dto.items.map((item) => ({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            qty: item.qty,
            unit_price: item.unit_price,
            subtotal: item.qty * item.unit_price,
          })),
        },
      },
      include: this.include,
    });
  }

  async update(id: number, dto: CreatePODto) {
    const ppn_rate = dto.ppn_rate ?? 11;
    const subtotal = dto.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    await this.prisma.pOItem.deleteMany({ where: { po_id: id } });

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplier_id: dto.supplier_id,
        notes: dto.notes,
        ppn_rate,
        subtotal,
        ppn_amount,
        grand_total,
        items: {
          create: dto.items.map((item) => ({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            qty: item.qty,
            unit_price: item.unit_price,
            subtotal: item.qty * item.unit_price,
          })),
        },
      },
      include: this.include,
    });
  }

  private actionForStatus(status: string): string {
    if (status === 'PENDING_APPROVAL' || status === 'PENDING_PRICE_APPROVAL') return 'SUBMITTED';
    if (status === 'APPROVED') return 'APPROVED';
    if (status === 'REJECTED') return 'REJECTED';
    return status;
  }

  async updateStatus(id: number, status: string, actorId?: number, notes?: string) {
    const loggableStatuses = ['PENDING_APPROVAL', 'PENDING_PRICE_APPROVAL', 'APPROVED', 'REJECTED'];
    const [po] = await Promise.all([
      this.prisma.purchaseOrder.update({
        where: { id },
        data: { status },
        include: this.include,
      }),
      ...(loggableStatuses.includes(status)
        ? [this.prisma.approvalLog.create({
            data: {
              document_type: 'PO',
              document_id: id,
              action: this.actionForStatus(status),
              actor_id: actorId ?? null,
              notes: notes ?? null,
            },
          })]
        : []),
    ]);
    return po;
  }

  async getLogs(id: number) {
    return this.prisma.approvalLog.findMany({
      where: { document_type: 'PO', document_id: id },
      include: { actor: { select: { full_name: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async revise(id: number, userId: number) {
    const original = await this.prisma.purchaseOrder.findFirst({
      where: { id, flag: 1 },
      include: { items: true },
    });
    if (!original) return null;

    const last = await this.prisma.purchaseOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { po_number: true },
    });
    const nextNum = last ? parseInt(last.po_number.replace('PO-', '')) + 1 : 1;
    const po_number = `PO-${String(nextNum).padStart(5, '0')}`;

    const newPo = await this.prisma.purchaseOrder.create({
      data: {
        po_number,
        supplier_id: original.supplier_id,
        notes: original.notes,
        ppn_rate: original.ppn_rate,
        subtotal: original.subtotal,
        ppn_amount: original.ppn_amount,
        grand_total: original.grand_total,
        created_by: userId,
        revised_from_id: original.id,
        status: 'DRAFT',
        items: {
          create: original.items.map((item) => ({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.subtotal),
          })),
        },
      },
      include: this.include,
    });

    await this.prisma.approvalLog.create({
      data: {
        document_type: 'PO',
        document_id: id,
        action: 'REVISED',
        actor_id: userId,
        notes: `Revised as ${po_number}`,
      },
    });

    return newPo;
  }

  async softDelete(id: number) {
    return this.prisma.purchaseOrder.update({ where: { id }, data: { flag: 2 } });
  }
}
