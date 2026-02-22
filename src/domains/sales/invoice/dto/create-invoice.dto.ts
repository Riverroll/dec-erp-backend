import { Type } from 'class-transformer';
import {
  IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsPositive, IsString, ValidateNested,
} from 'class-validator';

export class CreateInvoiceItemDto {
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

export class CreateInvoiceDto {
  @IsInt()
  do_id: number;

  @IsInt()
  customer_id: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ppn_rate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
