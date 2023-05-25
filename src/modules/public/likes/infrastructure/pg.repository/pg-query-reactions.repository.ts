import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NewestLikesModel } from '../entity/newestLikes.model';
import { settings } from '../../../../../settings';

@Injectable()
export class PgQueryReactionsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getCommentReaction(
    userId: string,
    commentId: string,
  ): Promise<string | null> {
    const query = `
      SELECT status
        FROM public.comment_reactions
       WHERE "userId" = $1 AND "commentId" = $2
    `;
    const result = await this.dataSource.query(query, [userId, commentId]);

    return result[0];
  }

  async getPostReaction(
    userId: string,
    postId: string,
  ): Promise<string | null> {
    const query = `
      SELECT status
        FROM public.post_reactions
       WHERE "userId" = $1 AND "postId" = $2
    `;
    const result = await this.dataSource.query(query, [userId, postId]);

    return result[0];
  }

  async newestLikes(postId: string): Promise<NewestLikesModel[]> {
    const reactionFilter = this.reactionFilter();

    const newestLikesQuery = `
      SELECT "userId", "addedAt",
             (SELECT login FROM public.users WHERE users.id = post_reactions."userId")
        FROM public.post_reactions
       WHERE "postId" = $1 AND status = 'Like' AND ${reactionFilter} 
       ORDER BY "addedAt" DESC
       LIMIT ${settings.newestLikes.limit};
    `;

    return await this.dataSource.query(newestLikesQuery, [postId]);
  }

  private reactionFilter(): string {
    return `
      (SELECT "banStatus"
             FROM public.user_ban_info 
            WHERE user_ban_info."userId" = post_reactions."userId") != true
              AND NOT EXISTS (SELECT "userId" 
                                FROM public.banned_users_for_blog
                               WHERE banned_users_for_blog."userId" = post_reactions."userId"
                                 AND banned_users_for_blog."blogId" = (SELECT "blogId" 
                                FROM public.posts 
                               WHERE id = $1))
    `;
  }
}
