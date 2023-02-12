import { registerDecorator, ValidationOptions } from 'class-validator';
import { LoginExistValidator } from '../validation/login-exist-validator.service';

export function LoginExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'LoginExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: LoginExistValidator,
    });
  };
}
