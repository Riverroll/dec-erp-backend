import {
  IsString,
  IsNotEmpty,
  IsOptional,
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

export class CreateSupplierPICDto {
  @ApiProperty({ example: 'Siti Rahayu' })
  @IsString()
  @IsNotEmpty()
  pic_name: string;

  @ApiPropertyOptional({ example: 'Sales Manager' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: '+62822345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'siti@supplier.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class CreateSupplierDto {
  @ApiProperty({ example: 'SUPP-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  supplier_code: string;

  @ApiProperty({ example: 'PT Kabel Indo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  supplier_name: string;

  @ApiPropertyOptional({ example: 'PT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  business_type?: string;

  @ApiPropertyOptional({ example: '02.345.678.9-000.001' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  npwp?: string;

  @ApiPropertyOptional({ example: 'Jl. Industri No.5, Bekasi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  payment_terms?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [CreateSupplierPICDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPICDto)
  pics?: CreateSupplierPICDto[];
}
