export class CommentViewModel {
  constructor(
    public id: string,
    public content: string,
    public createdAt: string,
    public likesInfo: {
      myStatus: string;
      likesCount: number;
      dislikesCount: number;
    },
    public commentatorInfo: {
      userId: string,
      userLogin: string,
    }
  ) {}
}

export class CommentWithAdditionalInfo {
  id: string;
  content: string;
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    muStatus: string;
  };
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

export class CreatedCommentViewModel {
  id: string;
  content: string;
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
}