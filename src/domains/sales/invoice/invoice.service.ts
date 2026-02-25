import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceRepository } from './invoice.repository';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly repo: InvoiceRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const inv = await this.repo.findById(id);
    if (!inv) throw new NotFoundException(`Invoice #${id} not found`);
    return inv;
  }

  async create(dto: CreateInvoiceDto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdateInvoiceStatusDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async getAgingData(customerId?: number) {
    const rows = await this.repo.findAgingData(customerId);

    const summary = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '>90': 0,
      total: 0,
    };

    for (const row of rows) {
      summary[row.bucket as keyof typeof summary] =
        (summary[row.bucket as keyof typeof summary] as number) + row.outstanding;
      summary.total += row.outstanding;
    }

    return { summary, rows };
  }
}
