import { CreatedUserModel, UserDBModel } from './entity/userDB.model';

export interface IUsersRepository {
  createUser(newUser: UserDBModel): Promise<CreatedUserModel | null>;
  updateUserPassword(
    userId: string,
    passwordSalt: string,
    passwordHash: string,
  ): Promise<boolean>;
  deleteUserById(userId: string): Promise<boolean>;
}

export const IUsersRepository = 'IUsersRepository';
