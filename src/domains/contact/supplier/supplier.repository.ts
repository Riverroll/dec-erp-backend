import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseRepository } from '../../../common/base/base.repository';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class SupplierRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(params: BaseQueryDto) {
    return this.findAllPaginated(
      this.prisma.supplier,
      params,
      ['supplier_code', 'supplier_name'],
    );
  }

  findById(id: number) {
    return this.prisma.supplier.findFirst({
      where: { id, flag: 1 },
      include: { pics: { where: { flag: 1 }, orderBy: { is_primary: 'desc' } } },
    });
  }

  findByCode(supplier_code: string) {
    return this.prisma.supplier.findFirst({ where: { supplier_code, flag: 1 } });
  }

  async create(data: any, pics?: any[]) {
    const { pics: _pics, ...supplierData } = data;
    const supplier = await this.prisma.supplier.create({ data: supplierData });
    if (pics && pics.length > 0) {
      await this.prisma.supplierPIC.createMany({
        data: pics.map((p) => ({ ...p, supplier_id: supplier.id })),
      });
    }
    return this.findById(supplier.id);
  }

  async update(id: number, data: any, pics?: any[]) {
    const { pics: _pics, ...supplierData } = data;
    await this.prisma.supplier.update({ where: { id }, data: supplierData });
    if (pics !== undefined) {
      await this.prisma.supplierPIC.updateMany({
        where: { supplier_id: id },
        data: { flag: 2 },
      });
      if (pics.length > 0) {
        await this.prisma.supplierPIC.createMany({
          data: pics.map((p) => ({ ...p, supplier_id: id })),
        });
      }
    }
    return this.findById(id);
  }

  delete(id: number) {
    return this.softDelete(this.prisma.supplier, id);
  }

  async getSummary(id: number) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, flag: 1 },
      include: { pics: { where: { flag: 1 }, orderBy: { is_primary: 'desc' } } },
    });
    if (!supplier) return null;

    const [recentPOs, totalPOAgg] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { supplier_id: id, flag: 1 },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, po_number: true, po_date: true, status: true, grand_total: true },
      }),
      this.prisma.purchaseOrder.aggregate({
        where: { supplier_id: id, flag: 1 },
        _sum: { grand_total: true },
      }),
    ]);

    return {
      ...supplier,
      recent_pos: recentPOs,
      total_po_value: Number(totalPOAgg._sum.grand_total ?? 0),
    };
  }
}
