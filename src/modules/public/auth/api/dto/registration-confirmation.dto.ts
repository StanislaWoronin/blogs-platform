import { IsString, Validate } from 'class-validator';
import { ConfirmationCodeValidator } from '../../../../../validation/confirmation-code.validator';

export class RegistrationConfirmationDTO {
  @IsString()
  @Validate(ConfirmationCodeValidator)
  code: string;
}
