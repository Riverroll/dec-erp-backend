import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

import { PurchaseOrderRepository } from './purchase-order/purchase-order.repository';
import { PurchaseOrderService } from './purchase-order/purchase-order.service';
import { PurchaseOrderController } from './purchase-order/purchase-order.controller';

import { GoodsReceiptRepository } from './goods-receipt/goods-receipt.repository';
import { GoodsReceiptService } from './goods-receipt/goods-receipt.service';
import { GoodsReceiptController } from './goods-receipt/goods-receipt.controller';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [PurchaseOrderController, GoodsReceiptController],
  providers: [
    PurchaseOrderRepository, PurchaseOrderService,
    GoodsReceiptRepository, GoodsReceiptService,
  ],
  exports: [PurchaseOrderService, GoodsReceiptService],
})
export class ProcurementModule {}
