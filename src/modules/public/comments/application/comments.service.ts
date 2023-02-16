import { Inject, Injectable } from '@nestjs/common';
import { PgCommentsRepository } from '../infrastructure/pg-comments.repository';
import { CommentBDModel } from '../infrastructure/entity/commentDB.model';
import {CommentViewModel, CreatedCommentViewModel} from '../api/dto/commentView.model';
import { v4 as uuidv4 } from 'uuid';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { PgQueryPostsRepository } from '../../posts/infrastructure/pg-query-posts.repository';
import {createdCommentViewModel, toCommentsViewModel} from "../../../../data-mapper/to_comments_view.model";
import {PgLikesRepository} from "../../likes/infrastructure/pg-likes.repository";
import {ReactionModel} from "../../../../global-model/reaction.model";

@Injectable()
export class CommentsService {
  constructor(
    protected commentsRepository: PgCommentsRepository,
    protected queryPostsRepository: PgQueryPostsRepository,
    protected likesRepository: PgLikesRepository,
  ) {}

  async createComment(
    postId: string,
    comment: string,
    user: UserDBModel,
  ): Promise<CreatedCommentViewModel | null> {
    await this.queryPostsRepository.postExist(postId);
    const commentId = uuidv4();

    const newComment = new CommentBDModel(
      commentId,
      comment,
      new Date().toISOString(),
      postId,
      user.id,
    );

    const createdComment = await this.commentsRepository.createComment(newComment);

    return createdCommentViewModel(createdComment);
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    return await this.commentsRepository.updateComment(commentId, content);
  }

  async updateReaction(
    userId: string,
    commentId: string,
    likeStatus: string,
  ): Promise<boolean> {
    const currentReaction = await this.likesRepository.getCommentReaction(userId, commentId)

    if (!currentReaction) {
      if (likeStatus === ReactionModel.None) {
        return true
      }

      return await this.likesRepository.createCommentReaction(
          userId,
          commentId,
          likeStatus,
          new Date().toISOString()
      )
    }

    if (likeStatus === ReactionModel.None) {
      return await this.likesRepository.deleteCommentReaction(userId, commentId);
    }

    return await this.likesRepository.updateCommentReaction(
      commentId,
      userId,
      likeStatus,
      new Date().toISOString(),
    );
  }

  async deleteCommentById(commentId: string): Promise<boolean> {
    return await this.commentsRepository.deleteCommentById(commentId);
  }
}
