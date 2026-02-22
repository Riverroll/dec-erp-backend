import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRFQItemDto {
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

export class CreateRFQDto {
  @IsInt()
  customer_id: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ppn_rate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRFQItemDto)
  items: CreateRFQItemDto[];
}
