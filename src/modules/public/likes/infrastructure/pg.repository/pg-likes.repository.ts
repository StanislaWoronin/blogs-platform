import { Injectable } from '@nestjs/common';
import { NewestLikesModel } from '../entity/newestLikes.model';
import { LikesModel } from '../entity/likes.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PgLikesRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createCommentReaction(
    userId: string,
    commentId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean> {
    const query = `
      INSERT INTO public.comment_reactions
             (status, "addedAt", "userId", "commentId")
      VALUES ($1, $2, $3, $4)  
             RETURNING status, "addedAt", "userId", "commentId"
    `;
    const result = await this.dataSource.query(query, [
      likeStatus,
      addedAt,
      userId,
      commentId,
    ]);

    if (!result[0]) {
      return false;
    }
    return true;
  }

  async updateCommentReaction(
    commentId: string,
    userId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean> {
    const query = `
      UPDATE public.comment_reactions
         SET status = $1, "addedAt" = $2
       WHERE "userId" = $3 AND "commentId" = $4
    `;
    const result = await this.dataSource.query(query, [
      likeStatus,
      addedAt,
      userId,
      commentId,
    ]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deleteCommentReaction(
    userId: string,
    commentId: string,
  ): Promise<boolean> {
    const query = `
      DELETE FROM public.comment_reactions
       WHERE "userId" = $1 AND "commentId" = $2
    `;
    const result = await this.dataSource.query(query, [userId, commentId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async createPostReaction(
    userId: string,
    postId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean> {
    const query = `
      INSERT INTO public.post_reactions
             (status, "addedAt", "userId", "postId")
      VALUES ($1, $2, $3, $4)  
             RETURNING status, "addedAt", "userId", "postId"
    `;
    const result = await this.dataSource.query(
      query , [likeStatus, addedAt, userId, postId],
    );

    if (!result[0]) {
      return false;
    }
    return true;
  }

  async updatePostReaction(
    userId: string,
    postId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean> {
    const query = `
      UPDATE public.post_reactions
         SET status = $1, "addedAt" = $2
       WHERE "userId" = $3 AND "postId" = $4
    `;
    const result = await this.dataSource.query(query, [
      likeStatus,
      addedAt,
      userId,
      postId,
    ]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deletePostReaction(userId: string, postId: string): Promise<boolean> {
    const query = `
      DELETE FROM public.post_reactions
       WHERE "userId" = $1 AND "postId" = $2
    `;
    const result = await this.dataSource.query(query, [userId, postId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }
}