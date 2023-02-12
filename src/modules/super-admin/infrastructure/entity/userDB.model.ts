export class UserDBModel {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public passwordSalt: string,
    public passwordHash: string,
    public createdAt: string,
  ) {}
}

export class CreatedUserModel {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public createdAt: string,
  ) {}
}

export class UserWithBanInfo {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public createdAt: string,
    public isBanned: boolean,
    public banDate: string | null,
    public banReason: string | null,
  ) {}
}
