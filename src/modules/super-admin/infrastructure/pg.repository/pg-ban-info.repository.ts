import { Injectable } from '@nestjs/common';
import { BanInfoModel } from '../entity/banInfo.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {UserBanInfo} from "../entity/user-ban-info.entity";
import {BannedUsersForBlog} from "../../../public/blogs/infrastructure/entity/banned-users-for-blog.entity";
import {BannedBlog} from "../entity/banned_blog.entity";
import {BannedPost} from "../entity/banned-post.entity";

@Injectable()
export class PgBanInfoRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getBanInfo(userId: string): Promise<BanInfoModel | null> {
    const query = `
      SELECT "userId", "banStatus" as "isBanned", "banDate", "banReason"
        FROM public.user_ban_info
       WHERE "userId" = $1;
    `;
    const result = await this.dataSource.query(query, [userId]);

    return result[0];
  }

  async createBanInfo(banInfo: BanInfoModel): Promise<BanInfoModel> {
    await this.dataSource.query(`
        INSERT INTO public.user_ban_info
               ("userId", "banStatus", "banReason", "banDate")
        VALUES ('${banInfo.userId}', '${banInfo.isBanned}', null, null)
    `);

    return banInfo;
  }

  async saUpdateUserBanStatus(
      userId: string,
      banStatus: boolean,
      banReason: string | null,
      banDate: Date | null,
  ): Promise<boolean> {
    const filter = this.getUpdateFilter(banStatus, banReason, banDate);
    const result = await this.dataSource.query(`
       UPDATE public.user_ban_info
          SET ${filter}
        WHERE "userId" = '${userId}';
    `);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deleteUserBanInfoById(userId: string): Promise<boolean> {
    const query = `
      DELETE
        FROM public.user_ban_info
       WHERE "userId" = $1;
    `;
    const result = await this.dataSource.query(query, [userId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async youBanned(userId: string, blogId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (SELECT "blogId"
                       FROM public.banned_users_for_blog
                      WHERE "userId" = '${userId}' AND "blogId" = '${blogId}')
    `;
    const result = await this.dataSource.query(query);

    return result[0].exists;
  }

  async createUserBanForBlogStatus(
    userId: string,
    blogId: string,
    banReason: string,
    banDate: string,
  ): Promise<boolean> {
    const query = `
      INSERT INTO public.banned_users_for_blog
             ("blogId", "userId", "banReason", "banDate")
      VALUES ($1, $2, $3, $4)
              RETURNING "blogId"
    `;
    const result = await this.dataSource.query(query, [
      blogId,
      userId,
      banReason,
      banDate,
    ]);

    if (!result.length) {
      return false;
    }
    return true;
  }

  async deleteUserBanForBlogStatus(
      userId: string,
      blogId: string,
  ): Promise<boolean> {
    const query = `
      DELETE
        FROM public.banned_users_for_blog
       WHERE "userId" = $1 AND "blogId" = $2;
    `;
    const result = await this.dataSource.query(query, [userId, blogId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async createBlogBanStatus(blogId: string, banDate: string): Promise<boolean> {
    const query = `
      INSERT INTO public.banned_blog
             ("blogId", "banDate")
      VALUES ($1, $2)
             RETURNING "blogId"
    `;
    const result = await this.dataSource.query(query, [blogId, banDate]);

    if (!result.length) {
      return false;
    }

    return true;
  }

  async createPostsBanInfo(
    postsId: { id: string }[],
    banReason: string,
    banDate: string,
  ): Promise<boolean> {
    const values = this.getValues(postsId, banReason, banDate);

    const query = `
      INSERT INTO public.banned_post
             ("postId", "banReason", "banDate")
      VALUES ${values};
    `;
    const result = await this.dataSource.query(query);

    if (!result.length) {
      return false;
    }
    return true;
  }

  async deleteBlogBanStatus(blogId: string): Promise<boolean> {
    const query = `
      DELETE
        FROM public.banned_blog
       WHERE "blogId" = $1;
    `;

    const result = await this.dataSource.query(query, [blogId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deletePostsBanStatus(blogId: string): Promise<number> {
    const query = `
      DELETE
        FROM public.banned_post
       WHERE "postId" IN (SELECT id FROM posts WHERE "blogId" = $1)
    `;
    const result = await this.dataSource.query(query, [blogId]);

    return result[1];
  }

  private getUpdateFilter(
    banStatus: boolean,
    banReason: string | null,
    banDate: Date | null,
  ): string {
    let filter = `"banStatus" = '${banStatus}', "banDate" = null, "banReason" = null`;
    if (banReason !== null) {
      return (filter = `"banStatus" = '${banStatus}', "banDate" = '${banDate}', "banReason" = '${banReason}'`);
    }
    return filter;
  }

  private getValues(
    postsId: { id: string }[],
    banReason: string,
    banDate: string,
  ): string {
    let values = '';

    for (let i = 0, l = postsId.length; i < l; i++) {
      values += `('${postsId[i].id}', '${banReason}', '${banDate}'), `;
    }

    return values.slice(0, -2);
  }
}
