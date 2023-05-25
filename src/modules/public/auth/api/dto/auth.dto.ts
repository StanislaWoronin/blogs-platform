import { IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Length(3)
  loginOrEmail: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @Length(6, 20)
  password: string;
}
