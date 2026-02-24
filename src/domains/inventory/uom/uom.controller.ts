import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UomService } from './uom.service';
import { CreateUomDto } from './dto/create-uom.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventory/uom')
export class UomController {
  constructor(private readonly service: UomService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
  ) {
    const p = parseInt(page), l = parseInt(limit);
    const result = await this.service.findAll({ page: p, limit: l, search });
    return { data: result.data, meta: { total: result.total, page: p, limit: l, totalPages: Math.ceil(result.total / l) } };
  }

  @Get('all')
  async findAllSimple() {
    return { data: await this.service.findAllSimple() };
  }

  @Post()
  async create(@Body() dto: CreateUomDto) {
    return { data: await this.service.create(dto) };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateUomDto) {
    return { data: await this.service.update(id, dto) };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.service.remove(id) };
  }
}
