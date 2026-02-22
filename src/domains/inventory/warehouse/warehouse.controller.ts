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
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Inventory — Warehouses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('inventory/warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @ApiOperation({ summary: 'List warehouses (paginated)' })
  async findAll(@Query() params: BaseQueryDto) {
    const result = await this.warehouseService.findAll(params);
    return { message: this.warehouseService.messages.FETCHED, data: result.data, meta: result.meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.warehouseService.findById(id);
    return { message: this.warehouseService.messages.FETCHED_ONE, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create warehouse' })
  async create(@Body() dto: CreateWarehouseDto) {
    const data = await this.warehouseService.create(dto);
    return { message: this.warehouseService.messages.CREATED, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update warehouse' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const data = await this.warehouseService.update(id, dto);
    return { message: this.warehouseService.messages.UPDATED, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete warehouse' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.warehouseService.delete(id);
    return { message: this.warehouseService.messages.DELETED, data: null };
  }
}
