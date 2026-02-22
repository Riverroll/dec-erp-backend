import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'WH-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  warehouse_code: string;

  @ApiProperty({ example: 'Gudang Pusat Jakarta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  warehouse_name: string;

  @ApiPropertyOptional({ example: 'Jl. Industri Raya No.1, Jakarta' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+6221-1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contact_phone?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manager_name?: string;
}
