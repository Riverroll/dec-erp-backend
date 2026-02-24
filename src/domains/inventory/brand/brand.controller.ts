import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@ApiTags('Inventory - Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/brands')
export class BrandController {
  constructor(private readonly service: BrandService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    const p = parseInt(page), l = parseInt(limit);
    const result = await this.service.findAll({ page: p, limit: l, search });
    return { data: result.data, meta: { total: result.total, page: p, limit: l, totalPages: Math.ceil(result.total / l) } };
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.service.findById(id) };
  }

  @Post()
  async create(@Body() dto: CreateBrandDto) {
    return { data: await this.service.create(dto) };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateBrandDto) {
    return { data: await this.service.update(id, dto) };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.service.remove(id) };
  }

  @Post(':id/apply-markup')
  async applyMarkup(
    @Param('id', ParseIntPipe) id: number,
    @Body('year') year: number,
    @Request() req: any,
  ) {
    return { data: await this.service.applyMarkup(id, year ?? new Date().getFullYear(), req.user.id) };
  }
}
