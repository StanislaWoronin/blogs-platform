import {Body, Controller, Delete, Get, HttpCode, Param, Put} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {JwtService} from "../public/auth/application/jwt.service";

@Controller('testing')
export class TestingController {
  constructor(@InjectDataSource() private dataSource: DataSource,
              private jwtService: JwtService) {}

  @Get('confirmation-code/:userId')
  async getConfirmationCode(@Param('userId') userId: string) {
    const result = await this.dataSource.query(`
      SELECT "confirmationCode"
        FROM public.email_confirmation
       WHERE "userId" = '${userId}'
    `)

    return result[0]
  }

  @Get('is-confirmed/:userId')
  async checkUserConfirmed(@Param('userId') userId: string) {
    const result = await this.dataSource.query(`
      SELECT "isConfirmed"
        FROM public.email_confirmation
       WHERE "userId" = '${userId}'
    `)

    return result[0]
  }

  @Get('user-password/:userId')
  async getUserPassword(@Param('userId') userId: string) {
    const result = await this.dataSource.query(`
      SELECT "passwordHash"
        FROM public.users
       WHERE id = '${userId}'
    `)

    return result[0]
  }

  @Get('expired-token/:token')
  async getExpiredToken(@Param('token') token: string) {
    const tokenPayload = await this.jwtService.getTokenPayload(token)

    return { expiredToken: await this.jwtService.createJWT(tokenPayload.userId, tokenPayload.deviceId, 0) }
  }

  @Put('set-expiration-date/:userId')
  @HttpCode(204)
  async makeExpired(@Param('userId') userId: string) {
    const expirationDate = new Date(Date.now() - 48 * 1000).toISOString()
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

  @Delete('all-data')
  @HttpCode(204)
  async deleteAll() {
    await this.dataSource.query(`
      DELETE FROM post_reactions;
      DELETE FROM security;    
      DELETE FROM banned_blog;
      DELETE FROM banned_post;
      DELETE FROM banned_users_for_blog;
      DELETE FROM comments;
      DELETE FROM comment_reactions;
      DELETE FROM posts;
      DELETE FROM blogs;
      DELETE FROM user_ban_info;
      DELETE FROM security;
      DELETE FROM email_confirmation;
      DELETE FROM token_black_list;
      DELETE FROM users; 
    `);
  }


}
