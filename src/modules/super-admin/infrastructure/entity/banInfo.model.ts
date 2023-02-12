export class BanInfoModel {
  constructor(
    public parentId: string,
    public isBanned: boolean,
    public banDate: string | null,
    public banReason: string | null,
    public blogId: string | null,
  ) {}
}
