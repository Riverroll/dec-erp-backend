import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCustomerPICDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  pic_name: string;

  @ApiPropertyOptional({ example: 'Procurement Manager' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: '+62811234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'budi@company.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'CUST-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customer_code: string;

  @ApiProperty({ example: 'PT Sumber Makmur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customer_name: string;

  @ApiPropertyOptional({ example: 'PT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  business_type?: string;

  @ApiPropertyOptional({ example: 'Konstruksi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ example: '01.234.567.8-900.000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  npwp?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No.1, Jakarta' })
  @IsOptional()
  @IsString()
  billing_address?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No.1, Jakarta' })
  @IsOptional()
  @IsString()
  shipping_address?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  payment_terms?: number;

  @ApiPropertyOptional({ example: 50000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit_limit?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sales_person_id?: number;

  @ApiPropertyOptional({ type: [CreateCustomerPICDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerPICDto)
  pics?: CreateCustomerPICDto[];
}
