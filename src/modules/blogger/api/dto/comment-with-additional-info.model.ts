import { ReactionModel } from '../../../../global-model/reaction.model';

export class CommentWithAdditionalInfoModel {
  id: string;
  content: string;
  createdAt: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  postInfo: {
    id: string;
    title: string;
    blogId: string;
    blogName: string;
  };
}
