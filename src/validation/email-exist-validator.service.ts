import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg-query-users.repository';

@Injectable()
@ValidatorConstraint({ name: 'email', async: true })
export class EmailExistValidator implements ValidatorConstraintInterface {
  constructor(protected queryUsersRepository: PgQueryUsersRepository) {}

  async validate(email) {
    const user =
      await this.queryUsersRepository.isLoginOrEmailExistForValidation(email);

    if (user) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'This email already exists';
  }
}
