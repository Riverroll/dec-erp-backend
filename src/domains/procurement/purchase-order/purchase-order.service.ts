import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseOrderRepository } from './purchase-order.repository';
import { NotificationService } from '../../notification/notification.service';
import { CreatePODto } from './dto/create-po.dto';
import { UpdatePOStatusDto } from './dto/update-po.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly repo: PurchaseOrderRepository,
    private readonly notificationService: NotificationService,
  ) {}

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

  async update(id: number, dto: CreatePODto) {
    const po = await this.findById(id);
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT POs can be edited');
    return this.repo.update(id, dto);
  }

  async updateStatus(id: number, dto: UpdatePOStatusDto, actorId?: number) {
    const po = await this.findById(id);
    const updated = await this.repo.updateStatus(id, dto.status, actorId, dto.notes);

    // Notify admins when PO needs approval
    if (dto.status === 'PENDING_APPROVAL' || dto.status === 'PENDING_PRICE_APPROVAL') {
      const label = dto.status === 'PENDING_APPROVAL' ? 'Approval' : 'Price Approval';
      await this.notificationService.notifyAdmins({
        title: `PO Needs ${label}`,
        message: `Purchase Order ${po.po_number} from ${po.supplier?.supplier_name ?? 'supplier'} is pending ${label.toLowerCase()}.`,
        type: dto.status === 'PENDING_APPROVAL' ? 'PO_APPROVAL' : 'PO_PRICE_APPROVAL',
        reference_type: 'PO',
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
    const newPo = await this.repo.revise(id, userId);
    if (!newPo) throw new NotFoundException(`Purchase Order #${id} not found`);
    return newPo;
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
