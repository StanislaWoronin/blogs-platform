import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import {
  preparedPassword,
  preparedSecurity,
  preparedUser,
  prepareLogin,
  superUser
} from "./helper/prepeared-data";
import { getErrorMessage } from './helper/helpers';
import { createApp } from '../src/helpers/create-app';
import { EmailManager } from '../src/modules/public/auth/email-transfer/email.manager';
import { EmailManagerMock } from './mock/emailAdapter.mock';
import {randomUUID} from "crypto";
import {ExpectAuthModel} from "./helper/expect-auth.model";
import {endpoints} from "./helper/routing";

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(30 * second);

  let app: INestApplication;
  let server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailManager)
      .useValue(new EmailManagerMock())
      .compile();

    const rawApp = await moduleFixture.createNestApplication();
    app = createApp(rawApp);
    await app.init();
    server = await app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Drop all data.', async () => {
    await request(server)
        .delete(endpoints.testingController.allData)
        .expect(204)
  })

  describe('Auth router testing (without 429)', () => {
    describe('Registration user in system', () => {
      it('Shouldn`t registration user. 400 - Short input data.', () => {
        request(server)
            .post(endpoints.authController.registration)
            .send(preparedUser.short)
            .expect(400)
      })

      it('Shouldn`t registration user. 400 - Long input data.', () => {
        request(server)
            .post(endpoints.authController.registration)
            .send(preparedUser.long)
            .expect(400)
      })

      it('Shouldn`t registration user. 400 - Existed login and email', () => {
        request(server)
            .post(endpoints.authController.registration)
            .send(preparedUser.valid1)
            .expect(400)
      })

      it('Should registration user. 204 - Input data is accepted. Email with confirmation code will be send to passed email address.', async () => {
        await request(server)
            .post(endpoints.authController.registration)
            .send(preparedUser.valid1)
            .expect(204)

        const response = await request(server)
            .get(endpoints.sa.users)
            .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
            .expect(200)

        expect(response.body.items).toHaveLength(1)

        expect.setState({user: response.body.items[0]})
      })
    })

    describe('Resending confirmation code', () => {
      it('Shouldn`t resending confirmation code. 400 - Incorrect input data', () => {
        request(server)
            .post(endpoints.authController.registrationEmailResending)
            .send({email: 'notmailgmail.com'})
            .expect(400)

        request(server)
            .post(endpoints.authController.registrationEmailResending)
            .send({email: 'notmail@g.com'})
            .expect(400)

        request(server)
            .post(endpoints.authController.registrationEmailResending)
            .send({email: 'notmail@gmail.c'})
            .expect(400)
      })

      it('Shouldn`t resending confirmation code. 400 - Unregistered mail.', async () => {
        const response = await request(server)
            .post(endpoints.authController.registrationEmailResending)
            .send({email: 'unregistered@gmail.com'})
            .expect(400)

        const errorsMessages = getErrorMessage(['email'])
        expect(response.body).toStrictEqual({ errorsMessages })
      })

      it('Should resending confirmation code. 204 - Input data is accepted.Email with confirmation code will be send.', async () => {
        const response = await request(server)
            .get(endpoints.sa.users)
            .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
            .expect(200)

        const oldConfirmationCode = await request(server)
            .get(`/testing/confirmation-code/${response.body.items[0].id}`)
            .expect(200)

        await request(server)
            .post(endpoints.authController.registrationEmailResending)
            .send({email: preparedUser.valid1.email})
            .expect(204)

        const newConfirmationCode = await request(server)
            .get(`/testing/is-confirmed/${response.body.items[0].id}`)
            .expect(200)

        expect(oldConfirmationCode.body).not.toEqual(newConfirmationCode.body)

        expect.setState({confirmationCode: newConfirmationCode})
      })
    })

    describe('Confirm registration', () => {
      it('Shouldn`t confirmed if the confirmation code is incorrect', async () => {
        const response = await request(server)
            .get(endpoints.sa.users)
            .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
            .expect(200)

        expect.setState({userId: response.body.items[0].id})

        const confirmationCode = await request(server)
            .get(`/testing/confirmation-code/${response.body.items[0].id}`)
            .expect(200)

        request(server)
            .post(endpoints.authController.registrationConfirmation)
            .send({code: `${confirmationCode.body}-1`})
            .expect(400)
      })

      it('Shouldn`t confirmed if the confirmation code is expired', async () => {
        const { userId } = expect.getState()

        await request(server)
            .put(`/testing/set-expiration-date/${userId}`)
            .expect(204)

        const confirmationCode = await request(server)
            .get(`/testing/confirmation-code/${userId}`)
            .expect(200)

        request(server)
            .post(endpoints.authController.registrationConfirmation)
            .send({code: confirmationCode.body})
            .expect(400)
      })

      it('Email was verified. Account was activated', async () => {
        const { userId } = expect.getState()

        const confirmationCode = await request(server)
            .get(`/testing/confirmation-code/${userId}`)
            .expect(200)

        request(server)
            .post(endpoints.authController.registrationConfirmation)
            .send({code: confirmationCode.body})
            .expect(204)

        expect.setState({confirmationCode: confirmationCode})
      })

      it('Shouldn`t confirmed if the confirmation code is already been applied', async () => {
        const { confirmationCode } = expect.getState()

        request(server)
            .post(endpoints.authController.registrationConfirmation)
            .send({code: confirmationCode.body})
            .expect(400)
      })
    })

    describe('Password recovery via Email confirmation', () => {
      it('If the inputModel has invalid email', async () => {
        await request(server)
            .post(endpoints.authController.passwordRecovery)
            .send(preparedSecurity.email.notValid)
            .expect(400)
      })

      it('Shouldn`t return error even if current email is not registered (for prevent user`s email detection)', async () => {
        await request(server)
            .post(endpoints.authController.passwordRecovery)
            .send(preparedSecurity.email.notExist)
            .expect(204)
      })

      it('Should update confirmation code', async () => {
        const user = await request(server)
            .get(endpoints.sa.users)
            .send(preparedUser.valid1)
            .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
            .expect(200)

        const oldConfirmationCode = await request(server)
            .get(`/testing/confirmation-code/${user.body.items[0].id}`)
            .expect(200)

        await request(server)
            .post(endpoints.authController.passwordRecovery)
            .send(preparedSecurity.email.valid)
            .expect(204)

        const newConfirmationCode = await request(server)
            .get(`/testing/confirmation-code/${user.body.items[0].id}`)
            .expect(200)

        expect(oldConfirmationCode).not.toEqual(newConfirmationCode)
      })
    })

    describe('Update password', () => {
      it('Shouldn`t confirm password recovery if incorrect input data', async () => {
        const errorsMessages = getErrorMessage(['newPassword', 'recoveryCode'])
        const randomCode = randomUUID()

        const response1 = await request(server)
            .post(endpoints.authController.newPassword)
            .send({
              newPassword: preparedPassword.short,
              recoveryCode: randomCode
            })
            .expect(400)

        expect(response1.body).toEqual({errorsMessages})

        const response2 = await request(server)
            .post(endpoints.authController.newPassword)
            .send({
              newPassword: preparedPassword.long,
              recoveryCode: randomCode
            })
            .expect(400)

        expect(response2.body).toEqual({errorsMessages})
      })

      it('Shouldn`t confirm password recovery if recovery code expired', async () => {
        const {user} = expect.getState()
        const errorsMessages = getErrorMessage(['recoveryCode'])

        await request(server)
            .put(`/testing/set-expiration-date/${user.id}`)
            .expect(204)

        const recoveryCode = await request(server)
            .get(`/testing/confirmation-code/${user.id}`)
            .expect(200)

        const response = await request(server)
            .post(endpoints.authController.newPassword)
            .send({
              newPassword: preparedPassword.newPass,
              recoveryCode: recoveryCode.body
            })
            .expect(400)

        expect(response.body).toEqual({errorsMessages})
      })

      it('Confirm password recovery', async () => {
        const {user} = expect.getState()

        const oldPassword = await request(server)
          .get(`/testing/user-password/${user.id}`)
          .expect(200)

        await request(server)
          .post(endpoints.authController.passwordRecovery)
          .send(preparedSecurity.email.valid)
          .expect(204)

        const code = await request(server)
          .get(`/testing/confirmation-code/${user.id}`)
          .expect(200)

        await request(server)
          .post(endpoints.authController.newPassword)
          .send({
            newPassword: preparedPassword.newPass,
            recoveryCode: code.body.confirmationCode
          })
          .expect(204)

        const newPassword = await request(server)
          .get(`/testing/user-password/${user.id}`)
          .expect(200)

        expect(oldPassword).not.toEqual(newPassword)
      })
    })

    describe('Try login user to the system', () => {
      it('Shouldn`t login if the password or login is wrong', async () => {
        await request(server)
          .post(endpoints.authController.login)
          .send(prepareLogin.notExist)
          .set({ 'user-agent': 'chrome/0.1' })
          .expect(401)
      })

      it('Shouldn`t login if the password or login is wrong', async () => {
        await request(server)
          .post(endpoints.authController.login)
          .send(prepareLogin.notValid)
          .set({ 'user-agent': 'chrome/0.1' })
          .expect(400)
      })

      it('Should login and return token', async () => {
        const response = await request(server)
          .post(endpoints.authController.login)
          .send(preparedUser.login1withNewPassword)
          .set({ 'user-agent': 'chrome/0.1' })
          .expect(200)

        expect(response.body.accessToken).toBeTruthy()
        expect(response.headers['set-cookie'][0].split(';')[0]).toBeTruthy()

        expect.setState({accessToken: response.body.accessToken})
        expect.setState({refreshToken: (response.headers['set-cookie'][0].split(';')[0]).slice(13)})
      })
    })

    describe('Generate new pair of access and refresh token', () => {
      it('Shouldn`t generate new pair token if the JWT refreshToken inside cookie is missing', async () => {
        request(server)
            .post(endpoints.authController.refreshToken)
            .expect(401)
      })

      it('Shouldn`t generate new pair token if the JWT refreshToken inside cookie is expired', async () => {
        const { refreshToken } = expect.getState()

        const token = await request(server)
            .get(`/testing/expired-token/${refreshToken}`)
            .expect(200)

        const second = 1000;
        jest.setTimeout(second)

        request(server)
            .post('/auth/refresh-token')
            .set("Cookie", `refreshToken=${token.body.expiredToken}`)
            .expect(401)
      })

      it('Shouldn`t generate new pair token if the JWT refreshToken inside cookie is incorrect', async () => {
        const { refreshToken } = expect.getState()

        await request(server)
            .post(endpoints.authController.refreshToken)
            .set("Cookie", `refreshToken=${refreshToken}-1`)
            .expect(401)
      })

      it('Shouldn return new pair of access and refresh token', async () => {
        const { refreshToken } = expect.getState()

        const response = await request(server)
            .post(endpoints.authController.refreshToken)
            .set("Cookie", `refreshToken=${refreshToken}`)
            .expect(200)

        expect(response.body.accessToken).toBeTruthy()
        expect(response.headers['set-cookie'][0].split(';')[0]).toBeTruthy()

        expect.setState({
          newAccessToken: response.body.accessToken,
          newRefreshToken: (response.headers['set-cookie'][0].split(';')[0]).slice(13)
        })
      })
    })

    describe('Get information about current user', () => {
      it('Shouldn`t return info about user if unauthorized', async () => {
        await request(server)
            .get(endpoints.authController.me)
            .expect(401)
      })

      it('Return info about user', async () => {
        const { newAccessToken, user } = expect.getState()

        const response = await request(server)
            .get(endpoints.authController.me)
            .auth(newAccessToken, {type: 'bearer'})
            .expect(200)

        expect(response.body).toEqual(ExpectAuthModel(user))
      })
    })

    describe('Logout user from system', () => {
      it('Shouldn`t logout if refresh token missing', async () => {
        await request(server)
            .post(endpoints.authController.login)
            .expect(401)
      })

      it('Shouldn`t logout if refresh token is expired', async () => {
        const {refreshToken} = expect.getState()

        const expiredToken = await request(server)
            .get(`/testing/expired-token/${refreshToken}`)
            .expect(200)

        const second = 1000;
        jest.setTimeout(second)

        await request(server)
            .post(endpoints.authController.login)
            .set('Cookie', `refreshToken=${expiredToken.body.expiredToken}`)
            .expect(401)
      })

      it('Shouldn`t logout if refresh token is incorrect', async () => {
        const {refreshToken} = expect.getState()

        await request(server)
            .post(endpoints.authController.login)
            .set('Cookie', `refreshToken=${refreshToken}-1`)
            .expect(401)
      })

      it('Should logout from sistem', async () => {
        const {newRefreshToken} = expect.getState()
        console.log(newRefreshToken)
        await request(server)
            .post(endpoints.authController.login)
            .set('Cookie', `refreshToken=${newRefreshToken}`)
            .expect(204) // TODO креате токен возвращает токетпротухший еще в 1970

        await request(server)
            .post(endpoints.authController.login)
            .set('Cookie', `refreshToken=${newRefreshToken}`)
            .expect(401)
      })
    })
  })
});
