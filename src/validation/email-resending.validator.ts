import { Injectable } from '@nestjs/common';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg-query-users.repository';
import { PgEmailConfirmationRepository } from '../modules/super-admin/infrastructure/pg-email-confirmation.repository';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { request } from 'express';

@ValidatorConstraint({ name: 'EmailResendingValidator', async: true })
@Injectable()
export class EmailResendingValidator implements ValidatorConstraintInterface {
  constructor(
    protected emailConfirmationService: PgEmailConfirmationRepository,
    protected queryUsersRepository: PgQueryUsersRepository,
  ) {}

  async validate(email) {
    const user = await this.queryUsersRepository.getUserByLoginOrEmail(email);

    if (!user) {
      return false;
    }

    const isConfirmed = await this.emailConfirmationService.checkConfirmation(
      user.id,
    );

    if (isConfirmed) {
      return false;
    }

    request.user = user;
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Email is already confirm';
  }
}
