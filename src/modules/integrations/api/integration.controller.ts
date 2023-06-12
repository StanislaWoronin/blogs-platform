import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenValidationGuard } from '../../../guards/access-token-validation.guard';
import { User } from '../../../decorator/user.decorator';
import { UserDBModel } from '../../super-admin/infrastructure/entity/userDB.model';
import { TelegramAdapter } from '../adapters/telegram.adapter';

@Controller('integrations/telegram')
export class IntegrationController {
  constructor(private telegramAdapter: TelegramAdapter) {}

  @Post('webhook')
  async webhook() {
    const baseUrl = '';
    await this.telegramAdapter.setWebhook(baseUrl + '/notification/telegram');
  }

  @Get('auth-bot-link')
  @UseGuards(AccessTokenValidationGuard)
  async getPersonalTelegramLink(@User() user: UserDBModel) {}

  @Post()
  async forTelegramHook(@Body() payload: any) {
    console.log(payload);
    return this.telegramAdapter.sendMessage(payload.message.from.id, '123');
  }
}
