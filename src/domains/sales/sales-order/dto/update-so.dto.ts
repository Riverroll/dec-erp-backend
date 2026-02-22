import { IsIn, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateSODto } from './create-so.dto';

export class UpdateSODto extends PartialType(CreateSODto) {}

export class UpdateSOStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
  status: string;
}
