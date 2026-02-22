import { Injectable, NotFoundException } from '@nestjs/common';
import { RFQRepository } from './rfq.repository';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { UpdateRFQStatusDto } from './dto/update-rfq.dto';

@Injectable()
export class RFQService {
  constructor(private readonly repo: RFQRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const rfq = await this.repo.findById(id);
    if (!rfq) throw new NotFoundException(`RFQ #${id} not found`);
    return rfq;
  }

  async create(dto: CreateRFQDto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdateRFQStatusDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async convertToSO(id: number, userId: number) {
    await this.findById(id);
    const so = await this.repo.convertToSO(id, userId);
    if (!so) throw new NotFoundException(`RFQ #${id} not found`);
    return so;
  }
}
