export interface ITestingRepository {
  getConfirmationCode(userId: string): Promise<{ confirmationCode: string }>;
  checkUserConfirmed(userId: string): Promise<{ isConfirmed: boolean }>;
  getUserPassword(userId: string): Promise<{ passwordHash: string }>;
  makeExpired(userId: string, expirationDate: string): Promise<boolean>;
  deleteAll(): Promise<boolean>;
  setUserTelegramId(authorizationCode: string, telegramId: number);
}

export const ITestingRepository = 'ITestingRepository';
