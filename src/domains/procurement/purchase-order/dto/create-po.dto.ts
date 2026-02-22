import { Type } from 'class-transformer';
import {
  IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, ValidateNested,
} from 'class-validator';

export class CreatePOItemDto {
  @IsInt()
  product_id: number;

  @IsOptional()
  @IsInt()
  warehouse_id?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  qty: number;

  @IsNumber()
  @Type(() => Number)
  unit_price: number;
}

export class CreatePODto {
  @IsInt()
  supplier_id: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ppn_rate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePOItemDto)
  items: CreatePOItemDto[];
}
