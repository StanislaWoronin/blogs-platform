import {QueryParametersDto} from "../../../../global-model/query-parameters.dto";
import {ContentPageModel} from "../../../../global-model/contentPage.model";
import { CommentViewModel, CommentWithAdditionalInfo } from "../api/dto/commentView.model";

export interface IQueryCommentsRepository {
    getComments(
        userId: string,
        queryDto: QueryParametersDto,
    ): Promise<ContentPageModel>;
    getCommentByPostId(
        queryDto: QueryParametersDto,
        postId: string,
        userId: string,
    ): Promise<ContentPageModel | null>;
    getCommentById(
        commentId: string,
        userId: string | undefined,
    ): Promise<CommentViewModel>;
    bloggerGetComments(
      userId: string, query: QueryParametersDto
    ): Promise<CommentWithAdditionalInfo>
    commentExists(commentId: string): Promise<{ userId: string } | null>;
}

export const IQueryCommentsRepository = 'IQueryCommentsRepository'