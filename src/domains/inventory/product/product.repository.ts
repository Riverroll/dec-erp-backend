import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseRepository } from '../../../common/base/base.repository';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class ProductRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(params: BaseQueryDto) {
    return this.findAllPaginated(
      this.prisma.product,
      params,
      ['product_code', 'product_name'],
    );
  }

  async findAllWithCategory(params: BaseQueryDto) {
    const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'DESC' } = params;
    const skip = (page - 1) * limit;

    const where: any = { flag: 1 };
    if (search) {
      where.OR = [
        { product_code: { contains: search } },
        { product_name: { contains: search } },
        { customer_product_codes: { some: { customer_product_code: { contains: search } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  findById(id: number) {
    return this.prisma.product.findFirst({
      where: { id, flag: 1 },
      include: { category: true },
    });
  }

  findByCode(product_code: string) {
    return this.prisma.product.findFirst({ where: { product_code, flag: 1 } });
  }

  create(data: any) {
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  update(id: number, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  delete(id: number) {
    return this.softDelete(this.prisma.product, id);
  }

  async getPurchaseHistory(productId: number) {
    return this.prisma.pOItem.findMany({
      where: { product_id: productId },
      include: {
        po: {
          select: {
            po_number: true,
            po_date: true,
            status: true,
            supplier: { select: { supplier_name: true } },
          },
        },
      },
      orderBy: { po: { po_date: 'desc' } },
      take: 50,
    });
  }

  findStockCard(params: {
    product_id?: number;
    warehouse_id?: number;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    const { product_id, warehouse_id, from_date, to_date, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (product_id) where.product_id = product_id;
    if (warehouse_id) where.warehouse_id = warehouse_id;
    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at.gte = new Date(from_date);
      if (to_date) where.created_at.lte = new Date(to_date + 'T23:59:59.999Z');
    }

    return Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: {
          product: { select: { product_code: true, product_name: true, uom: true } },
          warehouse: { select: { warehouse_code: true, warehouse_name: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
  }
}
