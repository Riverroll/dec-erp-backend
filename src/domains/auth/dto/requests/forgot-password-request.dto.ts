import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: 'user@dec.com' })
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or username
}
