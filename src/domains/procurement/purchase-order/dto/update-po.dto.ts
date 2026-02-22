import { IsIn, IsString } from 'class-validator';

export class UpdatePOStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'RECEIVED', 'CLOSED', 'PENDING_PRICE_APPROVAL', 'REJECTED'])
  status: string;
}
