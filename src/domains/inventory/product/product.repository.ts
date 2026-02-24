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
        include: {
          category: true,
          brand: true,
          warehouse_stocks: { select: { quantity: true } },
        },
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
      include: { category: true, brand: true },
    });
  }

  findByCode(product_code: string) {
    return this.prisma.product.findFirst({ where: { product_code, flag: 1 } });
  }

  create(data: any) {
    return this.prisma.product.create({
      data,
      include: { category: true, brand: true },
    });
  }

  update(id: number, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true, brand: true },
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

  findForMarkup(params: { brand_id?: number; category_id?: number; search?: string }) {
    const where: any = { flag: 1 };
    if (params.brand_id) where.brand_id = params.brand_id;
    if (params.category_id) where.category_id = params.category_id;
    if (params.search) {
      where.OR = [
        { product_code: { contains: params.search } },
        { product_name: { contains: params.search } },
      ];
    }
    return this.prisma.product.findMany({
      where,
      select: {
        id: true,
        product_code: true,
        product_name: true,
        default_selling_price: true,
        default_purchase_price: true,
        uom: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, brand_name: true } },
      },
      orderBy: { product_name: 'asc' },
      take: 500,
    });
  }

  async applyMarkupToProducts(
    productIds: number[],
    markupPct: number,
    brandId: number,
    year: number,
    userId: number,
  ) {
    const multiplier = 1 + markupPct / 100;
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, flag: 1 },
      select: { id: true, default_selling_price: true, default_purchase_price: true },
    });

    await Promise.all(
      products.map((p) =>
        this.prisma.product.update({
          where: { id: p.id },
          data: {
            default_selling_price: Math.round(Number(p.default_selling_price) * multiplier),
            default_purchase_price: Math.round(Number(p.default_purchase_price) * multiplier),
          },
        }),
      ),
    );

    const log = await this.prisma.brandMarkupLog.create({
      data: {
        brand_id: brandId,
        year,
        markup_pct: markupPct,
        products_updated: products.length,
        applied_by: userId,
      },
    });

    return { log, products_updated: products.length };
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
