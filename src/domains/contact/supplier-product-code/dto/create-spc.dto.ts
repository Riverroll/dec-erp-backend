import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierProductCodeDto {
  @IsInt()
  product_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  supplier_product_code: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierProductCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  supplier_product_code: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
