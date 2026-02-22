import { Injectable, NotFoundException } from '@nestjs/common';
import { ARPaymentRepository } from './ar-payment.repository';
import { CreateARPaymentDto } from './dto/create-payment.dto';

@Injectable()
export class ARPaymentService {
  constructor(private readonly repo: ARPaymentRepository) {}

  async findAll(params: { page: number; limit: number; search?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const payment = await this.repo.findById(id);
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async create(dto: CreateARPaymentDto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
