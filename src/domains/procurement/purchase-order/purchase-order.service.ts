import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseOrderRepository } from './purchase-order.repository';
import { CreatePODto } from './dto/create-po.dto';
import { UpdatePOStatusDto } from './dto/update-po.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly repo: PurchaseOrderRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const po = await this.repo.findById(id);
    if (!po) throw new NotFoundException(`Purchase Order #${id} not found`);
    return po;
  }

  async create(dto: CreatePODto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdatePOStatusDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
