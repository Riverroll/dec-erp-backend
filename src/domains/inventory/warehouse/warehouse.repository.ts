import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseRepository } from '../../../common/base/base.repository';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class WarehouseRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(params: BaseQueryDto) {
    return this.findAllPaginated(
      this.prisma.warehouse,
      params,
      ['warehouse_code', 'warehouse_name', 'manager_name'],
    );
  }

  findById(id: number) {
    return this.prisma.warehouse.findFirst({ where: { id, flag: 1 } });
  }

  findByCode(warehouse_code: string) {
    return this.prisma.warehouse.findFirst({ where: { warehouse_code, flag: 1 } });
  }

  create(data: any) {
    return this.prisma.warehouse.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.softDelete(this.prisma.warehouse, id);
  }
}
