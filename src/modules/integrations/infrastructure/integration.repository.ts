import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TelegramBotSubscriptions } from './entity/telegram-bot-subscriptions.entity';
import { SubscribeToBlogUseCase } from '../../public/blogs/use-cases/subscribe-to-blog.use-case';
import { BlogSubscription } from '../../public/blogs/infrastructure/entity/blog-subscription.entity';

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

  async blogAndSubscriptionExists(
    userId: string,
    blogId: string,
  ): Promise<isExists> {
    const query = `
        SELECT
             CASE
               WHEN EXISTS (
                 SELECT 1
                   FROM blog_subscription
                  WHERE "userId" = $1 AND "blogId" = $2
               ) THEN 1
               ELSE 0
             END AS "subscriptionExists",
             (SELECT "telegramId"
                FROM telegram_bot_subscriptions
               WHERE "userId" = $1) AS "telegramId",
             (SELECT name AS "blogName"
                FROM blogs
               WHERE "id" = $2) AS "blogName";           
        `;
    // в квери выше нужна инверсия значений, если не сделать ее,
    // то при отсутствии подписки мы не завершим функцию
    const result = await this.dataSource.query(query, [userId, blogId]);

    return result[0];
  }

  async subscribeToBlog(blogSubscription: BlogSubscription) {
    const subscribe = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(BlogSubscription)
      .values(blogSubscription)
      .execute();

    return subscribe;
  }
}

type isExists = {
  subscriptionExists: 0 | 1;
  telegramId: number;
  blogName: string | null;
};
