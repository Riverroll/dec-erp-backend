import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RFQService } from './rfq.service';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { UpdateRFQStatusDto } from './dto/update-rfq.dto';

@ApiTags('Sales - RFQ')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/rfq')
export class RFQController {
  constructor(private readonly service: RFQService) {}

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
  create(@Body() dto: CreateRFQDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateRFQDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRFQStatusDto, @Request() req: any) {
    return this.service.updateStatus(id, dto, req.user?.id);
  }

  @Get(':id/logs')
  async getLogs(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.service.getLogs(id) };
  }

  @Post(':id/revise')
  async revise(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return { data: await this.service.revise(id, req.user.id) };
  }

  @Post(':id/convert-to-so')
  async convertToSO(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return { data: await this.service.convertToSO(id, req.user.id) };
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
