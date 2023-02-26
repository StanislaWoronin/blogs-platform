import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { CommentReactions } from "../entity/comment-reactions.entity";
import { PostReactions } from "../entity/post-reactions.entity";

@Injectable()
export class OrmReactionsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createCommentReaction(
    userId: string,
    commentId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean> {
    try {
      const reaction = {
        status: likeStatus,
        addedAt,
        userId,
        commentId
      }
      await this.dataSource.getRepository(CommentReactions)
        .save(reaction)

      return true
    } catch (e) {
      return null
    }
  }

  // async updateCommentReaction(
  //   commentId: string,
  //   userId: string,
  //   likeStatus: string,
  //   addedAt: string,
  // ): Promise<boolean> {
  //   const result = await this.dataSource
  //     .createQueryBuilder()
  //     .update(CommentReactions)
  //     .set({
  //       status: likeStatus,
  //       addedAt
  //     })
  //     .where("userId = :id", {id: userId})
  //     .andWhere("commentId = :id", {id: commentId})
  //     .execute()
  //
  //   if (result.affected != 1) {
  //     return false
  //   }
  //   return true
  // }

  // async deleteCommentReaction(
  //   userId: string,
  //   commentId: string,
  // ): Promise<boolean> {
  //   const result = await this.dataSource
  //     .createQueryBuilder()
  //     .delete()
  //     .from(CommentReactions)
  //     .where("userId = :id", {id: userId})
  //     .andWhere("commentId = :id", {id: commentId})
  //     .execute()
  //
  //   if (result.affected != 1) {
  //     return false
  //   }
  //   return true
  // }

  async createPostReaction(
    userId: string,
    postId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean> {
    try {
      const reaction = {
        status: likeStatus,
        addedAt,
        userId,
        postId
      }
      await this.dataSource.getRepository(PostReactions)
        .save(reaction)

      return true
    } catch (e) {
      return null
    }
  }

  // async updatePostReaction(
  //   userId: string,
  //   postId: string,
  //   likeStatus: string,
  //   addedAt: string,
  // ): Promise<boolean> {
  //   const result = await this.dataSource
  //     .createQueryBuilder()
  //     .update(PostReactions)
  //     .set({
  //       status: likeStatus,
  //       addedAt
  //     })
  //     .where("userId = :id", {id: userId})
  //     .andWhere("postId = :id", {id: postId})
  //     .execute()
  //
  //   if (result.affected != 1) {
  //     return false
  //   }
  //   return true
  // }
  //
  // async deletePostReaction(userId: string, postId: string): Promise<boolean> {
  //   const result = await this.dataSource
  //     .createQueryBuilder()
  //     .delete()
  //     .from(PostReactions)
  //     .where("userId = :id", {id: userId})
  //     .andWhere("postId = :id", {id: postId})
  //     .execute()
  //
  //   if (result.affected != 1) {
  //     return false
  //   }
  //   return true
  // }
}