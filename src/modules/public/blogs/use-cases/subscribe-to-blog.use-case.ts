import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlogSubscription } from '../infrastructure/entity/blog-subscription.entity';
import { TelegramAdapter } from '../../../integrations/adapters/telegram.adapter';

@Injectable()
export class SubscribeToBlogUseCase {
  constructor(
    private dataSource: DataSource,
    private telegramAdapter: TelegramAdapter,
  ) {}

  async execute(userId: string, blogId: string): Promise<boolean> {
    const isExists: isExists = await this.dataSource.query(
      `
            SELECT
                CASE WHEN EXISTS (
                    SELECT 1
                      FROM blog_subscription
                     WHERE "userId" = $1 AND "blogId" = $2
                ) THEN 0 ELSE 1 END AS "subscriptionExists",
                SELECT "telegramId"
                  FROM telegram_bot_subscriptions
                 WHERE "userId" = $1,
                SELECT name as "blogName"
                  FROM blogs
                 WHERE "blogId" = $2;
        `,
      [userId, blogId],
    );
    // в квери выше нужна инверсия значений, если не сделать ее,
    // то в проверке ниже при существованиии блога мы получим 404
    if (!!isExists.blogName) throw NotFoundException;
    if (!!isExists.subscriptionExists) return true;

    const blogSubscription = BlogSubscription.create(userId, blogId);
    const subscribe = await this.dataSource
      .getRepository(BlogSubscription)
      .create(blogSubscription);

    if (!subscribe) throw new Error('Something went wrong');

    if (isExists.telegramId) {
      this.telegramAdapter.sendMessage(
        isExists.telegramId,
        `Hi you subscribed to the ${isExists.blogName} blog!`,
      );
    }

    return;
  }
}
type isExists = {
  subscriptionExists: 0 | 1;
  telegramId: number;
  blogName: string | null;
};
