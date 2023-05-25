import { Inject, Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-query-users.repository';
import { IQueryUsersRepository } from '../modules/super-admin/infrastructure/i-query-users.repository';

@Injectable()
@ValidatorConstraint({ name: 'login', async: true })
export class LoginExistValidator implements ValidatorConstraintInterface {
  constructor(
    @Inject(IQueryUsersRepository)
    protected queryUsersRepository: IQueryUsersRepository,
  ) {}

  async validate(login) {
    const user =
      await this.queryUsersRepository.isLoginOrEmailExistForValidation(login);

    if (user) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'This login already exists';
  }
}
