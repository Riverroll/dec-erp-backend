import { Module } from '@nestjs/common';
import { CustomerController } from './customer/customer.controller';
import { CustomerService } from './customer/customer.service';
import { CustomerRepository } from './customer/customer.repository';
import { SupplierController } from './supplier/supplier.controller';
import { SupplierService } from './supplier/supplier.service';
import { SupplierRepository } from './supplier/supplier.repository';
import {
  CustomerProductCodeController,
  CustomerProductCodeSearchController,
} from './customer-product-code/customer-product-code.controller';
import { CustomerProductCodeService } from './customer-product-code/customer-product-code.service';
import {
  SupplierProductCodeController,
  SupplierProductCodeSearchController,
} from './supplier-product-code/supplier-product-code.controller';
import { SupplierProductCodeService } from './supplier-product-code/supplier-product-code.service';

@Module({
  controllers: [
    CustomerController,
    SupplierController,
    CustomerProductCodeController,
    CustomerProductCodeSearchController,
    SupplierProductCodeController,
    SupplierProductCodeSearchController,
  ],
  providers: [
    CustomerService,
    CustomerRepository,
    SupplierService,
    SupplierRepository,
    CustomerProductCodeService,
    SupplierProductCodeService,
  ],
  exports: [CustomerService, SupplierService, CustomerProductCodeService, SupplierProductCodeService],
})
export class ContactModule {}
