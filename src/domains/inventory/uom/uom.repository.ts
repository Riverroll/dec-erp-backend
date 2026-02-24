import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUomDto } from './dto/create-uom.dto';

@Injectable()
export class UomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const where: any = { flag: 1 };
    if (search) {
      where.OR = [
        { uom_code: { contains: search } },
        { uom_name: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.uom.findMany({ where, skip, take: limit, orderBy: { uom_name: 'asc' } }),
      this.prisma.uom.count({ where }),
    ]);
    return { data, total };
  }

  async findAllSimple() {
    return this.prisma.uom.findMany({ where: { flag: 1 }, orderBy: { uom_name: 'asc' } });
  }

  async create(dto: CreateUomDto) {
    return this.prisma.uom.create({
      data: { uom_code: dto.uom_code.toUpperCase(), uom_name: dto.uom_name },
    });
  }

  async update(id: number, dto: CreateUomDto) {
    return this.prisma.uom.update({
      where: { id },
      data: { uom_code: dto.uom_code.toUpperCase(), uom_name: dto.uom_name },
    });
  }

  async softDelete(id: number) {
    return this.prisma.uom.update({ where: { id }, data: { flag: 2 } });
  }
}
