import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  loginOrEmail: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  password: string;
}
