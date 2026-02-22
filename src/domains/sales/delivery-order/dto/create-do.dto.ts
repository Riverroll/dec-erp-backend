import { Type } from 'class-transformer';
import {
  IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, ValidateNested,
} from 'class-validator';

export class CreateDOItemDto {
  @IsInt()
  product_id: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  qty: number;

  @IsNumber()
  @Type(() => Number)
  unit_price: number;
}

export class CreateDODto {
  @IsInt()
  so_id: number;

  @IsInt()
  customer_id: number;

  @IsInt()
  warehouse_id: number;

  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Surat Jalan fields
  @IsOptional()
  @IsString()
  surat_jalan_number?: string;

  @IsOptional()
  @IsString()
  recipient_name?: string;

  @IsOptional()
  @IsString()
  recipient_phone?: string;

  @IsOptional()
  @IsString()
  vehicle_number?: string;

  @IsOptional()
  @IsString()
  driver_name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDOItemDto)
  items: CreateDOItemDto[];
}
