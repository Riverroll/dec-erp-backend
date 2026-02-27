import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SupplierProductCodeService } from './supplier-product-code.service';
import { CreateSupplierProductCodeDto, UpdateSupplierProductCodeDto } from './dto/create-spc.dto';

@ApiTags('Contacts — Supplier Product Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts/suppliers/:supplierId/product-codes')
export class SupplierProductCodeController {
  constructor(private readonly service: SupplierProductCodeService) {}

  @Get()
  async findBySupplier(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Query('search') search?: string,
  ) {
    const data = await this.service.findBySupplier(supplierId, search);
    return { data };
  }

  @Post()
  async create(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Body() dto: CreateSupplierProductCodeDto,
  ) {
    const data = await this.service.create(supplierId, dto);
    return { data };
  }

  @Put(':id')
  async update(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierProductCodeDto,
  ) {
    const data = await this.service.update(id, supplierId, dto);
    return { data };
  }

  @Delete(':id')
  async remove(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.service.remove(id, supplierId);
    return { data: null };
  }
}

@ApiTags('Contacts — Supplier Product Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts/supplier-product-codes')
export class SupplierProductCodeSearchController {
  constructor(private readonly service: SupplierProductCodeService) {}

  @Get('by-product/:productId')
  async findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    const data = await this.service.findByProduct(productId);
    return { data };
  }
}
