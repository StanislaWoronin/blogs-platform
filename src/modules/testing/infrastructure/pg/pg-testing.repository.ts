import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class PgTestingRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getConfirmationCode(userId: string) {
    const result = await this.dataSource.query(`
      SELECT "confirmationCode"
        FROM public.email_confirmation
       WHERE "userId" = '${userId}'
    `)

    return result[0]
  }

  async checkUserConfirmed(userId: string) {
    const result = await this.dataSource.query(`
      SELECT "isConfirmed"
        FROM public.email_confirmation
       WHERE "userId" = '${userId}'
    `)

    return result[0]
  }

  async getUserPassword(userId: string) {
    const result = await this.dataSource.query(`
      SELECT "passwordHash"
        FROM public.users
       WHERE id = '${userId}'
    `)

    return result[0]
  }

  async makeExpired(userId: string, expirationDate: string) {
    const result = await this.dataSource.query(`
      UPDATE public.email_confirmation
         SET "expirationDate" = '${expirationDate}'
       WHERE "userId" = '${userId}';
    `);

    if (result[1] !== 1) {
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
