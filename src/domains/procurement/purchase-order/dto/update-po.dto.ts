import { IsIn, IsString } from 'class-validator';

export class UpdatePOStatusDto {
  @IsString()
  @IsIn(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'])
  status: string;
}
