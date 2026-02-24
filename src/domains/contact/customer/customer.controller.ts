import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Contacts — Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('contacts/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: 'List customers (paginated)' })
  async findAll(@Query() params: BaseQueryDto) {
    const result = await this.customerService.findAll(params);
    return { message: this.customerService.messages.FETCHED, data: result.data, meta: result.meta };
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get customer summary (with PICs, recent SOs, invoices, revenue)' })
  async getSummary(@Param('id', ParseIntPipe) id: number) {
    const data = await this.customerService.getSummary(id);
    return { message: this.customerService.messages.FETCHED_ONE, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID (with PICs)' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.customerService.findById(id);
    return { message: this.customerService.messages.FETCHED_ONE, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create customer (with optional PICs)' })
  async create(@Body() dto: CreateCustomerDto) {
    const data = await this.customerService.create(dto);
    return { message: this.customerService.messages.CREATED, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer (replaces PICs if provided)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    const data = await this.customerService.update(id, dto);
    return { message: this.customerService.messages.UPDATED, data };
  }

  @Patch(':id/credit-limit')
  @ApiOperation({ summary: 'Set customer credit limit' })
  async updateCreditLimit(
    @Param('id', ParseIntPipe) id: number,
    @Body('credit_limit') creditLimit: number,
  ) {
    const data = await this.customerService.updateCreditLimit(id, Number(creditLimit));
    return { message: 'Credit limit updated', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete customer' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.customerService.delete(id);
    return { message: this.customerService.messages.DELETED, data: null };
  }
}
