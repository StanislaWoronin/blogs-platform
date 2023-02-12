export class UserViewModel {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public createdAt: string,
  ) {}
}

export class UserViewModelWithBanInfo {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public createdAt: string,
    public banInfo: {
      isBanned: boolean;
      banDate: string;
      banReason: string;
    },
  ) {}
}
