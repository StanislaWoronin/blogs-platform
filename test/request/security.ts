import request from 'supertest';
import { endpoints, getUrlWithId } from '../helper/routing';

export class Security {
  constructor(private readonly server: any) {}

  async getAllActiveSessions(refreshToken?: string) {
    const response = await request(this.server)
      .get(endpoints.securityController)
      .set('Cookie', `refreshToken=${refreshToken}`);

    return { body: response.body, status: response.status };
  }

  async deleteDeviseById(deviceId: string, refreshToken?: string) {
    const url = getUrlWithId(endpoints.securityController, deviceId);

    const response = await request(this.server)
      .delete(url)
      .set('Cookie', `refreshToken=${refreshToken}`);

    return response.status;
  }

  async deleteOtherDevices(refreshToken: string) {
    const response = await request(this.server)
      .delete(endpoints.securityController)
      .set('Cookie', `refreshToken=${refreshToken}`);

    return response.status;
  }
}
