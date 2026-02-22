import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCustomerProductCodeDto, UpdateCustomerProductCodeDto } from './dto/create-cpc.dto';

@Injectable()
export class CustomerProductCodeService {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      product: {
        select: {
          product_code: true,
          product_name: true,
          uom: true,
          default_selling_price: true,
        },
      },
      customer: {
        select: { customer_code: true, customer_name: true },
      },
    };
  }

  /** List all customer product codes for a given customer */
  async findByCustomer(customerId: number, search?: string) {
    const where: any = { customer_id: customerId };
    if (search) {
      where.OR = [
        { customer_product_code: { contains: search } },
        { product: { product_name: { contains: search } } },
        { product: { product_code: { contains: search } } },
      ];
    }
    return this.prisma.customerProductCode.findMany({
      where,
      include: this.include,
      orderBy: { customer_product_code: 'asc' },
    });
  }

  /** Find by customer product code string — used for search/lookup */
  async findByCode(customerCode: string, customerId?: number) {
    const where: any = { customer_product_code: customerCode };
    if (customerId) where.customer_id = customerId;
    const results = await this.prisma.customerProductCode.findMany({
      where,
      include: this.include,
    });
    return results;
  }

  /** Find all customer codes for a specific product (across all customers) */
  async findByProduct(productId: number) {
    return this.prisma.customerProductCode.findMany({
      where: { product_id: productId },
      include: this.include,
      orderBy: { customer_id: 'asc' },
    });
  }

  /** Find product using customer's own code */
  async searchByCustomerCode(customerCode: string, customerId?: number) {
    const where: any = {
      customer_product_code: { contains: customerCode },
    };
    if (customerId) where.customer_id = customerId;
    return this.prisma.customerProductCode.findMany({
      where,
      include: this.include,
      take: 20,
    });
  }

  async create(customerId: number, dto: CreateCustomerProductCodeDto) {
    const existing = await this.prisma.customerProductCode.findUnique({
      where: {
        customer_id_product_id: {
          customer_id: customerId,
          product_id: dto.product_id,
        },
      },
    });
    if (existing) {
      throw new ConflictException('This product already has a customer code for this customer');
    }
    return this.prisma.customerProductCode.create({
      data: {
        customer_id: customerId,
        product_id: dto.product_id,
        customer_product_code: dto.customer_product_code,
        notes: dto.notes,
      },
      include: this.include,
    });
  }

  async update(id: number, customerId: number, dto: UpdateCustomerProductCodeDto) {
    const record = await this.prisma.customerProductCode.findFirst({
      where: { id, customer_id: customerId },
    });
    if (!record) throw new NotFoundException('Customer product code not found');
    return this.prisma.customerProductCode.update({
      where: { id },
      data: {
        customer_product_code: dto.customer_product_code,
        notes: dto.notes,
      },
      include: this.include,
    });
  }

  async remove(id: number, customerId: number) {
    const record = await this.prisma.customerProductCode.findFirst({
      where: { id, customer_id: customerId },
    });
    if (!record) throw new NotFoundException('Customer product code not found');
    return this.prisma.customerProductCode.delete({ where: { id } });
  }
}
