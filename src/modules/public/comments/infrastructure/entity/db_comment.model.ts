export class DbCommentWithUserAndLikesInfoModel {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  userId: string;
  userLogin: string;
  myStatus?: string;
}

export class DbCommentInfoModel {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
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
  myStatus: string;
}

export class CreatedComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userLogin: string;
}


