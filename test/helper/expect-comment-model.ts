import {UserViewModelWithBanInfo} from "../../src/modules/super-admin/api/dto/user.view.model";
import {
    CreatedComment,
    DbCommentWithUserAndLikesInfoModel
} from "../../src/modules/public/comments/infrastructure/entity/db_comment.model";
import {preparedComment} from "./prepeared-data";
import {CreatedCommentViewModel} from "../../src/modules/public/comments/api/dto/commentView.model";

export const getCreatedComment = (user: UserViewModelWithBanInfo) =>{
    return {
        id: expect.any(String),
        content: preparedComment.valid,
        commentatorInfo: {
            userId: user.id,
            userLogin: user.login
        },
        createdAt: expect.any(String),
        likesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: "None"
        }
    }
}

export const getExpectComment = (user: UserViewModelWithBanInfo, comment: CreatedCommentViewModel, likesCount: number, dislikesCount: number, myStatus: string) => {
    return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        commentatorInfo: {
            userId: user.id,
            userLogin: user.login
        },
        likesInfo: {
            likesCount: likesCount,
            dislikesCount: dislikesCount,
            myStatus: myStatus
        }
    }
}