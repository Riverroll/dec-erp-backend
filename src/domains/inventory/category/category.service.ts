import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

const MSG = {
  NOT_FOUND: 'Product category not found',
  NAME_EXISTS: 'Category name already exists',
  FETCHED: 'Categories retrieved successfully',
  FETCHED_ONE: 'Category retrieved successfully',
  CREATED: 'Category created successfully',
  UPDATED: 'Category updated successfully',
  DELETED: 'Category deleted successfully',
};

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(params: BaseQueryDto) {
    return this.categoryRepository.findAll(params);
  }

  async findById(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException(MSG.NOT_FOUND);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findByName(dto.name);
    if (existing) throw new ConflictException(MSG.NAME_EXISTS);
    return this.categoryRepository.create({ name: dto.name });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findById(id);
    if (dto.name) {
      const existing = await this.categoryRepository.findByName(dto.name);
      if (existing && existing.id !== id) throw new ConflictException(MSG.NAME_EXISTS);
    }
    return this.categoryRepository.update(id, dto);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.categoryRepository.delete(id);
  }

  get messages() {
    return MSG;
  }
}
