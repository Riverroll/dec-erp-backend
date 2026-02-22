import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'PRD-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  product_code: string;

  @ApiProperty({ example: 'Kabel NYY 4x10mm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  product_name: string;

  @ApiPropertyOptional({ example: 'Kabel listrik 4 core 10mm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  default_selling_price?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  default_purchase_price?: number;

  @ApiProperty({ example: 'Meter' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  uom: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  category_id?: number;

  @ApiPropertyOptional({ example: 'https://example.com/img.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;
}
