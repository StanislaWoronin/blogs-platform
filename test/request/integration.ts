import request from 'supertest';

export class Integration {
  constructor(private readonly server: any) {}

  async getTelegramInviteLink(accessToken?: string) {
    const response = await request(this.server)
      .get('/integrations/telegram/auth-bot-link')
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status, body: response.body };
  }
}
