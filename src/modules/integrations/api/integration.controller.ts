import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { User } from '../../../decorator/user.decorator';
import { UserDBModel } from '../../super-admin/infrastructure/entity/userDB.model';
import { TelegramAdapter } from '../adapters/telegram.adapter';
import { CreateNewBotSubscriptionUseCase } from '../use-cases/create-new-bot-subscription.use-case';
import { AuthBearerGuard } from '../../../guards/auth.bearer.guard';
import { TelegramMessageDto } from './dto/telegram-message.dto';
import { SetUserTelegramIdUseCase } from '../use-cases/set-user-telegram-id.use-case';

@Controller('integrations/telegram')
export class IntegrationController {
  constructor(
    private telegramAdapter: TelegramAdapter,
    private createNewBotSubscriptionUseCase: CreateNewBotSubscriptionUseCase,
    private setUserTelegramIdUseCase: SetUserTelegramIdUseCase,
  ) {}

  @Post('webhook')
  async webhook() {
    const baseUrl = '';
    await this.telegramAdapter.setWebhook(baseUrl + '/notification/telegram');
  }

  @Get('auth-bot-link')
  @UseGuards(AuthBearerGuard)
  async getPersonalTelegramLink(@User() user: UserDBModel) {
    const inviteLink = await this.createNewBotSubscriptionUseCase.execute(
      user.id,
    );

    return inviteLink;
  }

  @Post()
  async forTelegramHook(@Body() payload: TelegramMessageDto) {
    return await this.setUserTelegramIdUseCase.execute(payload);
  }
}
