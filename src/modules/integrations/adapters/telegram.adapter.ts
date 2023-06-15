import axios, { AxiosInstance } from 'axios';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { settings } from '../../../settings';
import { Environment } from '../../../helpers/environment.model';
import { Logger } from '@nestjs/common';
import ngrok from 'ngrok';

@Injectable()
export class TelegramAdapter implements OnModuleInit {
  private readonly logger = new Logger(TelegramAdapter.name);
  private readonly axiosInstance: AxiosInstance;
  constructor() {
    const token = settings.telegram.botToken;
    this.axiosInstance = axios.create({
      baseURL: `${settings.telegram.baseUrl}${settings.telegram.botToken}/`,
    });
  }

  private async connectToNgrok() {
    const url = await ngrok.connect({
      port: settings.PORT,
      authtoken: settings.ngrok.authToken,
    });

    return url;
  }

  async onModuleInit() {
    let baseUrl = settings.LOCAL ? settings.local : settings.POSTGRES_URI;
    if (settings.environment === Environment.Development) {
      baseUrl = await this.connectToNgrok();
    }

    const res = await this.setWebhook(`${baseUrl}/integrations/telegram`);
    if (res.status === HttpStatus.OK) {
      this.logger.verbose(`Ngrok connection is success. App url: ${baseUrl}`);
    }
  }

  async setWebhook(url: string) {
    return this.axiosInstance.post(`setWebhook`, {
      url: url,
    });
  }

  async sendMessage(recipientId: number, text: string) {
    await this.axiosInstance.post(`sendMessage`, {
      chat_id: recipientId,
      text: text,
    });
  }
}
