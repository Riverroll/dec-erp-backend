import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateARPaymentDto {
  @IsInt()
  invoice_id: number;

  @IsInt()
  customer_id: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @IsIn(['TRANSFER', 'CASH', 'GIRO', 'CHECK', 'CHEQUE'])
  method?: string;

  @IsOptional()
  @IsDateString()
  payment_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
