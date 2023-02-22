export class CommentBDModel {
  constructor(
    public id: string,
    public content: string,
    public createdAt: string,
    public postId: string,
    public userId: string,
  ) {}
}

export class CommentDbWithAdditionalInfoModel {
  constructor(
    public id: string,
    public content: string,
    public createdAt: string,
    public postId: string,
    public title: string,
    public userId: string,
    public userLogin: string,
    public blogId: string,
    public blogName: string,
    public likesCount: number,
    public dislikesCount: number,
    public myStatus: string | null
  ) {
  }
}
