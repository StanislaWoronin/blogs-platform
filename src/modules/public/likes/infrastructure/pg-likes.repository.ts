import { Injectable } from '@nestjs/common';
import { NewestLikesModel } from './entity/newestLikes.model';
import { LikesModel } from './entity/likes.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PgLikesRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // async getUserReaction(
  //   parentId: string,
  //   userId: string,
  // ): Promise<LikesModel | null> {
  //   try {
  //     return this.likesRepository
  //       .findOne(
  //         { parentId, userId, isBanned: false },
  //         { _id: false, parentId: false, userId: false, __v: false },
  //       )
  //       .lean();
  //   } catch (e) {
  //     return null;
  //   }
  // }
  //
  // async getNewestLikes(parentId: string): Promise<NewestLikesModel[] | null> {
  //   try {
  //     return this.likesRepository
  //       .find(
  //         { parentId, status: 'Like', isBanned: false },
  //         { _id: false, parentId: false, status: false, __v: false },
  //       )
  //       .sort({ addedAt: -1 })
  //       .limit(3)
  //       .lean();
  //   } catch (e) {
  //     return null;
  //   }
  // }
  //
  // async getLikeReactionsCount(parentId: string): Promise<number> {
  //   return this.likesRepository.countDocuments({
  //     parentId,
  //     status: 'Like',
  //     isBanned: false,
  //   });
  // }
  // async getDislikeReactionsCount(parentId: string): Promise<number> {
  //   return this.likesRepository.countDocuments({
  //     parentId,
  //     status: 'Dislike',
  //     isBanned: false,
  //   });
  // }
  //
  // async updateUserReaction(
  //   commentId: string,
  //   userId: string,
  //   status: string,
  //   addedAt: string,
  //   login?: string,
  // ): Promise<boolean> {
  //   try {
  //     await this.likesRepository.updateOne(
  //       { parentId: commentId, userId, login },
  //       { $set: { status, addedAt } },
  //       { upsert: true },
  //     );
  //     return true;
  //   } catch (e) {
  //     return false;
  //   }
  // }

  async getReaction(userId: string, postId: string): Promise<string | null> {
    const query = `
      SELECT status
        FROM public.post_reactions
       WHERE "userId" = $1 AND "postId" = $2
    `
    const result = await this.dataSource.query(query, [userId, postId])

    return result[0]
  }

  async createReaction(userId: string, postId: string, likeStatus: string, addedAt: string): Promise<boolean> {
    const query = `
      INSERT INTO public.post_reactions
             (status, "addedAt", "userId", "postId")
      VALUES ($1, $2, $3, $4)  
             RETURNING status, "addedAt", "userId", "postId"
    `
    const result = await this.dataSource.query(query, [likeStatus, addedAt, userId, postId])

    if (!result[0]) {
      return false
    }
    return true
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

  async deleteReaction(userId: string, postId: string): Promise<boolean> {
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
