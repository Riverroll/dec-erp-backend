import { Injectable, NotFoundException } from '@nestjs/common';
import { GoodsReceiptRepository } from './goods-receipt.repository';
import { CreateGRDto } from './dto/create-gr.dto';

@Injectable()
export class GoodsReceiptService {
  constructor(private readonly repo: GoodsReceiptRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const gr = await this.repo.findById(id);
    if (!gr) throw new NotFoundException(`Goods Receipt #${id} not found`);
    return gr;
  }

  async create(dto: CreateGRDto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async confirm(id: number) {
    await this.findById(id);
    return this.repo.confirm(id);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
