import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSupplierProductCodeDto, UpdateSupplierProductCodeDto } from './dto/create-spc.dto';

@Injectable()
export class SupplierProductCodeService {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      product: {
        select: {
          product_code: true,
          product_name: true,
          uom: true,
          default_purchase_price: true,
        },
      },
      supplier: {
        select: { supplier_code: true, supplier_name: true },
      },
    };
  }

  async findBySupplier(supplierId: number, search?: string) {
    const where: any = { supplier_id: supplierId };
    if (search) {
      where.OR = [
        { supplier_product_code: { contains: search } },
        { product: { product_name: { contains: search } } },
        { product: { product_code: { contains: search } } },
      ];
    }
    return this.prisma.supplierProductCode.findMany({
      where,
      include: this.include,
      orderBy: { supplier_product_code: 'asc' },
    });
  }

  async findByProduct(productId: number) {
    return this.prisma.supplierProductCode.findMany({
      where: { product_id: productId },
      include: this.include,
      orderBy: { supplier_id: 'asc' },
    });
  }

  async create(supplierId: number, dto: CreateSupplierProductCodeDto) {
    const existing = await this.prisma.supplierProductCode.findUnique({
      where: {
        supplier_id_product_id: {
          supplier_id: supplierId,
          product_id: dto.product_id,
        },
      },
    });
    if (existing) {
      throw new ConflictException('This product already has a supplier code for this supplier');
    }
    return this.prisma.supplierProductCode.create({
      data: {
        supplier_id: supplierId,
        product_id: dto.product_id,
        supplier_product_code: dto.supplier_product_code,
        notes: dto.notes,
      },
      include: this.include,
    });
  }

  async update(id: number, supplierId: number, dto: UpdateSupplierProductCodeDto) {
    const record = await this.prisma.supplierProductCode.findFirst({
      where: { id, supplier_id: supplierId },
    });
    if (!record) throw new NotFoundException('Supplier product code not found');
    return this.prisma.supplierProductCode.update({
      where: { id },
      data: {
        supplier_product_code: dto.supplier_product_code,
        notes: dto.notes,
      },
      include: this.include,
    });
  }

  async remove(id: number, supplierId: number) {
    const record = await this.prisma.supplierProductCode.findFirst({
      where: { id, supplier_id: supplierId },
    });
    if (!record) throw new NotFoundException('Supplier product code not found');
    return this.prisma.supplierProductCode.delete({ where: { id } });
  }
}
