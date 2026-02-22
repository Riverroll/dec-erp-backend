import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ARPaymentService } from './ar-payment.service';
import { CreateARPaymentDto } from './dto/create-payment.dto';

@ApiTags('Sales - AR Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/payments')
export class ARPaymentController {
  constructor(private readonly service: ARPaymentService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    const result = await this.service.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
    const p = parseInt(page), l = parseInt(limit);
    return { data: result.data, meta: { total: result.total, page: p, limit: l, totalPages: Math.ceil(result.total / l) } };
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.service.findById(id) };
  }

  @Post()
  create(@Body() dto: CreateARPaymentDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
