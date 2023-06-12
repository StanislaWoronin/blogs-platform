import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './helpers/create-app';
import { settings } from './settings';
import { Logger } from '@nestjs/common';

const port = settings.PORT;

async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);
  await app.listen(port, async () => {
    Logger.verbose(`Example app listening on port ${port}`);
  });
}

bootstrap();
