import {CommentBDModel} from "./entity/commentDB.model";
import {CreatedComment} from "./entity/db_comment.model";

export interface ICommentsRepository {
    createComment(newComment: CommentBDModel): Promise<CreatedComment | null>;
    updateComment(commentId: string, content: string): Promise<boolean>;
    deleteCommentById(commentId: string): Promise<boolean>;
}

export const ICommentsRepository = 'ICommentsRepository'