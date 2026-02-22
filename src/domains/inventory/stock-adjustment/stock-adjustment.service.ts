import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStockAdjustmentDto } from './dto/create-adjustment.dto';

@Injectable()
export class StockAdjustmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStockAdjustmentDto, createdBy: number) {
    // Check current stock for OUT movements
    if (dto.movement_type === 'OUT' || dto.movement_type === 'TRANSFER') {
      const stock = await this.prisma.warehouseStock.findUnique({
        where: {
          product_id_warehouse_id: {
            product_id: dto.product_id,
            warehouse_id: dto.warehouse_id,
          },
        },
      });
      const current = Number(stock?.quantity ?? 0);
      if (current < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Current: ${current}, Requested: ${dto.quantity}`,
        );
      }
    }

    if (dto.movement_type === 'TRANSFER') {
      // TRANSFER: deduct from source, add to destination, create two movement records
      if (!dto.destination_warehouse_id) {
        throw new BadRequestException('destination_warehouse_id is required for TRANSFER');
      }

      // Deduct from source warehouse
      await this.prisma.warehouseStock.upsert({
        where: {
          product_id_warehouse_id: {
            product_id: dto.product_id,
            warehouse_id: dto.warehouse_id,
          },
        },
        update: { quantity: { decrement: dto.quantity } },
        create: { product_id: dto.product_id, warehouse_id: dto.warehouse_id, quantity: 0 },
      });

      // Add to destination warehouse
      await this.prisma.warehouseStock.upsert({
        where: {
          product_id_warehouse_id: {
            product_id: dto.product_id,
            warehouse_id: dto.destination_warehouse_id,
          },
        },
        update: { quantity: { increment: dto.quantity } },
        create: {
          product_id: dto.product_id,
          warehouse_id: dto.destination_warehouse_id,
          quantity: dto.quantity,
        },
      });

      // OUT movement at source
      await this.prisma.stockMovement.create({
        data: {
          product_id: dto.product_id,
          warehouse_id: dto.warehouse_id,
          movement_type: 'OUT',
          quantity: dto.quantity,
          reference_type: 'TRANSFER',
          unit_cost: dto.unit_cost,
          notes: dto.notes ?? `Transfer to warehouse #${dto.destination_warehouse_id}`,
          created_by: createdBy,
        },
      });

      // IN movement at destination
      const movement = await this.prisma.stockMovement.create({
        data: {
          product_id: dto.product_id,
          warehouse_id: dto.destination_warehouse_id,
          movement_type: 'IN',
          quantity: dto.quantity,
          reference_type: 'TRANSFER',
          unit_cost: dto.unit_cost,
          notes: dto.notes ?? `Transfer from warehouse #${dto.warehouse_id}`,
          created_by: createdBy,
        },
        include: {
          product: { select: { product_name: true, product_code: true, uom: true } },
          warehouse: { select: { warehouse_name: true } },
        },
      });

      return movement;
    }

    // IN or OUT
    await this.prisma.warehouseStock.upsert({
      where: {
        product_id_warehouse_id: {
          product_id: dto.product_id,
          warehouse_id: dto.warehouse_id,
        },
      },
      update: {
        quantity:
          dto.movement_type === 'IN'
            ? { increment: dto.quantity }
            : { decrement: dto.quantity },
      },
      create: {
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        quantity: dto.movement_type === 'IN' ? dto.quantity : 0,
      },
    });

    const movement = await this.prisma.stockMovement.create({
      data: {
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        movement_type: dto.movement_type,
        quantity: dto.quantity,
        reference_type: 'ADJUST',
        unit_cost: dto.unit_cost,
        notes: dto.notes,
        created_by: createdBy,
      },
      include: {
        product: { select: { product_name: true, product_code: true, uom: true } },
        warehouse: { select: { warehouse_name: true } },
      },
    });

    return movement;
  }
}
