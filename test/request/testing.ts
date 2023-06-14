import { TokenPayloadModel } from '../../src/global-model/token-payload.model';
import request from 'supertest';
import { endpoints } from '../helper/routing';

export class Testing {
  constructor(private readonly server: any) {}

  async clearDb() {
    const response = await request(this.server).delete(
      endpoints.testingController.allData,
    );

    return response.status;
  }

  async getPayload(token: string): Promise<TokenPayloadModel> {
    const response = await request(this.server).get(
      `/testing/payload/${token}`,
    );

    return response.body;
  }

  async setUserTelegramId(link: string) {
    const inviteLink = link.split('=')[1]
    const telegramId = '313184077'

    await request(this.server)
        .put(`/testing/set-telegram-id/${inviteLink}/${telegramId}`)
    return
  }
}
