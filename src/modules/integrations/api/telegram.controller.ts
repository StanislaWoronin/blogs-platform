import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenValidationGuard } from '../../../guards/access-token-validation.guard';
import { User } from '../../../decorator/user.decorator';
import { UserDBModel } from '../../super-admin/infrastructure/entity/userDB.model';
import {TelegramAdapter} from "../adapters/telegram.adapter";
import {settings} from "../../../settings";

@Controller('integrations/telegram/webhook')
export class TelegramController {
  constructor(private telegramAdapter: TelegramAdapter) {
  }

  @Post('webhook')
  async webhook() {
    await this.telegramAdapter.setWebhook(settings.local + '/notification/telegram')
  }

  @Get('auth-bot-link')
  @UseGuards(AccessTokenValidationGuard)
  async getPersonalTelegramLink(@User() user: UserDBModel) {}
}
