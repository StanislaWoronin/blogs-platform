import supertest from 'supertest';
import { INestApplication } from '@nestjs/common';
import { preparedUser, superUser } from './prepeared-data';

import { isUUID } from 'class-validator';
import { UserViewModel } from '../../src/modules/super-admin/api/dto/user.view.model';

export const createNewUser = async (
  request: typeof supertest,
  app: INestApplication,
  // body: UserDTO
) => {
  const response = await request(app.getHttpServer())
    .post('/sa/users')
    .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
    .send(preparedUser.valid1);

  expect(response).toBeDefined();
  expect(response.status).toBe(201);

  const user: UserViewModel = response.body;
  expect(user).toEqual({
    id: expect.any(String),
    login1: preparedUser.valid1.login,
    email: preparedUser.valid1.email,
    createdAt: expect.stringMatching(
      /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
    ),
    banInfo: {
      isBanned: false,
      banDate: null,
      banReason: null,
    },
  });

  expect(isUUID(user.id)).toBeTruthy();
  expect(new Date(user.createdAt) < new Date()).toBeTruthy();
  return user;
};

export const getErrorMessage = (fields) => {
  const errorsMessages = [];
  for (let i = 0, length = fields.length; i < length; i++) {
    errorsMessages.push({
      message: expect.any(String),
      field: fields[i],
    });
  }

  return errorsMessages;
};
