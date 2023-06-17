import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './helpers/create-app';
import { settings } from './settings';
import { Logger } from '@nestjs/common';
import { LoggingInterceptor } from './helpers/logging.interceptor';

const port = settings.PORT;

async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);

  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(port, async () => {
    Logger.verbose(`Example app listening on port ${port}`);
  });
}

bootstrap();
