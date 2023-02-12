import {CreatedComment, DbCommentWithUserAndLikesInfoModel} from '../modules/public/comments/infrastructure/entity/db_comment.model';
import {
  CommentViewModel, CreatedCommentViewModel,
} from '../modules/public/comments/api/dto/commentView.model';

export const toCommentsViewModel = (
  comment: DbCommentWithUserAndLikesInfoModel,
): CommentViewModel => {
  let myStatus = 'None';
  if (!!comment.myStatus) { // TODO "!!" — является проверкой как определена ли переменная и является истиной, а "!!!" — как определена переменная и является ложью.
    myStatus = comment.myStatus;
  }

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    likesInfo: {
      likesCount: Number(comment.likesCount),
      dislikesCount: Number(comment.dislikesCount),
      myStatus: myStatus,
    },
    commentatorInfo: {
      userId: comment.userId,
      userLogin: comment.userLogin
    },
  };
};

export const createdCommentViewModel = (comment: CreatedComment): CreatedCommentViewModel => {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    likesInfo: {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: 'None',
    },
    commentatorInfo: {
      userId: comment.userId,
      userLogin: comment.userLogin
    },
  }
}