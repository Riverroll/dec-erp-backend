import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

import { RFQRepository } from './rfq/rfq.repository';
import { RFQService } from './rfq/rfq.service';
import { RFQController } from './rfq/rfq.controller';

import { SalesOrderRepository } from './sales-order/sales-order.repository';
import { SalesOrderService } from './sales-order/sales-order.service';
import { SalesOrderController } from './sales-order/sales-order.controller';

import { DeliveryOrderRepository } from './delivery-order/delivery-order.repository';
import { DeliveryOrderService } from './delivery-order/delivery-order.service';
import { DeliveryOrderController } from './delivery-order/delivery-order.controller';

import { InvoiceRepository } from './invoice/invoice.repository';
import { InvoiceService } from './invoice/invoice.service';
import { InvoiceController } from './invoice/invoice.controller';

import { ARPaymentRepository } from './ar-payment/ar-payment.repository';
import { ARPaymentService } from './ar-payment/ar-payment.service';
import { ARPaymentController } from './ar-payment/ar-payment.controller';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [
    RFQController,
    SalesOrderController,
    DeliveryOrderController,
    InvoiceController,
    ARPaymentController,
  ],
  providers: [
    RFQRepository, RFQService,
    SalesOrderRepository, SalesOrderService,
    DeliveryOrderRepository, DeliveryOrderService,
    InvoiceRepository, InvoiceService,
    ARPaymentRepository, ARPaymentService,
  ],
  exports: [RFQService, SalesOrderService, DeliveryOrderService, InvoiceService, ARPaymentService],
})
export class SalesModule {}
