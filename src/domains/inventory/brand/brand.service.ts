import { Injectable, NotFoundException } from '@nestjs/common';
import { BrandRepository } from './brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandService {
  constructor(private readonly repo: BrandRepository) {}

  async findAll(params: { page: number; limit: number; search?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const brand = await this.repo.findById(id);
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);
    return brand;
  }

  async create(dto: CreateBrandDto) {
    return this.repo.create(dto);
  }

  async update(id: number, dto: CreateBrandDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async applyMarkup(id: number, year: number, userId: number) {
    await this.findById(id);
    const result = await this.repo.applyMarkup(id, year, userId);
    if (!result) throw new NotFoundException(`Brand #${id} not found`);
    return result;
  }
}
