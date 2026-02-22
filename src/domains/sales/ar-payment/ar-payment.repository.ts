import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateARPaymentDto } from './dto/create-payment.dto';

@Injectable()
export class ARPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      customer: { select: { customer_name: true, customer_code: true } },
      invoice: { select: { invoice_number: true, grand_total: true } },
    };
  }

  async findAll(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { flag: 1 };
    if (search) {
      where.OR = [
        { payment_number: { contains: search } },
        { customer: { customer_name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.aRPayment.findMany({
        where,
        include: this.include,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aRPayment.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.aRPayment.findFirst({
      where: { id, flag: 1 },
      include: this.include,
    });
  }

  async create(dto: CreateARPaymentDto, createdBy: number) {
    const last = await this.prisma.aRPayment.findFirst({
      orderBy: { id: 'desc' },
      select: { payment_number: true },
    });

    const nextNum = last ? parseInt(last.payment_number.replace('PAY-', '')) + 1 : 1;
    const payment_number = `PAY-${String(nextNum).padStart(5, '0')}`;

    const payment = await this.prisma.aRPayment.create({
      data: {
        payment_number,
        invoice_id: dto.invoice_id,
        customer_id: dto.customer_id,
        amount: dto.amount,
        method: dto.method ?? 'TRANSFER',
        payment_date: dto.payment_date ? new Date(dto.payment_date) : undefined,
        notes: dto.notes,
        created_by: createdBy,
      },
      include: this.include,
    });

    // Auto-update invoice status based on total paid
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: dto.invoice_id },
      include: { payments: { where: { flag: 1 } } },
    });

    if (invoice) {
      const totalPaid = invoice.payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const grandTotal = Number(invoice.grand_total);
      const newStatus = totalPaid >= grandTotal ? 'PAID' : 'PARTIAL';
      await this.prisma.salesInvoice.update({
        where: { id: dto.invoice_id },
        data: { status: newStatus },
      });
    }

    return payment;
  }

  async softDelete(id: number) {
    return this.prisma.aRPayment.update({ where: { id }, data: { flag: 2 } });
  }
}
