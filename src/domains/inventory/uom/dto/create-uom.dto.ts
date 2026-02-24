import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  uom_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  uom_name: string;
}
