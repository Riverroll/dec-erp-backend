import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CustomerProductCodeService } from './customer-product-code.service';
import { CreateCustomerProductCodeDto, UpdateCustomerProductCodeDto } from './dto/create-cpc.dto';

@ApiTags('Contacts — Customer Product Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts/customers/:customerId/product-codes')
export class CustomerProductCodeController {
  constructor(private readonly service: CustomerProductCodeService) {}

  @Get()
  async findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('search') search?: string,
  ) {
    const data = await this.service.findByCustomer(customerId, search);
    return { data };
  }

  @Post()
  async create(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body() dto: CreateCustomerProductCodeDto,
  ) {
    const data = await this.service.create(customerId, dto);
    return { data };
  }

  @Put(':id')
  async update(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerProductCodeDto,
  ) {
    const data = await this.service.update(id, customerId, dto);
    return { data };
  }

  @Delete(':id')
  async remove(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.service.remove(id, customerId);
    return { data: null };
  }
}

/** Standalone search endpoint — find product by customer's own code */
@ApiTags('Contacts — Customer Product Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts/customer-product-codes')
export class CustomerProductCodeSearchController {
  constructor(private readonly service: CustomerProductCodeService) {}

  @Get('search')
  async search(
    @Query('code') code: string,
    @Query('customer_id') customerId?: string,
  ) {
    const data = await this.service.searchByCustomerCode(
      code ?? '',
      customerId ? parseInt(customerId) : undefined,
    );
    return { data };
  }

  @Get('by-product/:productId')
  async findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    const data = await this.service.findByProduct(productId);
    return { data };
  }
}
