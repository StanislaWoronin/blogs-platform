import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import {
  giveSkipNumber,
  paginationContentPage,
} from '../../../../helper.functions';
import { DbCommentWithUserAndLikesInfoModel } from './entity/db_comment.model';
import { toCommentsViewModel } from '../../../../data-mapper/to_comments_view.model';
import { ContentPageModel } from '../../../../global-model/contentPage.model';

@Injectable()
export class PgQueryCommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getComments(
    blogId: string,
    queryDto: QueryParametersDto,
    userId?: string | undefined,
  ): Promise<ContentPageModel> {
    const myStatusFilter = this.myStatusFilter(userId);

    const query = `
            SELECT id, content, "createdAt",
                   (SELECT COUNT("commentId") AS "likesCount"
                      FROM public.comment_reactions cr
                     WHERE cr."commentId" = c.id AND status = "Like"),
                   (SELECT COUNT("commentId") AS "dislikesCount"
                      FROM public.comment_reactions cr
                     WHERE cr."commentId" = c.id AND status = "Dislike"),
                   (SELECT id AS "userId", login AS "userLogin"
                      FROM public.user u
                     WHERE u.id = c.userId) AS "commentatorInfo",
                   (SELECT id, title, "blogId", 
                           (SELECT name AS "blogName"
                              FROM public.blogs
                             WHERE blogs.id = posts."blogId")
                      FROM public.posts
                     WHERE posts.id = c.postId) AS "postInfo"
                   ${myStatusFilter}       
              FROM public.comments c
             WHERE (SELECT id FROM public.blogs b gi
             ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
             LIMIT $1 OFFSET ${giveSkipNumber(
               queryDto.pageNumber,
               queryDto.pageSize,
             )};         
        `;
    const commentDB: DbCommentWithUserAndLikesInfoModel[] = await this.dataSource.query(query, [
      blogId,
      queryDto.pageNumber,
    ]);

    const comments = commentDB.map((c) => toCommentsViewModel(c));

    const totalCountQuery = `
          SELECT COUNT(id)
            FROM public.comments
           WHERE (SELECT id FROM public.blogs b 
                     WHERE b."postId" = p.id) = $1
        `;
    const totalCount = await this.dataSource.query(totalCountQuery, [blogId]);

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
  ): Promise<ContentPageModel> {
    const myStatusFilter = this.myStatusFilter(userId);

    const query = `
              SELECT id, content, "createdAt",
                     (SELECT COUNT("commentId") AS "likesCount"
                        FROM public.comment_reactions
                       WHERE comment_reactions."commentId" = comments.id AND status = 'Like'),
                     (SELECT COUNT("commentId") AS "dislikesCount"
                        FROM public.comment_reactions
                       WHERE comment_reactions."commentId" = comments.id AND status = 'Dislike'),
                     (SELECT id AS "userId"
                        FROM public.users
                       WHERE users.id = comments."userId"),
                     (SELECT login AS "userLogin"
                        FROM public.users
                       WHERE users.id = comments."userId")
                   ${myStatusFilter} 
              FROM public.comments
             WHERE comments."postId" = $1
             ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
             LIMIT $2 OFFSET ${giveSkipNumber(
               queryDto.pageNumber,
               queryDto.pageSize,
             )};   
        `;
    const commentsDB: DbCommentWithUserAndLikesInfoModel[] = await this.dataSource.query(query, [
      postId,
      queryDto.pageSize,
    ]);

    const comments = commentsDB.map(c => toCommentsViewModel(c))

    const totalCountQuery = `
          SELECT COUNT(id)
            FROM public.comments
           WHERE comments."postId" = $1
        `;
    const totalCount = await this.dataSource.query(totalCountQuery, [postId]);

    return paginationContentPage(
      queryDto.pageNumber,
      queryDto.pageSize,
      comments,
      Number(totalCount[0].count),
    );
  }

  private myStatusFilter(userId: string | undefined): string {
    if (userId) {
      return `, (SELECT status AS "myStatus" 
                         FROM public.comment_reactions
                        WHERE "commentId".comment_reactions = id.posts
                          AND "userId".comment_reactions = '${userId}')`;
    }
    return '';
  }
}
