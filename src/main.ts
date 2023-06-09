import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './helpers/create-app';
import {monthsBetweenDates} from "./helper.functions";

const port = process.env.PORT || 5000;

async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);
  await app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`);
  });
}

bootstrap();
