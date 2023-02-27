import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { CreatedUserModel, UserDBModel } from "../entity/userDB.model";
import { Users } from "../entity/users.entity";
import {Comments} from "../../../public/comments/infrastructure/entity/comments.entity";

@Injectable()
export class OrmUsersRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async createUser(newUser: UserDBModel): Promise<CreatedUserModel | null> {
    try {
      const result = await this.dataSource.getRepository(Users)
        .save(newUser)

      return {
        id: result.id,
        login: result.login,
        email: result.email,
        createdAt: result.createdAt
      }
    } catch (e) {
      return null
    }
  }

  async updateUserPassword(
    userId: string,
    passwordSalt: string,
    passwordHash: string,
  ): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Users)
      .set({
        passwordSalt,
        passwordHash
      })
      .where("id = :id", {id: userId})
      .execute()

    if (result.affected != 1) {
      return false
    }
    return true
  }

  async deleteUserById(userId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Users)
      .where("id = :id", {id: userId})
      .execute()

    if (result.affected != 1) {
      return false
    }
    return true
  }
}