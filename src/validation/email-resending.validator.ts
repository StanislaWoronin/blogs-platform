import {Inject, Injectable} from '@nestjs/common';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-query-users.repository';
import { PgEmailConfirmationRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-email-confirmation.repository';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { request } from 'express';
import {IEmailConfirmationRepository} from "../modules/super-admin/infrastructure/i-email-confirmation.repository";

@ValidatorConstraint({ name: 'EmailResendingValidator', async: true })
@Injectable()
export class EmailResendingValidator implements ValidatorConstraintInterface {
  constructor(
      @Inject(IEmailConfirmationRepository) protected emailConfirmationRepository: IEmailConfirmationRepository,
    protected queryUsersRepository: PgQueryUsersRepository,
  ) {}

  async validate(email) {
    const user = await this.queryUsersRepository.getUserByLoginOrEmail(email);

    if (!user) {
      return false;
    }

    const isConfirmed = await this.emailConfirmationRepository.checkConfirmation(
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
