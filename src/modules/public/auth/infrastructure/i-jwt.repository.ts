export interface IJwtRepository {
  checkTokenInBlackList(refreshToken: string): Promise<boolean>;
  addTokenInBlackList(refreshToken: string): Promise<boolean>;
}

export const IJwtRepository = 'IJwtRepository';
