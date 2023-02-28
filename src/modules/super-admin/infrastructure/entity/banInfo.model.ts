export class BanInfoModel {
  constructor(
    public userId: string,
    public isBanned: boolean,
    public banDate: string | null,
    public banReason: string | null,
  ) {}
}
