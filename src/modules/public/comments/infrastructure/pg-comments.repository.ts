import { Injectable } from '@nestjs/common';
import { CommentBDModel } from './entity/commentDB.model';
import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import { giveSkipNumber } from '../../../../helper.functions';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentViewModel } from '../api/dto/commentView.model';
import {CreatedComment} from "./entity/db_comment.model";

@Injectable()
export class PgCommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createComment(
    newComment: CommentBDModel,
  ): Promise<CreatedComment | null> {
    const query = `
      INSERT INTO public.comments
             (id, content, "createdAt", "postId", "userId")
      VALUES ($1, $2, $3, $4, $5)
             RETURNING id, content, "userId", "createdAt",
                       (SELECT login AS "userLogin"
                          FROM public.users
                         WHERE users.id = '${newComment.userId}');       
    `;
    const result: CreatedComment[] = await this.dataSource.query(query, [
      newComment.id,
      newComment.content,
      newComment.createdAt,
      newComment.postId,
      newComment.userId,
    ]);

    return result[0];
  }

  // async updateComment(commentId: string, comment: string): Promise<boolean> {
  //   const result = await this.commentsRepository.updateOne(
  //     { id: commentId },
  //     { $set: { content: comment } },
  //   );
  //
  //   return result.modifiedCount === 1;
  // }
  //
  // async deleteCommentById(commentId: string): Promise<boolean> {
  //   const result = await this.commentsRepository.deleteOne({ id: commentId });
  //
  //   return result.deletedCount === 1;
  // }
}
