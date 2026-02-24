import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesOrderRepository } from './sales-order.repository';
import { NotificationService } from '../../notification/notification.service';
import { CreateSODto } from './dto/create-so.dto';
import { UpdateSOStatusDto } from './dto/update-so.dto';

@Injectable()
export class SalesOrderService {
  constructor(
    private readonly repo: SalesOrderRepository,
    private readonly notificationService: NotificationService,
  ) {}

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
    const so = await this.findById(id);

    // Credit limit check when confirming an SO
    if (dto.status === 'CONFIRMED') {
      const credit = await this.repo.checkCreditLimit(so.customer_id, Number(so.grand_total), id);
      if (credit.exceeded) {
        const updated = await this.repo.updateStatus(id, 'PENDING_CREDIT_APPROVAL');
        const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
        await this.notificationService.notifyAdmins({
          title: 'SO Requires Credit Approval',
          message: `SO ${so.so_number} for ${so.customer?.customer_name ?? 'customer'} exceeds credit limit (outstanding ${fmt(credit.outstanding)} + SO ${fmt(Number(so.grand_total))} > limit ${fmt(credit.limit)}).`,
          type: 'CREDIT_LIMIT',
          reference_type: 'SO',
          reference_id: id,
        });
        return updated;
      }
    }

    return this.repo.updateStatus(id, dto.status);
  }

  /** Big boss credit approval: approve, reject, or increase limit + approve */
  async creditApproval(id: number, action: 'APPROVE' | 'REJECT', newCreditLimit?: number) {
    const so = await this.findById(id);
    if (so.status !== 'PENDING_CREDIT_APPROVAL') {
      throw new BadRequestException('SO is not pending credit approval');
    }
    if (action === 'REJECT') {
      return this.repo.updateStatus(id, 'CANCELLED');
    }
    if (newCreditLimit !== undefined && newCreditLimit > 0) {
      await this.repo.updateCustomerCreditLimit(so.customer_id, newCreditLimit);
    }
    return this.repo.updateStatus(id, 'CONFIRMED');
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
