import {Inject, Injectable} from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PgEmailConfirmationRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-email-confirmation.repository';
import { request } from 'express';
import {IEmailConfirmationRepository} from "../modules/super-admin/infrastructure/i-email-confirmation.repository";

@ValidatorConstraint({ name: 'ConfirmationCodeValidator', async: true })
@Injectable()
export class ConfirmationCodeValidator implements ValidatorConstraintInterface {
  constructor(
    @Inject(IEmailConfirmationRepository) protected emailConfirmationRepository: IEmailConfirmationRepository,
  ) {}

  async validate(code: string) {
    const emailConfirmation =
      await this.emailConfirmationRepository.getEmailConfirmationByCode(code);

    if (!emailConfirmation) {
      return false;
    }

    if (emailConfirmation.isConfirmed === true) {
      return false;
    }

    if (new Date(emailConfirmation.expirationDate) < new Date()) {
      return false;
    }

    request.emailConfirmation = emailConfirmation;
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Confirmation code is not valid';
  }
}
