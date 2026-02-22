import { Type } from 'class-transformer';
import {
  IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, ValidateNested,
} from 'class-validator';

export class CreateGRItemDto {
  @IsInt()
  product_id: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  qty_ordered: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  qty_received: number;

  @IsNumber()
  @Type(() => Number)
  unit_cost: number;
}

export class CreateGRDto {
  @IsInt()
  po_id: number;

  @IsInt()
  supplier_id: number;

  @IsInt()
  warehouse_id: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGRItemDto)
  items: CreateGRItemDto[];
}
