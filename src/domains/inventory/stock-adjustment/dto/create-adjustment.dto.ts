import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from 'class-validator';

export class CreateStockAdjustmentDto {
  @IsInt()
  product_id: number;

  @IsInt()
  warehouse_id: number; // source warehouse (or only warehouse for IN/OUT)

  @IsString()
  @IsIn(['IN', 'OUT', 'TRANSFER'])
  movement_type: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unit_cost?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // Required only for TRANSFER
  @ValidateIf((o) => o.movement_type === 'TRANSFER')
  @IsInt()
  destination_warehouse_id?: number;
}
