import {Inject, Injectable} from '@nestjs/common';
import { BindBlogDto } from '../api/dto/bind-blog.dto';
import {IBlogsRepository} from "../../public/blogs/infrastructure/i-blogs.repository";
import {IQueryBlogsRepository} from "../../public/blogs/infrastructure/i-query-blogs.repository";
import {IBanInfoRepository} from "../infrastructure/i-ban-info.repository";
import { IQueryPostsRepository } from "../../public/posts/infrastructure/i-query-posts.repository";

@Injectable()
export class SaBlogsService {
  constructor(
    @Inject(IBanInfoRepository) protected banInfoRepository: IBanInfoRepository,
    @Inject(IQueryPostsRepository) protected queryPostsRepository: IQueryPostsRepository,
    @Inject(IBlogsRepository) protected blogsRepository: IBlogsRepository,
    @Inject(IQueryBlogsRepository) protected queryBlogsRepository: IQueryBlogsRepository
  ) {}

  async updateBlogBanStatus(
    blogId: string,
    isBanned: boolean,
  ): Promise<boolean | null> {
    const blogBanned = await this.queryBlogsRepository.blogBanned(blogId);

    if (blogBanned === null) {
      return null;
    }
    if (blogBanned === isBanned) {
      return true;
    }

    const postsId = await this.queryPostsRepository.getAllPostsId(blogId);
    if (!blogBanned) {
      const banDate = new Date().toISOString();
      if (postsId.length) {
        const postBanReason = 'The blog that owns this post has been banned';
        await this.banInfoRepository.createPostsBanInfo(
          postsId,
          postBanReason,
          banDate,
        );
      }

      return await this.banInfoRepository.createBlogBanStatus(blogId, banDate);
    }

    if (postsId.length) {
      const numberOfDeleted = await this.banInfoRepository.deletePostsBanStatus(
        blogId,
      );

      if (numberOfDeleted !== postsId.length) {
        console.log('Not all posts are unbanded');
      }
    }

    return await this.banInfoRepository.deleteBlogBanStatus(blogId);
  }

  async bindBlog(params: BindBlogDto) {
    return this.blogsRepository.bindBlog(params);
  }
}
