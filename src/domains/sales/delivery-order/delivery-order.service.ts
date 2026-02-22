import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryOrderRepository } from './delivery-order.repository';
import { CreateDODto } from './dto/create-do.dto';
import { UpdateDOStatusDto } from './dto/update-do.dto';

@Injectable()
export class DeliveryOrderService {
  constructor(private readonly repo: DeliveryOrderRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Delivery Order #${id} not found`);
    return doc;
  }

  async create(dto: CreateDODto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdateDOStatusDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async createInvoice(id: number, userId: number) {
    await this.findById(id);
    const inv = await this.repo.createInvoice(id, userId);
    if (!inv) throw new NotFoundException(`Delivery Order #${id} not found`);
    return inv;
  }
}
