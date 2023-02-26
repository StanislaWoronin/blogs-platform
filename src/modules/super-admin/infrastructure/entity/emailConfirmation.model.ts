export class EmailConfirmationModel {
  constructor(
    public userId: string,
    public confirmationCode: string,
    public expirationDate: string,
    public isConfirmed: boolean,
  ) {}
}
