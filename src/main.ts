import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './helpers/create-app';
import { monthsBetweenDates } from './helper.functions';
import {TelegramController} from "./modules/integrations/api/telegram.controller";

const port = process.env.PORT || 5000;

async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);
  await app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`);
  });
  const telegramController = await app.resolve(TelegramController)
  await telegramController.webhook()
}

bootstrap();
