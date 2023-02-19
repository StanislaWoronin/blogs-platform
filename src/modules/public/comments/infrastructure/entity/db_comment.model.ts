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

export class DbCommentWithAdditionalInfo {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userLogin: string;
  postId: string;
  title: string;
  blogId: string;
  blogName: string;
}

export class CreatedComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userLogin: string;
}
