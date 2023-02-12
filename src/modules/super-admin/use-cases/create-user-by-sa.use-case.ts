import { Injectable } from '@nestjs/common';
import { EmailConfirmationModel } from '../infrastructure/entity/emailConfirmation.model';
import { UsersService } from '../application/users.service';
import { toCreateUserViewModel } from '../../../data-mapper/to-create-user-view.model';
import { v4 as uuidv4 } from 'uuid';
import { UserViewModelWithBanInfo } from '../api/dto/user.view.model';
import { UserDto } from '../api/dto/user.dto';

@Injectable()
export class CreateUserBySaUseCase {
  constructor(protected usersService: UsersService) {}

  async execute(dto: UserDto): Promise<UserViewModelWithBanInfo> {
    const userId = uuidv4();
    const emailConfirmation = new EmailConfirmationModel(
      userId,
      null,
      null,
      true,
    );

    const createdUser = await this.usersService.createUser(
      dto,
      emailConfirmation,
      userId,
    );
    const viewUser = toCreateUserViewModel(createdUser);

    return viewUser;
  }
}
