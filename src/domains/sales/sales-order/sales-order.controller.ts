import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SalesOrderService } from './sales-order.service';
import { CreateSODto } from './dto/create-so.dto';
import { UpdateSOStatusDto } from './dto/update-so.dto';

@ApiTags('Sales - Sales Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/orders')
export class SalesOrderController {
  constructor(private readonly service: SalesOrderService) {}

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
  create(@Body() dto: CreateSODto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSOStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Post(':id/create-do')
  async createDO(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return { data: await this.service.createDO(id, req.user.id) };
  }

  @Patch(':id/credit-approval')
  async creditApproval(
    @Param('id', ParseIntPipe) id: number,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('new_credit_limit') newCreditLimit?: number,
  ) {
    return { data: await this.service.creditApproval(id, action, newCreditLimit) };
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
