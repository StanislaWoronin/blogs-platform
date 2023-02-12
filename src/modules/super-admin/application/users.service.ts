import { Injectable } from '@nestjs/common';
import {
  CreatedUserModel,
  UserDBModel,
} from '../infrastructure/entity/userDB.model';
import { BanUserDTO } from '../api/dto/ban-user.dto';
import { PgUsersRepository } from '../infrastructure/pg-users.repository';
import { PgEmailConfirmationRepository } from '../infrastructure/pg-email-confirmation.repository';
import { PgBanInfoRepository } from '../infrastructure/pg-ban-info.repository';
import { _generateHash } from '../../../helper.functions';
import { BanInfoModel } from '../infrastructure/entity/banInfo.model';
import { EmailConfirmationModel } from '../infrastructure/entity/emailConfirmation.model';
import { UserDto } from '../api/dto/user.dto';
import { UserViewModelWithBanInfo } from '../api/dto/user.view.model';

@Injectable()
export class UsersService {
  constructor(
    protected banInfoRepository: PgBanInfoRepository,
    protected emailConfirmationRepository: PgEmailConfirmationRepository,
    protected usersRepository: PgUsersRepository,
  ) {}

  async createUser(
    dto: UserDto,
    emailConfirmation: EmailConfirmationModel,
    userId: string,
  ): Promise<CreatedUserModel> {
    const hash = await _generateHash(dto.password);

    const user = new UserDBModel(
      userId,
      dto.login,
      dto.email,
      hash.passwordSalt,
      hash.passwordHash,
      new Date().toISOString(),
    );

    const banInfo = new BanInfoModel(userId, false, null, null, null);

    const createdUser = await this.usersRepository.createUser(user);
    await this.banInfoRepository.createBanInfo(banInfo);
    await this.emailConfirmationRepository.createEmailConfirmation(
      emailConfirmation,
    );

    return createdUser;
  }

  async updateUserPassword(
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    const hash = await _generateHash(newPassword);

    return await this.usersRepository.updateUserPassword(
      userId,
      hash.passwordSalt,
      hash.passwordHash,
    );
  }

  async updateBanStatus(userId: string, dto: BanUserDTO): Promise<boolean> {
    let banDate = null;
    let banReason = null;
    if (dto.isBanned) {
      banDate = new Date().toISOString();
      banReason = dto.banReason;
    }

    return this.banInfoRepository.saUpdateUserBanStatus(
      userId,
      dto.isBanned,
      banReason,
      banDate,
    );
  }

  async deleteUserById(userId: string): Promise<boolean> {
    await this.banInfoRepository.deleteUserBanInfoById(userId);
    await this.emailConfirmationRepository.deleteEmailConfirmationById(userId);
    const userDeleted = await this.usersRepository.deleteUserById(userId); // TODO mb just need cascade delete

    if (!userDeleted) {
      return false;
    }

    return true;
  }
}
