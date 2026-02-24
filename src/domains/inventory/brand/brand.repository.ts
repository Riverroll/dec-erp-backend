import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { flag: 1 };
    if (search) {
      where.OR = [
        { brand_code: { contains: search } },
        { brand_name: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        include: { _count: { select: { products: { where: { flag: 1 } } } } },
        orderBy: { brand_name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.brand.findFirst({
      where: { id, flag: 1 },
      include: {
        _count: { select: { products: { where: { flag: 1 } } } },
        markup_logs: { orderBy: { applied_at: 'desc' }, take: 10 },
      },
    });
  }

  async create(dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        brand_code: dto.brand_code.toUpperCase(),
        brand_name: dto.brand_name,
        discount_pct: dto.discount_pct ?? 0,
        markup_pct: dto.markup_pct ?? 0,
      },
    });
  }

  async update(id: number, dto: CreateBrandDto) {
    return this.prisma.brand.update({
      where: { id },
      data: {
        brand_code: dto.brand_code.toUpperCase(),
        brand_name: dto.brand_name,
        discount_pct: dto.discount_pct ?? 0,
        markup_pct: dto.markup_pct ?? 0,
      },
    });
  }

  async softDelete(id: number) {
    return this.prisma.brand.update({ where: { id }, data: { flag: 2 } });
  }

  async applyMarkup(id: number, year: number, appliedBy: number) {
    const brand = await this.prisma.brand.findFirst({ where: { id, flag: 1 } });
    if (!brand) return null;

    const products = await this.prisma.product.findMany({
      where: { brand_id: id, flag: 1 },
      select: { id: true, default_selling_price: true, default_purchase_price: true },
    });

    const multiplier = 1 + Number(brand.markup_pct) / 100;

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
        brand_id: id,
        year,
        markup_pct: Number(brand.markup_pct),
        products_updated: products.length,
        applied_by: appliedBy,
      },
    });

    return { log, products_updated: products.length };
  }
}
