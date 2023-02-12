export class EmailConfirmationModel {
  constructor(
    public id: string,
    public confirmationCode: string,
    public expirationDate: string,
    public isConfirmed: boolean,
  ) {}
}
