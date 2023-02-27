import { Injectable } from '@nestjs/common';
import { CommentBDModel } from '../entity/commentDB.model';
import { QueryParametersDto } from '../../../../../global-model/query-parameters.dto';
import { giveSkipNumber } from '../../../../../helper.functions';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentViewModel } from '../../api/dto/commentView.model';
import { CreatedComment } from '../entity/db_comment.model';
import {Comments} from "../entity/comments.entity";
import {Users} from "../../../../super-admin/infrastructure/entity/users.entity";

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

  async updateComment(commentId: string, content: string): Promise<boolean> {
    const query = `
      UPDATE public.comments
         SET content = $1
       WHERE id = $2
    `;
    const result = await this.dataSource.query(query, [content, commentId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deleteCommentById(commentId: string): Promise<boolean> {
    const reactionsQuery = `
      DELETE FROM public.comment_reactions
       WHERE comment_reactions."commentId" = '${commentId}';
    `;
    await this.dataSource.query(reactionsQuery)
    const query = `
      DELETE FROM public.comments
       WHERE id = '${commentId}';
    `;
    const result = await this.dataSource.query(query);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }
}
