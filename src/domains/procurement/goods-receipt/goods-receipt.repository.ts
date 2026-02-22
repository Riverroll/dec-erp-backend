import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateGRDto } from './dto/create-gr.dto';

@Injectable()
export class GoodsReceiptRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      supplier: { select: { supplier_name: true, supplier_code: true } },
      po: { select: { po_number: true } },
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
        { receipt_number: { contains: search } },
        { supplier: { supplier_name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({
        where,
        include: this.include,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.goodsReceipt.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.goodsReceipt.findFirst({
      where: { id, flag: 1 },
      include: this.include,
    });
  }

  async create(dto: CreateGRDto, createdBy: number) {
    const last = await this.prisma.goodsReceipt.findFirst({
      orderBy: { id: 'desc' },
      select: { receipt_number: true },
    });

    const nextNum = last ? parseInt(last.receipt_number.replace('GR-', '')) + 1 : 1;
    const receipt_number = `GR-${String(nextNum).padStart(5, '0')}`;

    const gr = await this.prisma.goodsReceipt.create({
      data: {
        receipt_number,
        po_id: dto.po_id,
        supplier_id: dto.supplier_id,
        warehouse_id: dto.warehouse_id,
        notes: dto.notes,
        created_by: createdBy,
        items: {
          create: dto.items.map((item) => ({
            product_id: item.product_id,
            qty_ordered: item.qty_ordered,
            qty_received: item.qty_received,
            unit_cost: item.unit_cost,
          })),
        },
      },
      include: this.include,
    });

    // Update warehouse stock and create stock movements for each received item
    for (const item of dto.items) {
      if (item.qty_received <= 0) continue;

      // Upsert warehouse stock
      await this.prisma.warehouseStock.upsert({
        where: {
          product_id_warehouse_id: {
            product_id: item.product_id,
            warehouse_id: dto.warehouse_id,
          },
        },
        update: { quantity: { increment: item.qty_received } },
        create: {
          product_id: item.product_id,
          warehouse_id: dto.warehouse_id,
          quantity: item.qty_received,
        },
      });

      // Create stock movement (IN)
      await this.prisma.stockMovement.create({
        data: {
          product_id: item.product_id,
          warehouse_id: dto.warehouse_id,
          movement_type: 'IN',
          quantity: item.qty_received,
          reference_type: 'GR',
          reference_id: gr.id,
          reference_number: receipt_number,
          unit_cost: item.unit_cost,
          created_by: createdBy,
        },
      });
    }

    return gr;
  }

  async confirm(id: number) {
    return this.prisma.goodsReceipt.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: this.include,
    });
  }

  async softDelete(id: number) {
    return this.prisma.goodsReceipt.update({ where: { id }, data: { flag: 2 } });
  }
}
