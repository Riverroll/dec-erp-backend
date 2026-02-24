import { Injectable } from '@nestjs/common';
import { UomRepository } from './uom.repository';
import { CreateUomDto } from './dto/create-uom.dto';

@Injectable()
export class UomService {
  constructor(private readonly repo: UomRepository) {}

  async findAll(params: { page: number; limit: number; search?: string }) {
    return this.repo.findAll(params);
  }

  findAllSimple() {
    return this.repo.findAllSimple();
  }

  async create(dto: CreateUomDto) {
    return this.repo.create(dto);
  }

  async update(id: number, dto: CreateUomDto) {
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    return this.repo.softDelete(id);
  }
}
