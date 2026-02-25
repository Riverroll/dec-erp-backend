import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseRepository } from '../../../common/base/base.repository';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class CustomerRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(params: BaseQueryDto) {
    return this.findAllPaginated(
      this.prisma.customer,
      params,
      ['customer_code', 'customer_name', 'industry'],
      {},
      { include: { sales_person: { select: { id: true, full_name: true } } } },
    );
  }

  findById(id: number) {
    return this.prisma.customer.findFirst({
      where: { id, flag: 1 },
      include: {
        pics: { where: { flag: 1 }, orderBy: { is_primary: 'desc' } },
        sales_person: { select: { id: true, full_name: true, email: true, phone: true } },
      },
    });
  }

  findByCode(customer_code: string) {
    return this.prisma.customer.findFirst({ where: { customer_code, flag: 1 } });
  }

  async create(data: any, pics?: any[]) {
    const { pics: _pics, ...customerData } = data;
    const customer = await this.prisma.customer.create({ data: customerData });
    if (pics && pics.length > 0) {
      await this.prisma.customerPIC.createMany({
        data: pics.map((p) => ({ ...p, customer_id: customer.id })),
      });
    }
    return this.findById(customer.id);
  }

  async update(id: number, data: any, pics?: any[]) {
    const { pics: _pics, ...customerData } = data;
    await this.prisma.customer.update({ where: { id }, data: customerData });
    if (pics !== undefined) {
      // Replace all PICs: soft-delete existing, recreate
      await this.prisma.customerPIC.updateMany({
        where: { customer_id: id },
        data: { flag: 2 },
      });
      if (pics.length > 0) {
        await this.prisma.customerPIC.createMany({
          data: pics.map((p) => ({ ...p, customer_id: id })),
        });
      }
    }
    return this.findById(id);
  }

  delete(id: number) {
    return this.softDelete(this.prisma.customer, id);
  }

  updateCreditLimit(id: number, creditLimit: number) {
    return this.prisma.customer.update({ where: { id }, data: { credit_limit: creditLimit } });
  }

  async getSummary(id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, flag: 1 },
      include: {
        pics: { where: { flag: 1 }, orderBy: { is_primary: 'desc' } },
        sales_person: { select: { id: true, full_name: true, email: true, phone: true } },
      },
    });
    if (!customer) return null;

    const [recentSOs, recentInvoices, revenueAgg, outstandingInvoices] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: { customer_id: id, flag: 1 },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, so_number: true, so_date: true, status: true, grand_total: true },
      }),
      this.prisma.salesInvoice.findMany({
        where: { customer_id: id, flag: 1 },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, invoice_number: true, invoice_date: true, status: true, grand_total: true, due_date: true },
      }),
      this.prisma.salesInvoice.aggregate({
        where: { customer_id: id, flag: 1 },
        _sum: { grand_total: true },
      }),
      this.prisma.salesInvoice.findMany({
        where: { customer_id: id, flag: 1, status: { in: ['ISSUED', 'PARTIAL', 'OVERDUE'] } },
        include: { payments: { where: { flag: 1 } } },
      }),
    ]);

    const outstanding_ar = outstandingInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.grand_total) - paid);
    }, 0);

    return {
      ...customer,
      recent_sos: recentSOs,
      recent_invoices: recentInvoices,
      total_revenue: Number(revenueAgg._sum.grand_total ?? 0),
      outstanding_ar,
    };
  }
}
