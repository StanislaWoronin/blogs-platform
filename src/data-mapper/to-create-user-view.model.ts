import {
  CreatedUserModel,
  UserWithBanInfo,
} from '../modules/super-admin/infrastructure/entity/userDB.model';
import { BanInfoModel } from '../modules/super-admin/infrastructure/entity/banInfo.model';
import { UserViewModelWithBanInfo } from '../modules/super-admin/api/dto/user.view.model';

export const toCreateUserViewModel = (
  user: CreatedUserModel,
): UserViewModelWithBanInfo => {
  return {
    id: user.id,
    login: user.login,
    email: user.email,
    createdAt: user.createdAt,
    banInfo: {
      isBanned: false,
      banDate: null,
      banReason: null,
    },
  };
};

export const toUserViewModel = (user: UserWithBanInfo) => {
  return {
    id: user.id,
    login: user.login,
    email: user.email,
    createdAt: user.createdAt,
    banInfo: {
      isBanned: user.isBanned,
      banDate: user.banDate,
      banReason: user.banReason,
    },
  };
};
