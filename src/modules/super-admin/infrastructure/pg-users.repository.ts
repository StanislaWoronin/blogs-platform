import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreatedUserModel, UserDBModel } from './entity/userDB.model';

@Injectable()
export class PgUsersRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createUser(newUser: UserDBModel): Promise<CreatedUserModel | null> {
    const query = `
      INSERT INTO public.users
             (id, login, email, "passwordSalt", "passwordHash", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, login, email, "createdAt"; 
    `;

    const result = await this.dataSource.query(query, [
      newUser.id,
      newUser.login,
      newUser.email,
      newUser.passwordSalt,
      newUser.passwordHash,
      newUser.createdAt,
    ]);

    return result[0];
  }

  async updateUserPassword(
    userId: string,
    passwordSalt: string,
    passwordHash: string,
  ): Promise<boolean> {
    const query = `
      UPDATE public.users
         SET "passwordSalt" = '${passwordSalt}', "passwordHash" = '${passwordHash}'
       WHERE id = $1;
    `;
    const result = await this.dataSource.query(query, [userId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deleteUserById(userId: string): Promise<boolean> {
    // const query = `
    //   DELETE FROM public.users
    //    WHERE id = $1;
    // `;

    const query = `
      DELETE FROM public.users u
       WHERE id = $1;
    `;
    const result = await this.dataSource.query(query, [userId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }
}
