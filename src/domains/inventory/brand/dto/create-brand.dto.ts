import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  brand_code: string;

  @IsString()
  brand_name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount_pct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  markup_pct?: number;
}
