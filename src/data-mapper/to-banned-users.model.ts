import { DbBannedUsersModel } from '../modules/super-admin/infrastructure/entity/db-banned-users.model';
import { ViewBannedUser } from '../modules/blogger/api/dto/view-banned-users.model';

export const toBannedUsersModel = (
  user: DbBannedUsersModel,
): ViewBannedUser => {
  return {
    id: user.id,
    login: user.login,
    banInfo: {
      isBanned: true,
      banDate: user.banDate,
      banReason: user.banReason,
    },
  };
};
