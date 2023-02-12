export class CommentBDModel {
  constructor(
    public id: string,
    public content: string,
    public createdAt: string,
    public postId: string,
    public userId: string,
  ) {}
}
