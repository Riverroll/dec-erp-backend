import { IsIn, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateRFQDto } from './create-rfq.dto';

export class UpdateRFQDto extends PartialType(CreateRFQDto) {}

export class UpdateRFQStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CLOSED', 'PENDING_PRICE_APPROVAL'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
