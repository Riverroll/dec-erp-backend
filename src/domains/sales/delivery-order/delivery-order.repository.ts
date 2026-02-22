import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDODto } from './dto/create-do.dto';

@Injectable()
export class DeliveryOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      customer: { select: { customer_name: true, customer_code: true } },
      so: { select: { so_number: true } },
      warehouse: { select: { warehouse_name: true, warehouse_code: true } },
      items: {
        include: {
          product: { select: { product_name: true, product_code: true, uom: true } },
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
        { do_number: { contains: search } },
        { customer: { customer_name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.deliveryOrder.findMany({
        where,
        include: this.include,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryOrder.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.deliveryOrder.findFirst({
      where: { id, flag: 1 },
      include: this.include,
    });
  }

  async create(dto: CreateDODto, createdBy: number) {
    const last = await this.prisma.deliveryOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { do_number: true },
    });

    const nextNum = last ? parseInt(last.do_number.replace('DO-', '')) + 1 : 1;
    const do_number = `DO-${String(nextNum).padStart(5, '0')}`;

    return this.prisma.deliveryOrder.create({
      data: {
        do_number,
        so_id: dto.so_id,
        customer_id: dto.customer_id,
        warehouse_id: dto.warehouse_id,
        delivery_address: dto.delivery_address,
        notes: dto.notes,
        surat_jalan_number: dto.surat_jalan_number,
        recipient_name: dto.recipient_name,
        recipient_phone: dto.recipient_phone,
        vehicle_number: dto.vehicle_number,
        driver_name: dto.driver_name,
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
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { status },
      include: this.include,
    });
  }

  async softDelete(id: number) {
    return this.prisma.deliveryOrder.update({ where: { id }, data: { flag: 2 } });
  }

  async createInvoice(doId: number, createdBy: number) {
    const doc = await this.prisma.deliveryOrder.findFirst({
      where: { id: doId, flag: 1 },
      include: {
        items: true,
        so: { select: { ppn_rate: true } },
      },
    });
    if (!doc) return null;

    const last = await this.prisma.salesInvoice.findFirst({
      orderBy: { id: 'desc' },
      select: { invoice_number: true },
    });
    const nextNum = last ? parseInt(last.invoice_number.replace('INV-', '')) + 1 : 1;
    const invoice_number = `INV-${String(nextNum).padStart(5, '0')}`;

    const ppn_rate = doc.so ? Number((doc.so as any).ppn_rate) : 11;
    const subtotal = doc.items.reduce((s, i) => s + Number(i.qty) * Number(i.unit_price), 0);
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    return this.prisma.salesInvoice.create({
      data: {
        invoice_number,
        do_id: doc.id,
        customer_id: doc.customer_id,
        ppn_rate,
        subtotal,
        ppn_amount,
        grand_total,
        status: 'ISSUED',
        created_by: createdBy,
        items: {
          create: doc.items.map((item) => ({
            product_id: item.product_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.qty) * Number(item.unit_price),
          })),
        },
      },
      include: {
        customer: { select: { customer_name: true, customer_code: true } },
        do: { select: { do_number: true } },
        items: {
          include: {
            product: { select: { product_name: true, product_code: true, uom: true } },
          },
        },
        payments: { where: { flag: 1 }, select: { amount: true, payment_date: true, method: true } },
      },
    });
  }
}
