export class TokenPayloadModel {
  constructor(
    public userId: string,
    public deviceId: string,
    public iat: number,
    public exp: number,
  ) {}
}
