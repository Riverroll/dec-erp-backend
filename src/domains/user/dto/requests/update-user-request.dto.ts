import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserRequestDto } from './create-user-request.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export class UpdateUserRequestDto extends PartialType(
  OmitType(CreateUserRequestDto, ['password'] as const),
) {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
