import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupplierRepository } from './supplier.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

const MSG = {
  NOT_FOUND: 'Supplier not found',
  CODE_EXISTS: 'Supplier code already exists',
  FETCHED: 'Suppliers retrieved successfully',
  FETCHED_ONE: 'Supplier retrieved successfully',
  CREATED: 'Supplier created successfully',
  UPDATED: 'Supplier updated successfully',
  DELETED: 'Supplier deleted successfully',
};

@Injectable()
export class SupplierService {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async findAll(params: BaseQueryDto) {
    return this.supplierRepository.findAll(params);
  }

  async findById(id: number) {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) throw new NotFoundException(MSG.NOT_FOUND);
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    const existing = await this.supplierRepository.findByCode(dto.supplier_code);
    if (existing) throw new ConflictException(MSG.CODE_EXISTS);
    const { pics, ...supplierData } = dto;
    return this.supplierRepository.create(supplierData, pics);
  }

  async update(id: number, dto: UpdateSupplierDto) {
    await this.findById(id);
    if (dto.supplier_code) {
      const existing = await this.supplierRepository.findByCode(dto.supplier_code);
      if (existing && existing.id !== id) throw new ConflictException(MSG.CODE_EXISTS);
    }
    const { pics, ...supplierData } = dto;
    return this.supplierRepository.update(id, supplierData, pics);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.supplierRepository.delete(id);
  }

  async getSummary(id: number) {
    const summary = await this.supplierRepository.getSummary(id);
    if (!summary) throw new NotFoundException(MSG.NOT_FOUND);
    return summary;
  }

  get messages() {
    return MSG;
  }
}
