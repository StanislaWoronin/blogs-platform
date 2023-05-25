import { endpoints } from '../helper/routing';
import request from 'supertest';

export class Auth {
  constructor(private readonly server: any) {}

  async getNewRefreshToken(
    token?: string,
  ): Promise<{ accessToken: string; refreshToken: string; status: number }> {
    const response = await request(this.server)
      .post(endpoints.authController.refreshToken)
      .set('Cookie', `refreshToken=${token}`);

    const refreshToken = response.headers['set-cookie'][0]
      .split(';')[0]
      .split('=')[1];

    return {
      accessToken: response.body.accessToken,
      refreshToken,
      status: response.status,
    };
  }
}
