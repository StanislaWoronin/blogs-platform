import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PgEmailConfirmationRepository } from '../modules/super-admin/infrastructure/pg-email-confirmation.repository';
import { request } from 'express';

@ValidatorConstraint({ name: 'ConfirmationCodeValidator', async: true })
@Injectable()
export class PasswordRecoveryValidator implements ValidatorConstraintInterface {
  constructor(
    protected emailConfirmationRepository: PgEmailConfirmationRepository,
  ) {}

  async validate(code: string) {
    const emailConfirmation =
      await this.emailConfirmationRepository.getEmailConfirmationByCode(code);

    if (!emailConfirmation) {
      return false;
    }

    if (new Date(emailConfirmation.expirationDate) > new Date()) { //TODO изменил знак
      return false;
    }

    request.emailConfirmation = emailConfirmation;
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password recovery is not valid';
  }
}
