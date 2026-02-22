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

@Module({
  controllers: [
    CustomerController,
    SupplierController,
    CustomerProductCodeController,
    CustomerProductCodeSearchController,
  ],
  providers: [
    CustomerService,
    CustomerRepository,
    SupplierService,
    SupplierRepository,
    CustomerProductCodeService,
  ],
  exports: [CustomerService, SupplierService, CustomerProductCodeService],
})
export class ContactModule {}
