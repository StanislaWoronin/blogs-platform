import { IsString, Length, Validate } from 'class-validator';
import { ConfirmationCodeValidator } from '../../../../../validation/confirmation-code.validator';
import { PasswordRecoveryValidator } from "../../../../../validation/password-recovery.validator";

export class NewPasswordDto {
  @IsString()
  @Length(6, 20)
  newPassword: string;

  @IsString()
  @Validate(PasswordRecoveryValidator)
  recoveryCode: string;
}
