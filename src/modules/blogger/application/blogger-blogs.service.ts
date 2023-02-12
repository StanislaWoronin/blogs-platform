import { Injectable } from '@nestjs/common';
import { BlogDto } from '../api/dto/blog.dto';
import { BanUserDto } from '../api/dto/ban-user.dto';
import { PgUsersRepository } from '../../super-admin/infrastructure/pg-users.repository';
import { PgQueryUsersRepository } from '../../super-admin/infrastructure/pg-query-users.repository';
import { PgBanInfoRepository } from '../../super-admin/infrastructure/pg-ban-info.repository';
import { PgBlogsRepository } from '../../public/blogs/infrastructure/pg-blogs.repository';
import { BlogsService } from "../../public/blogs/application/blogs.service";
import { PostForBlogViewModel, PostViewModel } from "../../public/posts/api/dto/postsView.model";
import { PostDto } from "../api/dto/post.dto";
import { PostsService } from "../../public/posts/application/posts.service";
import { toCreatedPostsViewModel, toPostsViewModel } from "../../../data-mapper/to-posts-view.model";

@Injectable()
export class BloggerBlogService {
  constructor(
    protected banInfoRepository: PgBanInfoRepository,
    protected queryUserRepository: PgQueryUsersRepository,
  ) {}

  async updateUserBanStatus(
    userId: string,
    dto: BanUserDto,
  ): Promise<boolean | null> {
    const user = await this.queryUserRepository.getUserById(userId);

    if (!user) {
      return null;
    }

    const youBanned = await this.banInfoRepository.youBanned(
      userId,
      dto.blogId,
    );


    // юзер для блога не в бане, но мы хотим его забанить
    // false        true
    if (youBanned === dto.isBanned) {
      return true;
    }
    // !true         false
    if (!youBanned) {

      const banDate = new Date().toISOString();
      return await this.banInfoRepository.createUserBanForBlogStatus(
        userId,
        dto.blogId,
        dto.banReason,
        banDate,
      );
    }

    return await this.banInfoRepository.deleteUserBanForBlogStatus(
      userId,
      dto.blogId,
    );
  }
}
