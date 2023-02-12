import {UserViewModelWithBanInfo} from "../../src/modules/super-admin/api/dto/user.view.model";
import {
    CreatedComment,
    DbCommentWithUserAndLikesInfoModel
} from "../../src/modules/public/comments/infrastructure/entity/db_comment.model";

export const getCreatedComment = (user: UserViewModelWithBanInfo, comment?: DbCommentWithUserAndLikesInfoModel) =>{
    console.log(comment);
    if (!comment) {
        return {
            id: expect.any(String),
            content: "aBqFljveZokLojESGyqiRg",
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
    } else {
        return {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            commentatorInfo: {
                userId: user.id,
                userLogin: user.login
            },
            likesInfo: {
                likesCount: Number(comment.likesCount),
                dislikesCount: Number(comment.dislikesCount),
                myStatus: Number(comment.myStatus)
            }
        }
    }
}