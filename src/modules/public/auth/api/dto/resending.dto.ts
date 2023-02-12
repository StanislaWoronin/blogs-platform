import { IsEmail, Validate } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { EmailResendingValidator } from '../../../../../validation/email-resending.validator';

export class ResendingDto {
  @IsEmail()
  @Transform(({ value }) => value?.trim())
  @Validate(EmailResendingValidator)
  email: string;
}
