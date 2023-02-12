import supertest from 'supertest';
import { INestApplication } from '@nestjs/common';
import { UserDto } from '../../src/modules/super-admin/api/dto/userDto';
import { getErrorMessage } from './helpers';

const errorsMessage = getErrorMessage(['login', 'password', 'email']);

export const registrationNewUser = async (
  request: typeof supertest,
  app: INestApplication,
  body: UserDto,
  statusCode: number,
  error: boolean,
) => {
  const response = await request(app.getHttpServer())
    .post('/auth/registration')
    .send(body)
    .expect(statusCode);

  if (error) {
    expect(response.body).toBe({ errorsMessage });
  }
};
