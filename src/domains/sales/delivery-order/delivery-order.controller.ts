import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { DeliveryOrderService } from './delivery-order.service';
import { CreateDODto } from './dto/create-do.dto';
import { UpdateDOStatusDto } from './dto/update-do.dto';

@ApiTags('Sales - Delivery Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/delivery-orders')
export class DeliveryOrderController {
  constructor(private readonly service: DeliveryOrderService) {}

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
  create(@Body() dto: CreateDODto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDOStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Post(':id/create-invoice')
  async createInvoice(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return { data: await this.service.createInvoice(id, req.user.id) };
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
