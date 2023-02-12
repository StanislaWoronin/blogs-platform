import { Inject, Injectable } from '@nestjs/common';
import { PgCommentsRepository } from '../infrastructure/pg-comments.repository';
import { CommentBDModel } from '../infrastructure/entity/commentDB.model';
import {CommentViewModel, CreatedCommentViewModel} from '../api/dto/commentView.model';
import { v4 as uuidv4 } from 'uuid';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { PgQueryPostsRepository } from '../../posts/infrastructure/pg-query-posts.repository';
import {createdCommentViewModel, toCommentsViewModel} from "../../../../data-mapper/to_comments_view.model";

@Injectable()
export class CommentsService {
  constructor(
    protected commentsRepository: PgCommentsRepository,
    protected queryPostsRepository: PgQueryPostsRepository,
  ) {}

  // async getCommentById(
  //   commentId: string,
  //   token?: string,
  // ): Promise<CommentViewModel | null> {
  //   const comment = await this.commentsRepository.getCommentById(commentId);
  //
  //   if (!comment) {
  //     return null;
  //   }
  //
  //   const banInfo = await this.banInfoRepository.getBanInfo(comment.userId);
  //
  //   if (banInfo.isBanned) {
  //     return null;
  //   }
  //
  //   const userId = await this.jwtService.getUserIdViaToken(token);
  //   return await this.addLikesInfoForComment(comment, userId);
  // }

  async createComment(
    postId: string,
    comment: string,
    user: UserDBModel,
  ): Promise<CreatedCommentViewModel | null> {
    const post = await this.queryPostsRepository.postExist(postId);
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

  // async updateComment(commentId: string, comment: string): Promise<boolean> {
  //   return await this.commentsRepository.updateComment(commentId, comment);
  // }

  // async updateLikesInfo(
  //   userId: string,
  //   commentId: string,
  //   likeStatus: string,
  // ): Promise<boolean> {
  //   const addedAt = new Date().toISOString();
  //   return await this.likesRepository.updateUserReaction(
  //     commentId,
  //     userId,
  //     likeStatus,
  //     addedAt,
  //   );
  // }
  //
  // async deleteCommentById(commentId: string): Promise<boolean> {
  //   return await this.commentsRepository.deleteCommentById(commentId);
  // }
}
