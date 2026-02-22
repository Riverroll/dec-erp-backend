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

  async updateStatus(id: number, status: string) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: this.include,
    });
  }

  async softDelete(id: number) {
    return this.prisma.purchaseOrder.update({ where: { id }, data: { flag: 2 } });
  }
}
