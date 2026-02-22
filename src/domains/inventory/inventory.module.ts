import { Module } from '@nestjs/common';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { CategoryRepository } from './category/category.repository';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { ProductRepository } from './product/product.repository';
import { WarehouseController } from './warehouse/warehouse.controller';
import { WarehouseService } from './warehouse/warehouse.service';
import { WarehouseRepository } from './warehouse/warehouse.repository';
import { StockAdjustmentController } from './stock-adjustment/stock-adjustment.controller';
import { StockAdjustmentService } from './stock-adjustment/stock-adjustment.service';

@Module({
  controllers: [CategoryController, ProductController, WarehouseController, StockAdjustmentController],
  providers: [
    CategoryService,
    CategoryRepository,
    ProductService,
    ProductRepository,
    WarehouseService,
    WarehouseRepository,
    StockAdjustmentService,
  ],
  exports: [ProductService, WarehouseService, CategoryService],
})
export class InventoryModule {}
