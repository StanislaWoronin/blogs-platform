import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueryParametersDto } from '../../../../../global-model/query-parameters.dto';
import {
  giveSkipNumber,
  paginationContentPage,
} from '../../../../../helper.functions';
import {
  DbCommentWithAdditionalInfo,
  DbCommentWithUserAndLikesInfoModel,
} from '../entity/db_comment.model';
import {
  commentWithAdditionalInfo,
  commentWithAdditionalInfoPlus,
  toCommentsViewModel,
} from '../../../../../data-mapper/to_comments_view.model';
import { ContentPageModel } from '../../../../../global-model/contentPage.model';
import { CommentViewModel } from '../../api/dto/commentView.model';
import { CommentWithAdditionalInfoModel } from '../../../../blogger/api/dto/comment-with-additional-info.model';
import { CommentDbWithAdditionalInfoModel } from '../entity/commentDB.model';
import { ReactionModel } from '../../../../../global-model/reaction.model';

@Injectable()
export class PgQueryCommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getComments(
    userId: string,
    queryDto: QueryParametersDto,
  ): Promise<ContentPageModel> {
    const query = `
            SELECT c.id, c.content, c."createdAt", p.id AS "postId", p.title, p."blogId",
                   (SELECT id AS "userId"
                      FROM public.users u
                     WHERE u.id = c."userId"),
                   (SELECT login AS "userLogin"
                      FROM public.users u
                     WHERE u.id = c."userId"),
                   (SELECT name AS "blogName" FROM public.blogs WHERE blogs.id = p."blogId")
              FROM public.comments c
              LEFT JOIN public.posts p
                ON c."postId" = p.id
             WHERE (SELECT "userId" FROM public.blogs WHERE blogs.id = p."blogId") = '${userId}'
               AND NOT EXISTS (SELECT "blogId"
              FROM public.banned_blog
             WHERE "blogId" = p."blogId")
               AND (SELECT "banStatus"
              FROM public.user_ban_info
             WHERE c."userId" = user_ban_info."userId") != true
               AND NOT EXISTS (SELECT "userId" 
              FROM public.banned_users_for_blog
             WHERE "blogId" = p."blogId" AND c."userId" = banned_users_for_blog."userId")                       
             ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
             LIMIT $1 OFFSET ${giveSkipNumber(
               queryDto.pageNumber,
               queryDto.pageSize,
             )};         
        `;
    const commentDB: DbCommentWithAdditionalInfo[] =
      await this.dataSource.query(query, [queryDto.pageSize]);

    const comments: CommentWithAdditionalInfoModel[] = commentDB.map((c) =>
      commentWithAdditionalInfo(c),
    );

    const totalCountQuery = `
          SELECT COUNT(c.id)
                FROM public.comments c
                LEFT JOIN public.posts p
                  ON c."postId" = p.id
               WHERE "userId" = $1 AND NOT EXISTS (SELECT "blogId"
                                                     FROM public.banned_blog
                                                    WHERE banned_blog."blogId" = (SELECT "blogId" 
																					  	 FROM public.posts
																					  	WHERE posts.id = c."postId"))
                                   AND (SELECT "banStatus"
                                          FROM public.user_ban_info
                                         WHERE c."userId" = user_ban_info."userId") != true
                                   AND NOT EXISTS (SELECT "userId" 
                                                     FROM public.banned_users_for_blog
                                                    WHERE banned_users_for_blog."blogId" = p."blogId" AND c."userId" = banned_users_for_blog."userId");   
        `;
    const totalCount = await this.dataSource.query(totalCountQuery, [userId]);

    return paginationContentPage(
      queryDto.pageNumber,
      queryDto.pageSize,
      comments,
      Number(totalCount[0].count),
    );
  }

  async getCommentByPostId(
    queryDto: QueryParametersDto,
    postId: string,
    userId: string,
  ): Promise<ContentPageModel | null> {
    const myStatusFilter = this.myStatusFilter(userId);
    const reactions = this.reactions();

    const query = `
              SELECT id, content, "createdAt",
                     ${reactions},
                     (SELECT id AS "userId"
                        FROM public.users
                       WHERE users.id = c."userId"),
                     (SELECT login AS "userLogin"
                        FROM public.users
                       WHERE users.id = c."userId")
                   ${myStatusFilter} 
              FROM public.comments c
             WHERE c."postId" = '${postId}' 
               AND NOT EXISTS (SELECT "postId" FROM public.banned_post WHERE "postId" = '${postId}')
               AND (SELECT "banStatus"
              FROM public.user_ban_info
             WHERE c."userId" = user_ban_info."userId") != true
               AND NOT EXISTS (SELECT "userId" 
              FROM public.banned_users_for_blog
             WHERE banned_users_for_blog."blogId" = (SELECT "blogId"
              FROM public.posts
             WHERE c."postId" = posts.id))                                                                                              
             ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
             LIMIT $1 OFFSET ${giveSkipNumber(
               queryDto.pageNumber,
               queryDto.pageSize,
             )};   
        `;
    const commentsDB: DbCommentWithUserAndLikesInfoModel[] =
      await this.dataSource.query(query, [queryDto.pageSize]);
    if (!commentsDB.length) {
      return null;
    }

    const comments = commentsDB.map((c) => toCommentsViewModel(c));

    const totalCountQuery = `
          SELECT COUNT(id)
            FROM public.comments c
           WHERE c."postId" = $1 
             AND NOT EXISTS (SELECT "blogId"
            FROM public.banned_blog
           WHERE "blogId" = (SELECT "blogId"
            FROM public.posts
           WHERE c."postId" = posts.id))
             AND (SELECT "banStatus"
            FROM public.user_ban_info
           WHERE c."userId" = user_ban_info."userId") != true;        
        `;
    const totalCount = await this.dataSource.query(totalCountQuery, [postId]);

    return paginationContentPage(
      queryDto.pageNumber,
      queryDto.pageSize,
      comments,
      Number(totalCount[0].count),
    );
  }

  async getCommentById(
    commentId: string,
    userId: string | undefined,
  ): Promise<CommentViewModel> {
    const myStatusFilter = this.myStatusFilter(userId);
    const reactions = this.reactions();

    const query = `
              SELECT id, content, "createdAt",
                     ${reactions},
                     (SELECT id AS "userId"
                        FROM public.users
                       WHERE users.id = c."userId"),
                     (SELECT login AS "userLogin"
                        FROM public.users
                       WHERE users.id = c."userId")
                   ${myStatusFilter} 
              FROM public.comments c
             WHERE c.id = '${commentId}' 
               AND NOT EXISTS (SELECT "postId"
              FROM public.banned_post 
             WHERE "postId" = c."postId")
               AND (SELECT "banStatus"
              FROM public.user_ban_info
             WHERE c."userId" = user_ban_info."userId") != true;
        `;
    const commentsDB: DbCommentWithUserAndLikesInfoModel[] =
      await this.dataSource.query(query);

    if (!commentsDB.length) {
      return null;
    }
    return toCommentsViewModel(commentsDB[0]);
  }

  async bloggerGetComments(
    userId: string,
    queryDto: QueryParametersDto,
  ): Promise<ContentPageModel> {
    const myStatusFilter = this.myStatusFilter(userId);
    const reactions = this.reactions();

    const query = `
      SELECT c.id, c.content, c."createdAt", p.id AS "postId", p.title, p."blogId",
                   (SELECT id AS "userId"
                      FROM public.users u
                     WHERE u.id = c."userId"),
                   (SELECT login AS "userLogin"
                      FROM public.users u
                     WHERE u.id = c."userId"),
                   (SELECT name AS "blogName" FROM public.blogs WHERE blogs.id = p."blogId"),
                   ${reactions}
                   ${myStatusFilter}  
              FROM public.comments c
              LEFT JOIN public.posts p
                ON c."postId" = p.id
             WHERE (SELECT "userId" FROM public.blogs WHERE blogs.id = p."blogId") = '${userId}'
               AND NOT EXISTS (SELECT "blogId"
              FROM public.banned_blog
             WHERE banned_blog."blogId" = p."blogId")
               AND (SELECT "banStatus"
              FROM public.user_ban_info
             WHERE c."userId" = user_ban_info."userId") != true
               AND NOT EXISTS (SELECT "userId" 
              FROM public.banned_users_for_blog
             WHERE (SELECT "blogId" FROM public.posts WHERE p.id = c."postId") = p."blogId" AND c."userId" = banned_users_for_blog."userId")                       
             ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
             LIMIT $1 OFFSET ${giveSkipNumber(
               queryDto.pageNumber,
               queryDto.pageSize,
             )};         
    `;
    const commentDb: CommentDbWithAdditionalInfoModel[] =
      await this.dataSource.query(query, [queryDto.pageSize]);

    const comments = commentDb.map((c) => commentWithAdditionalInfoPlus(c));

    const totalCountQuery = `
        SELECT COUNT(c.id)
          FROM public.comments c
          LEFT JOIN public.posts p
            ON c."postId" = p.id
         WHERE (SELECT "userId" FROM public.blogs WHERE blogs.id = p."blogId") = '${userId}'
           AND NOT EXISTS (SELECT "blogId"
          FROM public.banned_blog
         WHERE banned_blog."blogId" = p."blogId")
           AND (SELECT "banStatus"
          FROM public.user_ban_info
         WHERE c."userId" = user_ban_info."userId") != true
           AND NOT EXISTS (SELECT "userId" 
          FROM public.banned_users_for_blog
         WHERE (SELECT "blogId" FROM public.posts WHERE p.id = c."postId") = p."blogId" AND c."userId" = banned_users_for_blog."userId")                                
    `;
    const totalCount = await this.dataSource.query(totalCountQuery);

    return paginationContentPage(
      queryDto.pageNumber,
      queryDto.pageSize,
      comments,
      Number(totalCount[0].count),
    );
  }

  async commentExists(commentId: string): Promise<{ userId: string } | null> {
    const query = `
      SELECT "userId"
        FROM public.comments
       WHERE id = $1 AND NOT EXISTS (SELECT "postId"
                                       FROM public.banned_post 
                                      WHERE "postId" = comments."postId")
                     AND (SELECT "banStatus"
                            FROM public.user_ban_info
                           WHERE comments."userId" = user_ban_info."userId") != true;
    `;
    const response = await this.dataSource.query(query, [commentId]);

    if (!response[0]) {
      return null;
    }
    return response[0];
  }

  private myStatusFilter(userId: string | undefined): string {
    if (userId) {
      return `, (SELECT status AS "myStatus" 
                   FROM public.comment_reactions
                  WHERE comment_reactions."commentId" = c.id
                    AND comment_reactions."userId" = '${userId}')`;
    }
    return '';
  }
  private reactions(): string {
    return `${this.reactionCount(
      'likesCount',
      ReactionModel.Like,
    )}, ${this.reactionCount('dislikesCount', ReactionModel.Dislike)}`;
  }

  private reactionCount(fieldName: string, reaction: ReactionModel): string {
    return `
      (SELECT COUNT("commentId")
         FROM public.comment_reactions
        WHERE comment_reactions."commentId" = c.id 
          AND comment_reactions.status = '${reaction}' 
          AND (SELECT "banStatus"
         FROM public.user_ban_info 
        WHERE user_ban_info."userId" = comment_reactions."userId") != true
          AND NOT EXISTS (SELECT "userId" 
                            FROM public.banned_users_for_blog
                           WHERE banned_users_for_blog."userId" = comment_reactions."userId"
                             AND banned_users_for_blog."blogId" = (SELECT "blogId"
                            FROM public.posts
                           WHERE posts.id = c."postId"))) "${fieldName}"
      
    `;
  }
}
