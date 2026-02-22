import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional,
  IsPositive, IsString, ValidateNested,
} from 'class-validator';

export class CreateSOItemDto {
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

export class CreateSODto {
  @IsInt()
  customer_id: number;

  @IsOptional()
  @IsInt()
  rfq_id?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ppn_rate?: number;

  @IsOptional()
  @IsBoolean()
  is_indent?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSOItemDto)
  items: CreateSOItemDto[];
}
