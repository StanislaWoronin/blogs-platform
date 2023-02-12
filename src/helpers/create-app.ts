import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ErrorExceptionFilter } from '../exception-filters/error-exception.filter';
import { HttpExceptionFilter } from '../exception-filters/exception.filter';
import { useContainer } from 'class-validator';
import { AppModule } from '../app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

export const createApp = (app: INestApplication): INestApplication => {
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalFilters(new ErrorExceptionFilter(), new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,

      exceptionFactory: (errorsMessages) => {
        const errorsForResponse = [];

        errorsMessages.forEach((e) => {
          const keys = Object.keys(e.constraints);
          errorsForResponse.push({
            message: e.constraints[keys[0]],
            field: e.property,
          });
        });

        throw new BadRequestException(
          errorsForResponse,
          //errorsMessages.map((e) => e.constraints),
        );
      },
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  return app;
};
