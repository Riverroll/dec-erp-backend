import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

const MSG = {
  NOT_FOUND: 'Customer not found',
  CODE_EXISTS: 'Customer code already exists',
  FETCHED: 'Customers retrieved successfully',
  FETCHED_ONE: 'Customer retrieved successfully',
  CREATED: 'Customer created successfully',
  UPDATED: 'Customer updated successfully',
  DELETED: 'Customer deleted successfully',
};

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async findAll(params: BaseQueryDto) {
    return this.customerRepository.findAll(params);
  }

  async findById(id: number) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) throw new NotFoundException(MSG.NOT_FOUND);
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.customerRepository.findByCode(dto.customer_code);
    if (existing) throw new ConflictException(MSG.CODE_EXISTS);
    const { pics, ...customerData } = dto;
    return this.customerRepository.create(customerData, pics);
  }

  async update(id: number, dto: UpdateCustomerDto) {
    await this.findById(id);
    if (dto.customer_code) {
      const existing = await this.customerRepository.findByCode(dto.customer_code);
      if (existing && existing.id !== id) throw new ConflictException(MSG.CODE_EXISTS);
    }
    const { pics, ...customerData } = dto;
    return this.customerRepository.update(id, customerData, pics);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.customerRepository.delete(id);
  }

  async getSummary(id: number) {
    const summary = await this.customerRepository.getSummary(id);
    if (!summary) throw new NotFoundException(MSG.NOT_FOUND);
    return summary;
  }

  async updateCreditLimit(id: number, creditLimit: number) {
    await this.findById(id);
    return this.customerRepository.updateCreditLimit(id, creditLimit);
  }

  get messages() {
    return MSG;
  }
}
