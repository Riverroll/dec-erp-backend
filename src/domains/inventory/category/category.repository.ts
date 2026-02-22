import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseRepository } from '../../../common/base/base.repository';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class CategoryRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(params: BaseQueryDto) {
    return this.findAllPaginated(this.prisma.productCategory, params, ['name']);
  }

  findById(id: number) {
    return this.prisma.productCategory.findFirst({ where: { id, flag: 1 } });
  }

  findByName(name: string) {
    return this.prisma.productCategory.findFirst({ where: { name, flag: 1 } });
  }

  create(data: { name: string }) {
    return this.prisma.productCategory.create({ data });
  }

  update(id: number, data: Partial<{ name: string }>) {
    return this.prisma.productCategory.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.softDelete(this.prisma.productCategory, id);
  }
}
