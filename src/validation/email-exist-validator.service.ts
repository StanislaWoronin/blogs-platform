import { Inject, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-query-users.repository';
import { IQueryUsersRepository } from "../modules/super-admin/infrastructure/i-query-users.repository";

@Injectable()
@ValidatorConstraint({ name: 'email', async: true })
export class EmailExistValidator implements ValidatorConstraintInterface {
  constructor(
    @Inject(IQueryUsersRepository) protected queryUsersRepository: IQueryUsersRepository
  ) {}

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
