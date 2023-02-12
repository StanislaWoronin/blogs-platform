import { Injectable } from '@nestjs/common';
import { EmailConfirmationModel } from '../infrastructure/entity/emailConfirmation.model';
import add from 'date-fns/add';
import { v4 as uuidv4 } from 'uuid';
import { settings } from '../../../settings';
import { EmailManager } from '../../public/auth/email-transfer/email.manager';
import { UsersService } from '../application/users.service';
import { UserDto } from '../api/dto/user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    protected emailManager: EmailManager,
    protected usersService: UsersService,
  ) {}

  async execute(dto: UserDto): Promise<boolean> {
    const userId = uuidv4();
    const emailConfirmation = new EmailConfirmationModel(
      userId,
      uuidv4(),
      add(new Date(), {
        hours: Number(settings.timeLife.CONFIRMATION_CODE),
      }).toISOString(),
      false,
    );

    await this.emailManager.sendConfirmationEmail(
      dto.email,
      emailConfirmation.confirmationCode,
    );
    // console.log(
    //   'confirmationCode:',
    //   emailConfirmation.confirmationCode,
    //   'from use-case for registration',
    // );
    await this.usersService.createUser(dto, emailConfirmation, userId);
    return true;
  }
}
