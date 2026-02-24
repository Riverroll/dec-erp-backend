import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdatePOStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'PENDING_APPROVAL', 'PENDING_PRICE_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'RECEIVED', 'CLOSED', 'CANCELLED'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
