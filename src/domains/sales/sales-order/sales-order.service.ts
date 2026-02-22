import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesOrderRepository } from './sales-order.repository';
import { CreateSODto } from './dto/create-so.dto';
import { UpdateSOStatusDto } from './dto/update-so.dto';

@Injectable()
export class SalesOrderService {
  constructor(private readonly repo: SalesOrderRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const so = await this.repo.findById(id);
    if (!so) throw new NotFoundException(`Sales Order #${id} not found`);
    return so;
  }

  async create(dto: CreateSODto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdateSOStatusDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async createDO(id: number, userId: number) {
    await this.findById(id);
    const doc = await this.repo.createDO(id, userId);
    if (!doc) throw new NotFoundException(`Sales Order #${id} not found`);
    return doc;
  }
}
