import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSODto } from './dto/create-so.dto';

@Injectable()
export class SalesOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      customer: { select: { customer_name: true, customer_code: true } },
      rfq: { select: { rfq_number: true } },
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
        { so_number: { contains: search } },
        { customer: { customer_name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        include: this.include,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.salesOrder.findFirst({
      where: { id, flag: 1 },
      include: this.include,
    });
  }

  async create(dto: CreateSODto, createdBy: number) {
    const last = await this.prisma.salesOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { so_number: true },
    });

    const nextNum = last ? parseInt(last.so_number.replace('SO-', '')) + 1 : 1;
    const so_number = `SO-${String(nextNum).padStart(5, '0')}`;

    const ppn_rate = dto.ppn_rate ?? 11;
    const subtotal = dto.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    return this.prisma.salesOrder.create({
      data: {
        so_number,
        customer_id: dto.customer_id,
        rfq_id: dto.rfq_id,
        notes: dto.notes,
        ppn_rate,
        subtotal,
        ppn_amount,
        grand_total,
        is_indent: dto.is_indent ?? false,
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
    return this.prisma.salesOrder.update({
      where: { id },
      data: { status },
      include: this.include,
    });
  }

  async softDelete(id: number) {
    return this.prisma.salesOrder.update({ where: { id }, data: { flag: 2 } });
  }

  /** Check if confirming this SO would exceed the customer's credit limit.
   *  outstanding = sum of unpaid invoice amounts (excluding current SO's invoices).
   *  If credit_limit = 0 → no limit enforced. */
  async checkCreditLimit(customerId: number, soGrandTotal: number, soId: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId },
      select: { credit_limit: true },
    });
    const limit = Number(customer?.credit_limit ?? 0);
    if (limit <= 0) return { exceeded: false, outstanding: 0, limit: 0 };

    const openInvoices = await this.prisma.salesInvoice.findMany({
      where: { customer_id: customerId, flag: 1, status: { in: ['ISSUED', 'PARTIAL', 'OVERDUE'] } },
      include: { payments: { where: { flag: 1 } } },
    });
    const outstanding = openInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.grand_total) - paid);
    }, 0);

    return {
      exceeded: outstanding + soGrandTotal > limit,
      outstanding,
      limit,
    };
  }

  async updateCustomerCreditLimit(customerId: number, newLimit: number) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { credit_limit: newLimit },
    });
  }

  async createDO(soId: number, createdBy: number) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id: soId, flag: 1 },
      include: { items: true },
    });
    if (!so) return null;

    const last = await this.prisma.deliveryOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { do_number: true },
    });
    const nextNum = last ? parseInt(last.do_number.replace('DO-', '')) + 1 : 1;
    const do_number = `DO-${String(nextNum).padStart(5, '0')}`;

    const warehouse_id = so.items.find((i) => i.warehouse_id != null)?.warehouse_id ?? null;

    return this.prisma.deliveryOrder.create({
      data: {
        do_number,
        so_id: so.id,
        customer_id: so.customer_id,
        warehouse_id,
        created_by: createdBy,
        items: {
          create: so.items.map((item) => ({
            product_id: item.product_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.qty) * Number(item.unit_price),
          })),
        },
      },
      include: {
        customer: { select: { customer_name: true, customer_code: true } },
        so: { select: { so_number: true } },
        warehouse: { select: { warehouse_name: true, warehouse_code: true } },
        items: {
          include: {
            product: { select: { product_name: true, product_code: true, uom: true } },
          },
        },
      },
    });
  }
}
