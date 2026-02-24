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
import { BrandController } from './brand/brand.controller';
import { BrandService } from './brand/brand.service';
import { BrandRepository } from './brand/brand.repository';
import { UomController } from './uom/uom.controller';
import { UomService } from './uom/uom.service';
import { UomRepository } from './uom/uom.repository';

@Module({
  controllers: [CategoryController, ProductController, WarehouseController, StockAdjustmentController, BrandController, UomController],
  providers: [
    CategoryService,
    CategoryRepository,
    ProductService,
    ProductRepository,
    WarehouseService,
    WarehouseRepository,
    StockAdjustmentService,
    BrandService,
    BrandRepository,
    UomService,
    UomRepository,
  ],
  exports: [ProductService, WarehouseService, CategoryService, BrandService, UomService],
})
export class InventoryModule {}
