import { INestApplication } from '@nestjs/common';
import { Blogger } from './request/blogger';
import { Comments } from './request/comments';
import { Factories } from './helper/factories';
import { Posts } from './request/posts';
import { SA } from './request/sa';
import { Blogs } from './request/blogs';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { EmailManager } from '../src/modules/public/auth/email-transfer/email.manager';
import { EmailManagerMock } from './mock/emailAdapter.mock';
import { createApp } from '../src/helpers/create-app';
import { Auth } from './request/auth';
import { Testing } from './request/testing';
import { Security } from './request/security';
import { randomUUID } from 'crypto';

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(5 * 60 * second);

  let app: INestApplication;
  let server;
  let auth: Auth;
  let blogger: Blogger;
  let blogs: Blogs;
  let comments: Comments;
  let factories: Factories;
  let posts: Posts;
  let sa: SA;
  let security: Security;
  let testing: Testing;

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
    auth = new Auth(server);
    blogger = new Blogger(server);
    blogs = new Blogs(server);
    comments = new Comments(server);
    factories = new Factories(server);
    posts = new Posts(server);
    sa = new SA(server);
    security = new Security(server);
    testing = new Testing(server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Fix mistake', () => {
    describe(
      'GET -> "/security/devices": should not change device id after call' +
        '/auth/refresh-token. LastActiveDate should be changed; status 200; content:' +
        ' device list;',
      () => {
        it('Clear data base', async () => {
          await testing.clearDb();
        });

        it('Create mistake', async () => {
          const [user] = await factories.createAndLoginUsers(1);
          const payload = await testing.getPayload(user.accessToken);

          await new Promise((r) => setTimeout(r, 5000));

          const newToken = await auth.getNewRefreshToken(user.refreshToken);
          const newPayload = await testing.getPayload(newToken.refreshToken);
          expect(payload.deviceId).toEqual(newPayload.deviceId);
          expect(payload.exp).not.toEqual(newPayload.exp);
          expect(payload.iat).not.toEqual(newPayload.iat);

          const isoStringPattern =
            /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

          const allSessions = await security.getAllActiveSessions(
            newToken.refreshToken,
          );
          expect(allSessions.status).toBe(200);
          expect(allSessions.body).toStrictEqual([
            {
              deviceId: newPayload.deviceId,
              title: expect.any(String),
              ip: expect.any(String),
              lastActiveDate: expect.stringMatching(isoStringPattern),
            },
          ]);
          expect(
            allSessions.body[0].lastActiveDate.match(isoStringPattern),
          ).toBeTruthy();
        });
      },
    );

    describe(
      'DELETE -> "/security/devices/:deviceId": should return error' +
        'if :id from uri param not found; status 404;',
      () => {
        it('Clear data base', async () => {
          await testing.clearDb();
        });

        it('Create mistake', async () => {
          const [user] = await factories.createAndLoginUsers(1);
          const randomId = randomUUID();

          const deleteStatus = await security.deleteDeviseById(
            randomId,
            user.refreshToken,
          );
          expect(deleteStatus).toBe(404);
        });
      },
    );

    describe(
      'DELETE -> "/security/devices": should delete all other devices' +
        'from device list; status 204; used additional methods:' +
        'ET => /security/devices',
      () => {
        it('Clear data base', async () => {
          await testing.clearDb();
        });

        it('Create mistake', async () => {
          const loginCount = 5;
          const user = await factories.createAndLoginOneUserManyTimes(
            loginCount,
          );

          const allSessions = await security.getAllActiveSessions(
            user.refreshToken,
          );
          expect(allSessions.body).toHaveLength(loginCount);

          const status = await security.deleteOtherDevices(user.refreshToken);
          expect(status).toBe(204);

          const allSessionsAfterDelete = await security.getAllActiveSessions(
            user.refreshToken,
          );
          expect(allSessionsAfterDelete.body).toHaveLength(1);
        });
      },
    );
  });
});
