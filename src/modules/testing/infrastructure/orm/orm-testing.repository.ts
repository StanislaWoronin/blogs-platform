import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { EmailConfirmation } from "../../../super-admin/infrastructure/entity/email-confirmation.entity";

@Injectable()
export class OrmTestingRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getConfirmationCode(userId: string)/*: Promise<{ confirmationCode: string }>*/ {
    const result = await this.dataSource
      .getRepository('email_confirmation')
      .createQueryBuilder('ec')
      .select('ec.confirmationCode')
      .where('ec.userId = :id', { id: userId })
      .getOne();

    return result;
  }

  async checkUserConfirmed(userId: string)/*: Promise<{isConfirmed: boolean}>*/ {
    const result = await this.dataSource
      .getRepository('email_confirmation')
      .createQueryBuilder('ec')
      .select('ec.isConfirmed')
      .where('ec.userId = :id', { id: userId })
      .getOne();

    return result;
  }

  async getUserPassword(userId: string)/*: Promise<{passwordHash: string}>*/ {
    const result = await this.dataSource
      .getRepository('users')
      .createQueryBuilder('u')
      .select('u.passwordHash')
      .where('u.id = :id', { id: userId })
      .getOne();

    return result;
  }

  async makeExpired(userId: string, expirationDate: string): Promise<boolean> {
    const result = await this.dataSource
      .getRepository('email_confirmation')
      .createQueryBuilder('ec')
      .update()
      .set({
        expirationDate,
      })
      .where('userId = :id', { id: userId })
      .execute();

    if (result.affected !== 1) {
      return false;
    }
    return true;
  }

  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`
      DELETE FROM post_reactions;
      DELETE FROM security;    
      DELETE FROM banned_blog;
      DELETE FROM banned_post;
      DELETE FROM banned_users_for_blog;
      DELETE FROM comment_reactions;
      DELETE FROM comments;
      DELETE FROM posts;
      DELETE FROM blogs;
      DELETE FROM user_ban_info;
      DELETE FROM security;
      DELETE FROM email_confirmation;
      DELETE FROM token_black_list;
      DELETE FROM users; 
    `);

    return true
  }
}
