import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      customer: { select: { customer_name: true, customer_code: true } },
      do: { select: { do_number: true } },
      sales_person: { select: { id: true, full_name: true } },
      items: {
        include: {
          product: { select: { product_name: true, product_code: true, uom: true } },
        },
      },
      payments: {
        where: { flag: 1 },
        select: { amount: true, payment_date: true, method: true },
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
        { invoice_number: { contains: search } },
        { customer: { customer_name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        where,
        include: this.include,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.salesInvoice.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.salesInvoice.findFirst({
      where: { id, flag: 1 },
      include: this.include,
    });
  }

  async create(dto: CreateInvoiceDto, createdBy: number) {
    const last = await this.prisma.salesInvoice.findFirst({
      orderBy: { id: 'desc' },
      select: { invoice_number: true },
    });

    const nextNum = last ? parseInt(last.invoice_number.replace('INV-', '')) + 1 : 1;
    const invoice_number = `INV-${String(nextNum).padStart(5, '0')}`;

    const ppn_rate = dto.ppn_rate ?? 11;
    const subtotal = dto.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    return this.prisma.salesInvoice.create({
      data: {
        invoice_number,
        do_id: dto.do_id,
        customer_id: dto.customer_id,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        ppn_rate,
        subtotal,
        ppn_amount,
        grand_total,
        notes: dto.notes,
        created_by: createdBy,
        items: {
          create: dto.items.map((item) => ({
            product_id: item.product_id,
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
    return this.prisma.salesInvoice.update({
      where: { id },
      data: { status },
      include: this.include,
    });
  }

  async softDelete(id: number) {
    return this.prisma.salesInvoice.update({ where: { id }, data: { flag: 2 } });
  }

  // For AR Aging — invoices ISSUED or PARTIAL
  async findAgingData(customerId?: number) {
    const now = new Date();
    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        flag: 1,
        status: { in: ['ISSUED', 'PARTIAL', 'OVERDUE'] },
        ...(customerId ? { customer_id: customerId } : {}),
      },
      include: {
        customer: { select: { id: true, customer_name: true, customer_code: true } },
        payments: { where: { flag: 1 }, select: { amount: true } },
      },
    });

    return invoices.map((inv) => {
      const paid = inv.payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const outstanding = Number(inv.grand_total) - paid;
      const daysOverdue = inv.due_date
        ? Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86_400_000)
        : 0;

      let bucket = '0-30';
      if (daysOverdue > 90) bucket = '>90';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';

      return {
        invoice_number: inv.invoice_number,
        customer_id: inv.customer.id,
        customer_name: inv.customer.customer_name,
        customer_code: inv.customer.customer_code,
        grand_total: Number(inv.grand_total),
        paid,
        outstanding,
        due_date: inv.due_date,
        days_overdue: daysOverdue,
        bucket,
      };
    });
  }
}
