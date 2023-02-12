import {
  IsEmail,
  IsString,
  Length,
  MinLength,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EmailExistValidator } from '../../../../validation/email-exist-validator.service';
import { LoginExistValidator } from '../../../../validation/login-exist-validator.service';

export class UserDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Validate(LoginExistValidator)
  @Length(3, 10)
  login: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @Length(6, 20)
  password: string;

  @IsEmail()
  @Transform(({ value }) => value?.trim())
  @Validate(EmailExistValidator)
  @MinLength(3)
  email: string;
}
