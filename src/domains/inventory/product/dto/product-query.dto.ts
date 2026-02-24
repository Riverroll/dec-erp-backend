import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class ProductQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by brand ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  brand_id?: number;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number;
}
