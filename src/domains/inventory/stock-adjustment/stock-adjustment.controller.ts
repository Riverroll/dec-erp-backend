import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { StockAdjustmentService } from './stock-adjustment.service';
import { CreateStockAdjustmentDto } from './dto/create-adjustment.dto';

@ApiTags('Inventory — Stock Adjustments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/stock-adjustments')
export class StockAdjustmentController {
  constructor(private readonly service: StockAdjustmentService) {}

  @Post()
  create(@Body() dto: CreateStockAdjustmentDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }
}
