import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GoodsReceiptService } from './goods-receipt.service';
import { CreateGRDto } from './dto/create-gr.dto';

@ApiTags('Procurement - Goods Receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('procurement/goods-receipts')
export class GoodsReceiptController {
  constructor(private readonly service: GoodsReceiptService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
    });
    const p = parseInt(page), l = parseInt(limit);
    return { data: result.data, meta: { total: result.total, page: p, limit: l, totalPages: Math.ceil(result.total / l) } };
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.service.findById(id) };
  }

  @Post()
  create(@Body() dto: CreateGRDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.confirm(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
