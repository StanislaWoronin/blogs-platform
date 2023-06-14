import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { EmailManager } from '../src/modules/public/auth/email-transfer/email.manager';
import { EmailManagerMock } from './mock/emailAdapter.mock';
import { createApp } from '../src/helpers/create-app';
import { TEST } from './request/test';
import { settings } from '../src/settings';
import { randomUUID } from 'crypto';

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(5 * second);

  let app: INestApplication;
  let server;
  let test: TEST;

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
    test = new TEST(server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Subscribe to telegram', () => {
    it('Clear data base', async () => {
      await test.testing().clearDb();
    });

    it('Create data', async () => {
      const [user] = await test.factories().createAndLoginUsers(1);

      expect.setState({ accessToken: user.accessToken });
    });

    it('Try get telegram link without authorization.', async () => {
      const response = await test.integration().getTelegramInviteLink();
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Get telegram link.', async () => {
      const { accessToken } = expect.getState();
      const response = await test
        .integration()
        .getTelegramInviteLink(accessToken);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.link).toBeDefined();

      const [botLink, other] = response.body.link.split('?');
      expect(botLink).toStrictEqual(settings.telegram.botInviteLink);

      const [parameter, code] = other.split('=');
      expect(parameter).toBe('code');
      expect(code).toStrictEqual(expect.any(String));
    });
  });

  describe('Subscribe to blog', () => {
    it('Clear data base', async () => {
      await test.testing().clearDb();
    });

    it('Create data', async () => {
      const [blogger, subscriber] = await test
        .factories()
        .createAndLoginUsers(2);
      const [blog] = await test.factories().createBlogs(blogger.accessToken, 1);
      const inviteTelegramLink = await test
        .integration()
        .getTelegramInviteLink(subscriber.accessToken);

      await test.testing().setUserTelegramId(inviteTelegramLink.body.link);

      expect.setState({
        blogger,
        subscriber,
        blog,
      });
    });

    it('404', async () => {
      const { subscriber } = expect.getState();
      const randomBlogId = randomUUID();
      const response = await test
        .blogs()
        .subscribeToBlog(randomBlogId, subscriber.accessToken);
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('401', async () => {
      const randomBlogId = randomUUID();
      const response = await test.blogs().subscribeToBlog(randomBlogId);
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('204', async () => {
      const { subscriber, blog } = expect.getState();

      const response = await test
        .blogs()
        .subscribeToBlog(blog.id, subscriber.accessToken);
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
    });
  });

  describe('Subscriber should take message when blogger create new post', () => {
    it('Clear data base', async () => {
      await test.testing().clearDb();
    });

    it('Create data', async () => {
      const [blogger, subscriber] = await test
        .factories()
        .createAndLoginUsers(2);
      const [blog] = await test.factories().createBlogs(blogger.accessToken, 1);
      const inviteTelegramLink = await test
        .integration()
        .getTelegramInviteLink(subscriber.accessToken);
      await test.testing().setUserTelegramId(inviteTelegramLink.body.link);
      await test.blogs().subscribeToBlog(blog.id, subscriber.accessToken);

      expect.setState({
        bloggerToken: blogger.accessToken,
        blogId: blog.id,
      });
    });

    it('Blogger create blog', async () => {
      const { bloggerToken, blogId } = expect.getState();
      await test.factories().createPostsForBlog(bloggerToken, blogId, 1);
    });
  });

  describe('Get membership', () => {
    it('Clear data base', async () => {
      await test.testing().clearDb();
    });

    it('Create data', async () => {
      const [fistBlogger, secondBlogger] = await test
        .factories()
        .createAndLoginUsers(2);
      const [fistBlogFB, secondBlogFB] = await test
        .factories()
        .createBlogs(fistBlogger.accessToken, 2);
      const [fistBlogSB, secondBlogSB] = await test
        .factories()
        .createBlogs(secondBlogger.accessToken, 2, 2);
      const membershipCount = 5;
      const membership = await test
        .factories()
        .createMembership(fistBlogFB.id, membershipCount, 2);
      // наполняем таблицу "мусорными данными"
      await test
        .factories()
        .createMembership(secondBlogFB.id, 1, membershipCount + 2);
      await test
        .factories()
        .createMembership(fistBlogSB.id, 1, membershipCount + 3);
      await test
        .factories()
        .createMembership(secondBlogSB.id, 1, membershipCount + 4);

      expect.setState({
        accessToken: fistBlogger.accessToken,
        blogId: fistBlogFB.id,
        membership,
      });
    });

    it('401', async () => {
      const { blogId } = expect.getState();

      const response = await test.blogger().getMembership(blogId);
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Blogger should get page with membership', async () => {
      const { accessToken, blogId } = expect.getState();

      const response = await test.blogger().getMembership(blogId, accessToken);
      expect(response.status).toBe(HttpStatus.OK);
    });
  });
});
