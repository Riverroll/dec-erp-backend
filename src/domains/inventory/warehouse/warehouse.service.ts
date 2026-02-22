import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { WarehouseRepository } from './warehouse.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

const MSG = {
  NOT_FOUND: 'Warehouse not found',
  CODE_EXISTS: 'Warehouse code already exists',
  FETCHED: 'Warehouses retrieved successfully',
  FETCHED_ONE: 'Warehouse retrieved successfully',
  CREATED: 'Warehouse created successfully',
  UPDATED: 'Warehouse updated successfully',
  DELETED: 'Warehouse deleted successfully',
};

@Injectable()
export class WarehouseService {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async findAll(params: BaseQueryDto) {
    return this.warehouseRepository.findAll(params);
  }

  async findById(id: number) {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) throw new NotFoundException(MSG.NOT_FOUND);
    return warehouse;
  }

  async create(dto: CreateWarehouseDto) {
    const existing = await this.warehouseRepository.findByCode(dto.warehouse_code);
    if (existing) throw new ConflictException(MSG.CODE_EXISTS);
    return this.warehouseRepository.create(dto);
  }

  async update(id: number, dto: UpdateWarehouseDto) {
    await this.findById(id);
    if (dto.warehouse_code) {
      const existing = await this.warehouseRepository.findByCode(dto.warehouse_code);
      if (existing && existing.id !== id) throw new ConflictException(MSG.CODE_EXISTS);
    }
    return this.warehouseRepository.update(id, dto);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.warehouseRepository.delete(id);
  }

  get messages() {
    return MSG;
  }
}
