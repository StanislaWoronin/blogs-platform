export class PostDBModel {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public createdAt: string,
    public blogId: string,
  ) {}
}
