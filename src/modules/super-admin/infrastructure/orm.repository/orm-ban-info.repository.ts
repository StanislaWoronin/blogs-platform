import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';
import { BanInfoModel } from '../entity/banInfo.model';
import { UserBanInfo } from '../entity/user-ban-info.entity';
import { BannedUsersForBlog } from '../../../public/blogs/infrastructure/entity/banned-users-for-blog.entity';
import { BannedBlog } from '../entity/banned_blog.entity';
import { BannedPost } from '../entity/banned-post.entity';

export class OrmBanInfoRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getBanInfo(userId: string): Promise<BanInfoModel | null> {
    const builder = this.dataSource
      .createQueryBuilder()
      .select('bi.userId', 'userId')
      .addSelect('bi.banStatus', 'isBanned')
      .addSelect('bi.banDate', 'banDate')
      .addSelect('bi.banReason', 'banReason')
      .from(UserBanInfo, 'bi')
      .where('bi.userId = :id', { id: userId });

    return await builder.getRawOne();
  }

  async createBanInfo(banInfo: BanInfoModel): Promise<BanInfoModel> {
    return await this.dataSource.getRepository(UserBanInfo).save(banInfo);
  }

  async saUpdateUserBanStatus(
    userId: string,
    banStatus: boolean,
    banReason: string | null,
    banDate: Date | null,
  ): Promise<boolean> {
    const builder = this.dataSource
      .createQueryBuilder()
      .update(UserBanInfo)
      .set({
        userId,
        banStatus,
        banReason,
        banDate,
      })
      .where('userId = :id', { id: userId });
    const result = await builder.execute();

    if (result.affected != 1) {
      return false;
    }
    return true;
  }

  async deleteUserBanInfoById(userId: string): Promise<boolean> {
    const builder = this.dataSource
      .createQueryBuilder()
      .delete()
      .from(UserBanInfo)
      .where('userId = :id', { id: userId });
    const result = await builder.execute();

    if (result.affected != 1) {
      return false;
    }
    return true;
  }

  async youBanned(userId: string, blogId: string): Promise<boolean> {
    const builder = this.dataSource
      .createQueryBuilder()
      .select('bfb.blogId')
      .from(BannedUsersForBlog, 'bfb')
      .where('bfb.userId = :id', { id: userId })
      .andWhere('bfb.blogId = :id', { id: blogId });
    const result = await builder.getExists();

    return result;
  }

  async createUserBanForBlogStatus(
    userId: string,
    blogId: string,
    banReason: string,
    banDate: string,
  ): Promise<boolean> {
    const banInfo = {
      userId,
      blogId,
      banReason,
      banDate,
    };
    const result = this.dataSource
      .getRepository(BannedUsersForBlog)
      .save(banInfo);

    if (!result) {
      return false;
    }
    return true;
  }

  // async deleteUserBanForBlogStatus(
  //     userId: string,
  //     blogId: string,
  // ): Promise<boolean> {
  //   const builder = this.dataSource
  //       .createQueryBuilder()
  //       .delete()
  //       .from(BannedUsersForBlog)
  //       .where("userId = :id", {id: userId})
  //       .andWhere("blogId = :id", {id: blogId})
  //   const result = await builder.execute()
  //   const q = builder.getSql()
  //   console.log(q)
  //   if (result.affected != 1) {
  //     return false
  //   }
  //   return true
  // } // TODO trabl 3

  async createBlogBanStatus(blogId: string, banDate: string): Promise<boolean> {
    const banStatus = {
      blogId,
      banDate,
    };

    const result = await this.dataSource
      .getRepository(BannedBlog)
      .save(banStatus);

    if (!result) {
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

    const builder = this.dataSource
      .createQueryBuilder()
      .insert()
      .into(BannedPost)
      .values(values);
    const result = await builder.execute();

    if (!result) {
      return false;
    }
    return true;
  }

  async deleteBlogBanStatus(blogId: string): Promise<boolean> {
    const builder = this.dataSource
      .createQueryBuilder()
      .delete()
      .from(BannedBlog)
      .where('blogId = :id', { id: blogId });
    const result = await builder.execute();

    if (result.affected != 1) {
      return false;
    }
    return true;
  }

  async deletePostsBanStatus(blogId: string): Promise<number> {
    const builder = this.dataSource
      .createQueryBuilder()
      .delete()
      .from(BannedPost)
      .where(`"postId" IN (SELECT id FROM posts WHERE "blogId" = :id)`, {
        id: blogId,
      });
    const result = await builder.execute();

    return result.affected;
  }

  private getValues(
    postsId: { id: string }[],
    banReason: string,
    banDate: string,
  ): {}[] {
    const values = [];

    for (let i = 0, l = postsId.length; i < l; i++) {
      const banInfo = {
        postsId: postsId[i],
        banReason,
        banDate,
      };
      values.push(banInfo);
    }

    return values;
  }
}
