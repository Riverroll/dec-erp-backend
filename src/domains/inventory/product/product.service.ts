import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

const MSG = {
  NOT_FOUND: 'Product not found',
  CODE_EXISTS: 'Product code already exists',
  FETCHED: 'Products retrieved successfully',
  FETCHED_ONE: 'Product retrieved successfully',
  CREATED: 'Product created successfully',
  UPDATED: 'Product updated successfully',
  DELETED: 'Product deleted successfully',
  STOCK_CARD_FETCHED: 'Stock card retrieved successfully',
};

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findAll(params: BaseQueryDto & { brand_id?: number; category_id?: number }) {
    return this.productRepository.findAllWithCategory(params);
  }

  async findById(id: number) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException(MSG.NOT_FOUND);
    return product;
  }

  async findMarkupHistory(id: number) {
    await this.findById(id);
    return this.productRepository.findMarkupHistory(id);
  }

  async create(dto: CreateProductDto) {
    const existing = await this.productRepository.findByCode(dto.product_code);
    if (existing) throw new ConflictException(MSG.CODE_EXISTS);
    return this.productRepository.create(dto);
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findById(id);
    if (dto.product_code) {
      const existing = await this.productRepository.findByCode(dto.product_code);
      if (existing && existing.id !== id) throw new ConflictException(MSG.CODE_EXISTS);
    }
    return this.productRepository.update(id, dto);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.productRepository.delete(id);
  }

  async getPurchaseHistory(id: number) {
    return this.productRepository.getPurchaseHistory(id);
  }

  async getStockCard(params: {
    product_id?: number;
    warehouse_id?: number;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    const [data, total] = await this.productRepository.findStockCard(params);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    // Compute running balance per row
    let balance = 0;
    const rows = data.map((row: any) => {
      const qty = Number(row.quantity);
      if (row.movement_type === 'IN') balance += qty;
      else if (row.movement_type === 'OUT') balance -= qty;
      return {
        ...row,
        qty_in: row.movement_type === 'IN' ? qty : 0,
        qty_out: row.movement_type === 'OUT' ? qty : 0,
        running_balance: balance,
        total_value: balance * Number(row.unit_cost ?? 0),
      };
    });

    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getForMarkup(params: { brand_id?: number; category_id?: number; search?: string }) {
    return this.productRepository.findForMarkup(params);
  }

  async applyMarkup(productIds: number[], markupPct: number, brandId: number, year: number, userId: number) {
    if (!productIds?.length) throw new BadRequestException('No products selected');
    if (!markupPct || markupPct <= 0) throw new BadRequestException('Markup % must be greater than 0');
    return this.productRepository.applyMarkupToProducts(productIds, markupPct, brandId, year, userId);
  }

  get messages() {
    return MSG;
  }
}
