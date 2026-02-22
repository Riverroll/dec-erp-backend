import { IsIn, IsString } from 'class-validator';

export class UpdateDOStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status: string;
}
