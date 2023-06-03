import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueryParametersDto } from '../../../../../global-model/query-parameters.dto';
import {
  giveSkipNumber,
  paginationContentPage,
} from '../../../../../helper.functions';
import { ContentPageModel } from '../../../../../global-model/contentPage.model';
import { DbPostModel } from '../entity/db-post.model';
import { PostViewModel } from '../../api/dto/postsView.model';
import { IQueryReactionRepository } from '../../../likes/infrastructure/i-query-reaction.repository';
import { ReactionModel } from '../../../../../global-model/reaction.model';
import { ImageType } from '../../../../blogger/imageType';
import { toCreatedPostsViewModel } from '../../../../../data-mapper/to-posts-view.model';

@Injectable()
export class PgQueryPostsRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(IQueryReactionRepository)
    protected queryReactionsRepository: IQueryReactionRepository,
  ) {}

  async getPosts(
    queryDto: QueryParametersDto,
    blogId: string | undefined,
    userId: string | undefined,
  ): Promise<ContentPageModel> {
    const blogIdFilter = this.getBlogIdFilter(blogId);
    const statusFilter = this.myStatusFilter(userId);
    const reactions = this.reactions();

    const query = `
            SELECT id, title, "shortDescription", content, "createdAt", "blogId",
                       (SELECT name AS "blogName" FROM public.blogs WHERE blogs.id = posts."blogId"),
                       COALESCE((
                          SELECT JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize"))
                            FROM post_image 
                           WHERE "imageType" = '${
                             ImageType.Main
                           }' AND "postId" = posts.id
                        ), '[]') AS main,
                       ${reactions}
                       ${statusFilter}
                  FROM public.posts
                 ${blogIdFilter}
                 ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
                 LIMIT ${queryDto.pageSize} OFFSET ${giveSkipNumber(
      queryDto.pageNumber,
      queryDto.pageSize,
    )};
        `;
    const postsDB = await this.dataSource.query(query);

    const prePosts = await Promise.all(
      postsDB.map(async (p) => await this.addNewestLikes(p)),
    );
    const posts = prePosts.map((p) => PostViewModel.relativeToAbsoluteUrl(p));

    const totalCountQuery = `
          SELECT COUNT(id)
            FROM public.posts
          ${blogIdFilter}
        `;
    const totalCount = await this.dataSource.query(totalCountQuery);

    return paginationContentPage(
      queryDto.pageNumber,
      queryDto.pageSize,
      posts,
      Number(totalCount[0].count),
    );
  }

  async getPostById(
    id: string,
    userId: string | undefined,
  ): Promise<PostViewModel | null> {
    const myStatusFilter = this.myStatusFilter(userId);
    const reactions = this.reactions();

    const query = `
         SELECT id, title, "shortDescription", content, "createdAt", "blogId",
                       (SELECT name AS "blogName" FROM public.blogs WHERE blogs.id = posts."blogId"),
                       COALESCE((
                          SELECT JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize"))
                            FROM post_image 
                           WHERE "imageType" = '${ImageType.Main}' AND "postId" = posts.id
                        ), '[]') AS main,
                       ${reactions}
                       ${myStatusFilter}
                  FROM public.posts
                  WHERE id = $1
                    AND NOT EXISTS (SELECT "postId" 
                                      FROM public.banned_post 
                                     WHERE banned_post."postId" = posts.id)
    `;
    const postDB = await this.dataSource.query(query, [id]);
    if (!postDB.length) {
      return null;
    }
    const prePost = await this.addNewestLikes(postDB[0]);

    return PostViewModel.relativeToAbsoluteUrl(prePost);
  }

  // async getPostsForBlog(
  //   queryDto: QueryParametersDto,
  //   blogId: string,
  //   userId: string | undefined,
  // ): Promise<ContentPageModel> {
  //   const myStatusFilter = this.myStatusFilter(userId);
  //
  //   const postQuery = `
  //     SELECT id, title, "shortDescription", content, "blogId",
  //            (SELECT name AS "blogName" FROM public.blogs WHERE blogs.id = posts."blogId")
  //            (SELECT COUNT("postId")
  //               FROM public.post_reactions
  //              WHERE post_reactions."postId" = posts.id AND post_reactions.status = 'Like') AS "likesCount",
  //            (SELECT COUNT("postId")
  //               FROM public.post_reactions
  //              WHERE post_reactions."postId" = posts.id AND post_reactions.status = 'Dislike') AS "dislikesCount"
  //            ${myStatusFilter}
  //       FROM public.posts
  //      WHERE "blogId" = $1 AND NOT EXISTS (SELECT "blogId" FROM public.banned_blog WHERE id = $1)
  //      ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
  //                LIMIT '${queryDto.pageSize}'OFFSET ${giveSkipNumber(
  //                   queryDto.pageNumber,
  //                   queryDto.pageSize,
  //                )};
  //   `;
  //   const postsDB: DbPostModel[] = await this.dataSource.query(
  //     postQuery,
  //     [blogId]
  //   );
  //
  //   const posts = await Promise.all(
  //     postsDB.map(async (p) => await this.addNewestLikes(p)),
  //   );
  //
  //   const totalCountQuery = `
  //     SELECT COUNT(id)
  //           FROM public.posts
  //          ${blogIdFilter}
  //   `;
  //   const totalCount = await this.dataSource.query(totalCountQuery);
  //
  //   return paginationContentPage(
  //     queryDto.pageNumber,
  //     queryDto.pageSize,
  //     posts,
  //     Number(totalCount[0].count),
  //   );
  // }

  async getAllPostsId(blogId: string): Promise<{ id: string }[]> {
    const query = `
      SELECT id
        FROM public.posts
       WHERE "blogId" = $1;
    `;
    return await this.dataSource.query(query, [blogId]);
  }

  async postExist(id: string): Promise<boolean> {
    const query = `
            SELECT id FROM public.posts
             WHERE id = '${id}' 
               AND NOT EXISTS (SELECT "postId" 
                                 FROM public.banned_post 
                                WHERE banned_post."postId" = posts.id)
        `;
    const result = await this.dataSource.query(query);

    if (!result.length) {
      return false;
    }
    return true;
  }

  async getBlogIdByCommentId(commentId: string): Promise<string> {
    const query = `
      SELECT "blogId" 
        FROM public.posts 
       WHERE posts.id = (SELECT "postId" 
                           FROM public.comments
                          WHERE comments.id = $1);
    `;
    const result = await this.dataSource.query(query, [commentId]);

    return result[0].blogId;
  }

  async getBlogIdByPostId(postId: string): Promise<string> {
    const query = `
      SELECT "blogId" 
        FROM public.posts 
       WHERE posts.id = '${postId}';
    `;
    const result = await this.dataSource.query(query);

    return result[0].blogId;
  }

  private async addNewestLikes(post) {
    const newestLikes = await this.queryReactionsRepository.newestLikes(
      post.id,
    );

    let myStatus = 'None';
    if (post.myStatus) {
      myStatus = post.myStatus;
    }

    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: Number(post.likesCount),
        dislikesCount: Number(post.dislikesCount),
        myStatus: myStatus,
        newestLikes,
      },
      images: {
        main: post.main,
      },
    };
  }

  private myStatusFilter(userId: string | undefined): string {
    if (userId) {
      return `, (SELECT status AS "myStatus" 
                   FROM public.post_reactions
                  WHERE post_reactions."postId" = posts.id AND post_reactions."userId" = '${userId}')`;
    }
    return '';
  }

  private getBlogIdFilter(blogId: string | undefined): string {
    if (blogId) {
      return `WHERE "blogId" = '${blogId}' AND NOT EXISTS (SELECT "blogId" FROM public.banned_blog WHERE id = '${blogId}')`;
    }
    return ``;
  }

  private reactions(): string {
    return `
    ${this.reactionCount('likesCount', ReactionModel.Like)}, 
    ${this.reactionCount('dislikesCount', ReactionModel.Dislike)}`;
  }

  private reactionCount(fieldName: string, reaction: ReactionModel): string {
    return `
    (SELECT COUNT("postId")
       FROM public.post_reactions
      WHERE post_reactions."postId" = posts.id 
        AND post_reactions.status = '${reaction}'
        AND (SELECT "banStatus"
               FROM public.user_ban_info 
              WHERE user_ban_info."userId" = post_reactions."userId") != true
                AND NOT EXISTS (SELECT "userId" 
                                  FROM public.banned_users_for_blog
                                 WHERE banned_users_for_blog."userId" = post_reactions."userId"
                                   AND banned_users_for_blog."blogId" = posts."blogId")) AS "${fieldName}"
    `;
  }
}
