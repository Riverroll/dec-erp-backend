import { IsArray, IsInt, IsNumber, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyMarkupDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  product_ids: number[];

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  markup_pct: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  brand_id: number;

  @ApiProperty()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year: number;
}
