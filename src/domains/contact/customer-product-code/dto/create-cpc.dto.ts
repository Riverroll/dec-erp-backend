import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerProductCodeDto {
  @IsInt()
  product_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customer_product_code: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerProductCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customer_product_code: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
