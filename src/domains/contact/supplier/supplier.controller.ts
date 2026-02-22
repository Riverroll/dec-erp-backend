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
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Contacts — Suppliers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('contacts/suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @ApiOperation({ summary: 'List suppliers (paginated)' })
  async findAll(@Query() params: BaseQueryDto) {
    const result = await this.supplierService.findAll(params);
    return { message: this.supplierService.messages.FETCHED, data: result.data, meta: result.meta };
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get supplier summary (with PICs, recent POs, total value)' })
  async getSummary(@Param('id', ParseIntPipe) id: number) {
    const data = await this.supplierService.getSummary(id);
    return { message: this.supplierService.messages.FETCHED_ONE, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID (with PICs)' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.supplierService.findById(id);
    return { message: this.supplierService.messages.FETCHED_ONE, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create supplier (with optional PICs)' })
  async create(@Body() dto: CreateSupplierDto) {
    const data = await this.supplierService.create(dto);
    return { message: this.supplierService.messages.CREATED, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update supplier (replaces PICs if provided)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
  ) {
    const data = await this.supplierService.update(id, dto);
    return { message: this.supplierService.messages.UPDATED, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete supplier' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.supplierService.delete(id);
    return { message: this.supplierService.messages.DELETED, data: null };
  }
}
