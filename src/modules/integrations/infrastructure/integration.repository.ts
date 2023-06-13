import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TelegramBotSubscriptions } from './entity/telegram-bot-subscriptions.entity';

@Injectable()
export class IntegrationRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createNewBotSubscription(
    botSubscription: TelegramBotSubscriptions,
  ): Promise<string> {
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(TelegramBotSubscriptions)
      .values(botSubscription)
      .execute();

    return result.raw[0].authorizationCode;
  }

  async saveUserTelegramId(telegramId: number, authorizationCode: string) {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(TelegramBotSubscriptions)
      .set({ telegramId })
      .where({ authorizationCode })
      .execute();

    return result.affected !== 1;
  }

  async getBlogSubscribers(blogId: string) {
    const query = `
            SELECT ts."telegramId"
              FROM blog_subscription bs
              JOIN telegram_bot_subscriptions ts
                ON ts."userId" = bs."userId"
             WHERE bs."blogId" = $1 AND bs."isActive" = true; 
        `;
    return await this.dataSource.query(query, [blogId]);
  }
}
