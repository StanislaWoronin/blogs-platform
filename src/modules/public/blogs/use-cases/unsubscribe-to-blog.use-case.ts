import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlogSubscription } from '../infrastructure/entity/blog-subscription.entity';
import { IntegrationRepository } from '../../../integrations/infrastructure/integration.repository';

@Injectable()
export class UnsubscribeToBlogUseCase {
  constructor(
    private dataSource: DataSource,
    private integrationRepository: IntegrationRepository,
  ) {}

  async execute(userId: string, blogId: string): Promise<boolean> {
    const isExists =
      await this.integrationRepository.blogAndBlogSubscriptionExists(
        userId,
        blogId,
      );

    if (!!isExists.blogExists) throw new NotFoundException();
    if (!!isExists.subscriptionExists) return true;

    return await this.integrationRepository.updateSubscribeStatus(
      userId,
      blogId,
    );
  }
}
