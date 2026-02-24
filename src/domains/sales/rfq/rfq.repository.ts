import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRFQDto } from './dto/create-rfq.dto';

@Injectable()
export class RFQRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      customer: { select: { customer_name: true, customer_code: true } },
      items: {
        include: {
          product: { select: { product_name: true, product_code: true, uom: true } },
          warehouse: { select: { warehouse_name: true } },
        },
      },
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { flag: 1 };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { rfq_number: { contains: search } },
        { customer: { customer_name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where,
        include: this.include,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rFQ.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.rFQ.findFirst({
      where: { id, flag: 1 },
      include: this.include,
    });
  }

  async create(dto: CreateRFQDto, createdBy: number) {
    const lastRFQ = await this.prisma.rFQ.findFirst({
      orderBy: { id: 'desc' },
      select: { rfq_number: true },
    });

    const nextNum = lastRFQ
      ? parseInt(lastRFQ.rfq_number.replace('RFQ-', '')) + 1
      : 1;
    const rfq_number = `RFQ-${String(nextNum).padStart(5, '0')}`;

    const ppn_rate = dto.ppn_rate ?? 11;
    const subtotal = dto.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    return this.prisma.rFQ.create({
      data: {
        rfq_number,
        customer_id: dto.customer_id,
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

  async update(id: number, dto: CreateRFQDto) {
    const ppn_rate = dto.ppn_rate ?? 11;
    const subtotal = dto.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    await this.prisma.rFQItem.deleteMany({ where: { rfq_id: id } });

    return this.prisma.rFQ.update({
      where: { id },
      data: {
        customer_id: dto.customer_id,
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
    const [rfq] = await Promise.all([
      this.prisma.rFQ.update({
        where: { id },
        data: { status },
        include: this.include,
      }),
      ...(loggableStatuses.includes(status)
        ? [this.prisma.approvalLog.create({
            data: {
              document_type: 'RFQ',
              document_id: id,
              action: this.actionForStatus(status),
              actor_id: actorId ?? null,
              notes: notes ?? null,
            },
          })]
        : []),
    ]);
    return rfq;
  }

  async getLogs(id: number) {
    return this.prisma.approvalLog.findMany({
      where: { document_type: 'RFQ', document_id: id },
      include: { actor: { select: { full_name: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async revise(id: number, userId: number) {
    const original = await this.prisma.rFQ.findFirst({
      where: { id, flag: 1 },
      include: { items: true },
    });
    if (!original) return null;

    const lastRFQ = await this.prisma.rFQ.findFirst({
      orderBy: { id: 'desc' },
      select: { rfq_number: true },
    });
    const nextNum = lastRFQ ? parseInt(lastRFQ.rfq_number.replace('RFQ-', '')) + 1 : 1;
    const rfq_number = `RFQ-${String(nextNum).padStart(5, '0')}`;

    const newRfq = await this.prisma.rFQ.create({
      data: {
        rfq_number,
        customer_id: original.customer_id,
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
        document_type: 'RFQ',
        document_id: id,
        action: 'REVISED',
        actor_id: userId,
        notes: `Revised as ${rfq_number}`,
      },
    });

    return newRfq;
  }

  async softDelete(id: number) {
    return this.prisma.rFQ.update({ where: { id }, data: { flag: 2 } });
  }

  async convertToSO(rfqId: number, createdBy: number) {
    const rfq = await this.prisma.rFQ.findFirst({
      where: { id: rfqId, flag: 1 },
      include: { items: true },
    });
    if (!rfq) return null;

    const last = await this.prisma.salesOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { so_number: true },
    });
    const nextNum = last ? parseInt(last.so_number.replace('SO-', '')) + 1 : 1;
    const so_number = `SO-${String(nextNum).padStart(5, '0')}`;

    const ppn_rate = Number(rfq.ppn_rate) ?? 11;
    const subtotal = rfq.items.reduce((s, i) => s + Number(i.qty) * Number(i.unit_price), 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    // Auto-detect indent: check total stock across all warehouses for each item
    const productIds = [...new Set(rfq.items.map((i) => i.product_id))];
    const stockAgg = await this.prisma.warehouseStock.groupBy({
      by: ['product_id'],
      where: { product_id: { in: productIds } },
      _sum: { quantity: true },
    });
    const stockMap = new Map(stockAgg.map((s) => [s.product_id, Number(s._sum.quantity ?? 0)]));
    const is_indent = rfq.items.some((i) => (stockMap.get(i.product_id) ?? 0) < Number(i.qty));

    return this.prisma.salesOrder.create({
      data: {
        so_number,
        customer_id: rfq.customer_id,
        rfq_id: rfq.id,
        notes: rfq.notes,
        ppn_rate,
        subtotal,
        ppn_amount,
        grand_total,
        is_indent,
        created_by: createdBy,
        items: {
          create: rfq.items.map((item) => ({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.qty) * Number(item.unit_price),
          })),
        },
      },
      include: {
        customer: { select: { customer_name: true, customer_code: true } },
        rfq: { select: { rfq_number: true } },
        items: {
          include: {
            product: { select: { product_name: true, product_code: true, uom: true } },
            warehouse: { select: { warehouse_name: true } },
          },
        },
      },
    });
  }
}
