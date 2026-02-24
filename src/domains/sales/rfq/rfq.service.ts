import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RFQRepository } from './rfq.repository';
import { NotificationService } from '../../notification/notification.service';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { UpdateRFQStatusDto } from './dto/update-rfq.dto';

@Injectable()
export class RFQService {
  constructor(
    private readonly repo: RFQRepository,
    private readonly notificationService: NotificationService,
  ) {}

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

  async update(id: number, dto: CreateRFQDto) {
    const rfq = await this.findById(id);
    if (rfq.status !== 'DRAFT') throw new BadRequestException('Only DRAFT RFQs can be edited');
    return this.repo.update(id, dto);
  }

  async updateStatus(id: number, dto: UpdateRFQStatusDto, actorId?: number) {
    const rfq = await this.findById(id);
    const updated = await this.repo.updateStatus(id, dto.status, actorId, dto.notes);

    if (dto.status === 'PENDING_PRICE_APPROVAL') {
      await this.notificationService.notifyAdmins({
        title: 'RFQ Needs Price Approval',
        message: `RFQ ${rfq.rfq_number} for ${rfq.customer?.customer_name ?? 'customer'} requires price approval.`,
        type: 'RFQ_PRICE_APPROVAL',
        reference_type: 'RFQ',
        reference_id: id,
      });
    }

    return updated;
  }

  async getLogs(id: number) {
    await this.findById(id);
    return this.repo.getLogs(id);
  }

  async revise(id: number, userId: number) {
    await this.findById(id);
    const newRfq = await this.repo.revise(id, userId);
    if (!newRfq) throw new NotFoundException(`RFQ #${id} not found`);
    return newRfq;
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
