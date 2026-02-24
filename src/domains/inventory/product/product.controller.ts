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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ApplyMarkupDto } from './dto/apply-markup.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Inventory — Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('inventory/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List products (paginated, filterable by brand & category)' })
  async findAll(@Query() params: ProductQueryDto) {
    const result = await this.productService.findAll(params);
    return { message: this.productService.messages.FETCHED, data: result.data, meta: result.meta };
  }

  @Get('stock-card')
  @ApiOperation({ summary: 'Get stock card / movement history' })
  @ApiQuery({ name: 'product_id', required: false, type: Number })
  @ApiQuery({ name: 'warehouse_id', required: false, type: Number })
  @ApiQuery({ name: 'from_date', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to_date', required: false, type: String, example: '2025-12-31' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getStockCard(
    @Query('product_id') product_id?: string,
    @Query('warehouse_id') warehouse_id?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.productService.getStockCard({
      product_id: product_id ? Number(product_id) : undefined,
      warehouse_id: warehouse_id ? Number(warehouse_id) : undefined,
      from_date,
      to_date,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { message: this.productService.messages.STOCK_CARD_FETCHED, data: result.data, meta: result.meta };
  }

  @Get('for-markup')
  @ApiOperation({ summary: 'Get products for markup selection (filter by brand/category/search)' })
  async getForMarkup(
    @Query('brand_id') brand_id?: string,
    @Query('category_id') category_id?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.productService.getForMarkup({
      brand_id: brand_id ? Number(brand_id) : undefined,
      category_id: category_id ? Number(category_id) : undefined,
      search,
    });
    return { data };
  }

  @Post('apply-markup')
  @ApiOperation({ summary: 'Apply price markup to selected products' })
  async applyMarkup(
    @Body() dto: ApplyMarkupDto,
    @Request() req: any,
  ) {
    const data = await this.productService.applyMarkup(
      dto.product_ids,
      dto.markup_pct,
      dto.brand_id,
      dto.year,
      req.user.id,
    );
    return { data };
  }

  @Get(':id/purchase-history')
  @ApiOperation({ summary: 'Get purchase history for a product (PO lines)' })
  async getPurchaseHistory(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productService.getPurchaseHistory(id);
    return { data };
  }

  @Get(':id/markup-history')
  @ApiOperation({ summary: 'Get brand markup run history for a product' })
  async getMarkupHistory(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productService.findMarkupHistory(id);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productService.findById(id);
    return { message: this.productService.messages.FETCHED_ONE, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@Body() dto: CreateProductDto) {
    const data = await this.productService.create(dto);
    return { message: this.productService.messages.CREATED, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    const data = await this.productService.update(id, dto);
    return { message: this.productService.messages.UPDATED, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete product' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productService.delete(id);
    return { message: this.productService.messages.DELETED, data: null };
  }
}
