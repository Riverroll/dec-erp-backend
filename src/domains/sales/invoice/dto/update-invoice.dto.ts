import { IsIn, IsString } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'])
  status: string;
}
