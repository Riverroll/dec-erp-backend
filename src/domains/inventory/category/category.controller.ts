import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Inventory — Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('inventory/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List product categories (paginated)' })
  async findAll(@Query() params: BaseQueryDto) {
    const result = await this.categoryService.findAll(params);
    return { message: this.categoryService.messages.FETCHED, data: result.data, meta: result.meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryService.findById(id);
    return { message: this.categoryService.messages.FETCHED_ONE, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create product category' })
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoryService.create(dto);
    return { message: this.categoryService.messages.CREATED, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product category' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoryService.update(id, dto);
    return { message: this.categoryService.messages.UPDATED, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete product category' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.delete(id);
    return { message: this.categoryService.messages.DELETED, data: null };
  }
}
