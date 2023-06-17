import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlogSubscription } from '../infrastructure/entity/blog-subscription.entity';
import { TelegramAdapter } from '../../../integrations/adapters/telegram.adapter';
import { IntegrationRepository } from '../../../integrations/infrastructure/integration.repository';

@Injectable()
export class SubscribeToBlogUseCase {
  constructor(
    private dataSource: DataSource,
    private telegramAdapter: TelegramAdapter,
    private integrationRepository: IntegrationRepository,
  ) {}

  async execute(userId: string, blogId: string): Promise<boolean> {
    const isExists =
      await this.integrationRepository.blogAndTelegramSubscriptionExists(
        userId,
        blogId,
      );

    if (!isExists.blogName) throw new NotFoundException();
    if (!!isExists.subscriptionExists) return true;

    const blogSubscription = BlogSubscription.create(userId, blogId);
    const subscribe = await this.integrationRepository.subscribeToBlog(
      blogSubscription,
    );

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
