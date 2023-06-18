import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { EmailManager } from '../src/modules/public/auth/email-transfer/email.manager';
import { EmailManagerMock } from './mock/emailAdapter.mock';
import { createApp } from '../src/helpers/create-app';
import { TEST } from './request/test';
import { settings } from '../src/settings';
import { randomUUID } from 'crypto';
import { Currency } from '../src/modules/blogger/api/views/currency';
import { SubscriptionStatus } from '../src/modules/integrations/subscription-status.enum';
import { sleep } from './helper/helpers';
// import TelegramServer from 'telegram-test-api';
//
// import TelegramBot from 'node-telegram-bot-api';
// import { TestBot } from './bot/test-bot';

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(5 * second);

  let app: INestApplication;
  let server;
  let test: TEST;
  //let testRepo: ITestingRepository
  let serverConfig;
  const token = settings.telegram.botToken;
  let telegramServer;
  let client;

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
    //testRepo = app.get(ITestingRepository)

    // serverConfig = { port: settings.PORT };
    // telegramServer = new TelegramServer(serverConfig);
    // return telegramServer.start().then(() => {
    //   client = telegramServer.getClient(token);
    // });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Subscribe to telegram', () => {
    it('Clear data base', async () => {
      const res = await test.testing().clearDb();
      expect(res).toBe(204);
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
      const res = await test.testing().clearDb();
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
      const [subscriber] = await test
        .factories()
        .createMembership(secondBlogSB.id, 1, membershipCount + 4);

      expect.setState({
        accessToken: fistBlogger.accessToken,
        blog: fistBlogFB,
        blogId: fistBlogFB.id,
        membership,
        subscriber,
      });
    });

    it('401', async () => {
      const { blogId } = expect.getState();

      const response = await test.blogger().getMembership(blogId);
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('Blogger should get page with membership', async () => {
      const { accessToken, blog, blogId, membership } = expect.getState();
      const response = await test.blogger().getMembership(blogId, accessToken);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 5,
        items: [
          {
            userId: membership[4].user.id,
            userLogin: membership[4].user.login,
            blogId: blog.id,
            blogTitle: blog.name,
            membershipPlan: {
              id: expect.any(String),
              monthsCount: 0,
              price: 0,
              currency: Currency.BYN,
            },
          },
          {
            userId: membership[3].user.id,
            userLogin: membership[3].user.login,
            blogId: blog.id,
            blogTitle: blog.name,
            membershipPlan: {
              id: expect.any(String),
              monthsCount: 0,
              price: 0,
              currency: Currency.BYN,
            },
          },
          {
            userId: membership[2].user.id,
            userLogin: membership[2].user.login,
            blogId: blog.id,
            blogTitle: blog.name,
            membershipPlan: {
              id: expect.any(String),
              monthsCount: 0,
              price: 0,
              currency: Currency.BYN,
            },
          },
          {
            userId: membership[1].user.id,
            userLogin: membership[1].user.login,
            blogId: blog.id,
            blogTitle: blog.name,
            membershipPlan: {
              id: expect.any(String),
              monthsCount: 0,
              price: 0,
              currency: Currency.BYN,
            },
          },
          {
            userId: membership[0].user.id,
            userLogin: membership[0].user.login,
            blogId: blog.id,
            blogTitle: blog.name,
            membershipPlan: {
              id: expect.any(String),
              monthsCount: 0,
              price: 0,
              currency: Currency.BYN,
            },
          },
        ],
      });
    });

    it('Public get blog by id by subscriber', async () => {
      const { blog, blogId, membership } = expect.getState();

      const response = await test
        .blogs()
        .getBlogById(blogId, membership[0].accessToken);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        id: blog.id,
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        isMembership: blog.isMembership,
        createdAt: blog.createdAt,
        images: blog.images,
        currentUserSubscriptionStatus: SubscriptionStatus.Subscribed,
        subscribersCount: 5,
      });
    });

    it('Public get blog by id unauthorized user', async () => {
      const { blog, blogId } = expect.getState();

      const response = await test.blogs().getBlogById(blogId);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        id: blog.id,
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        isMembership: blog.isMembership,
        createdAt: blog.createdAt,
        images: blog.images,
        currentUserSubscriptionStatus: SubscriptionStatus.None,
        subscribersCount: 5,
      });
    });

    it(`Get blogs`, async () => {
      const response = await test.blogs().getBlogs();

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 4,
        items: [
          {
            id: expect.any(String),
            name: 'name3',
            description: 'description3',
            websiteUrl: 'websiteUrl3.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.None,
            subscribersCount: 1,
            images: {
              wallpaper: null,
              main: [],
            },
          },
          {
            id: expect.any(String),
            name: 'name2',
            description: 'description2',
            websiteUrl: 'websiteUrl2.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.None,
            subscribersCount: 1,
            images: {
              wallpaper: null,
              main: [],
            },
          },
          {
            id: expect.any(String),
            name: 'name1',
            description: 'description1',
            websiteUrl: 'websiteUrl1.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.None,
            subscribersCount: 1,
            images: {
              wallpaper: null,
              main: [],
            },
          },
          {
            id: expect.any(String),
            name: 'name0',
            description: 'description0',
            websiteUrl: 'websiteUrl0.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.None,
            subscribersCount: 5,
            images: {
              wallpaper: null,
              main: [],
            },
          },
        ],
      });
    });

    it(`Get blogs by authorisation user`, async () => {
      const { subscriber } = expect.getState();

      const response = await test.blogs().getBlogs(subscriber.accessToken);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 4,
        items: [
          {
            id: expect.any(String),
            name: 'name3',
            description: 'description3',
            websiteUrl: 'websiteUrl3.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.Subscribed,
            subscribersCount: 1,
            images: {
              wallpaper: null,
              main: [],
            },
          },
          {
            id: expect.any(String),
            name: 'name2',
            description: 'description2',
            websiteUrl: 'websiteUrl2.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.None,
            subscribersCount: 1,
            images: {
              wallpaper: null,
              main: [],
            },
          },
          {
            id: expect.any(String),
            name: 'name1',
            description: 'description1',
            websiteUrl: 'websiteUrl1.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.None,
            subscribersCount: 1,
            images: {
              wallpaper: null,
              main: [],
            },
          },
          {
            id: expect.any(String),
            name: 'name0',
            description: 'description0',
            websiteUrl: 'websiteUrl0.com',
            isMembership: false,
            createdAt: expect.any(String),
            currentUserSubscriptionStatus: SubscriptionStatus.None,
            subscribersCount: 5,
            images: {
              wallpaper: null,
              main: [],
            },
          },
        ],
      });
    });
  });

  describe('Update subscribe status', () => {
    it('Clear data base', async () => {
      const res = await test.testing().clearDb();
    });

    it('Create data', async () => {
      const [blogger, user] = await test.factories().createAndLoginUsers(2);
      const [blog] = await test.factories().createBlogs(blogger.accessToken, 1);
      await test.blogs().subscribeToBlog(blog.id, user.accessToken);

      expect.setState({
        user,
        accessToken: user.accessToken,
        blog: blog,
        blogId: blog.id,
      });
    });

    it('User try unsubscribe, 404', async () => {
      const { accessToken } = expect.getState();
      const randomBlogId = randomUUID();

      const response = await test
        .blogs()
        .updateSubscribeStatus(randomBlogId, accessToken);
      expect(response).toBe(HttpStatus.NOT_FOUND);
    });

    it('User try unsubscribe, 401', async () => {
      const { blogId } = expect.getState();

      const response = await test.blogs().updateSubscribeStatus(blogId);
      expect(response).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('User should unsubscribe, 204', async () => {
      const { accessToken, blogId } = expect.getState();

      const response = await test
        .blogs()
        .updateSubscribeStatus(blogId, accessToken);
      expect(response).toBe(HttpStatus.NO_CONTENT);
    });

    it('Get blog authoritative user after unsubscribe', async () => {
      const { accessToken, blog, blogId } = expect.getState();

      const response = await test.blogs().getBlogById(blogId, accessToken);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        id: blog.id,
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        isMembership: blog.isMembership,
        createdAt: blog.createdAt,
        images: blog.images,
        currentUserSubscriptionStatus: SubscriptionStatus.UnSubscribed,
        subscribersCount: 0,
      });
    });
  });

  describe('Try get telegram link after subscribe to blog', () => {
    it('Clear data base', async () => {
      const res = await test.testing().clearDb();
    });

    it('Create data', async () => {
      const [blogger, firstUser, secondUser] = await test
        .factories()
        .createAndLoginUsers(3);
      const [blog] = await test.factories().createBlogs(blogger.accessToken, 1);
      await test.blogs().subscribeToBlog(blog.id, firstUser.accessToken);
      console.log({ blogger: blogger.accessToken });
      console.log({ firstUser: firstUser.accessToken });
      console.log({ blogId: blog.id });
      expect.setState({
        blogger,
        firstUser,
        secondUser,
        blog: blog,
      });
    });

    it('Try get telegram link after subscribe to blog', async () => {
      const { firstUser } = expect.getState();
      const response = await test
        .integration()
        .getTelegramInviteLink(firstUser.accessToken);
      expect(response.status).toBe(HttpStatus.OK);
      console.log(response.body);
      const [code] = response.body.link.split('?')[1];

      // const message = client.makeMessage(`/start ${code}`);
      // await client.sendMessage(message);
      // console.log(server.config.apiURL);
      // const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
      // const telegramBot = new TelegramBot(token, botOptions);
      // const testBot = new TestBot(telegramBot);
      // const updates = await client.getUpdates();
      // console.log(updates);
    });
  });

  describe('Create post', () => {
    it('it', async () => {
      const AT =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3Mzc4NzMxYS0yYjU4LTQxYWQtOGYyYS0wODliNmI1YzczODMiLCJkZXZpY2VJZCI6ImI4MDk1NDA1LThjNmEtNDhjMy1hYTU3LWFiYjg1NjM2YjQwZSIsImlhdCI6MTY4NzEwNjYzMiwiZXhwIjoxMTY4NzEwNjYzMn0.Nr-ip8nh9GBA874jBgrjSd83LS3ayH25AH-YvZVFbbo';
      const blogId = '58162b1c-ec95-4792-b741-ab9095851187';
      const [post] = await test.factories().createPostsForBlog(AT, blogId, 1);
      console.log(post);
    });
  });

  describe('Unsabscribe', () => {
    it('wqe', async () => {
      const AT =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDNmMDQzYy1mMDhhLTQxODQtOGViMS0yZjNkNjIxM2E0NTkiLCJkZXZpY2VJZCI6ImY0ZTAyY2Q2LTg5ZjEtNDdiYi1iOWY5LTY4MzcyOTk3MTY2ZiIsImlhdCI6MTY4NzEwNjYzMiwiZXhwIjoxMTY4NzEwNjYzMn0.WtDBg-60O7WOGno9_-m3e4ZKetPSEGqmdEIfXfapo9Q';
      const blogId = '58162b1c-ec95-4792-b741-ab9095851187';
      const res = await test.blogs().updateSubscribeStatus(blogId, AT);
      console.log(res);
    });
  });

  describe('Create new post', () => {
    it('it', async () => {
      const AT =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3Mzc4NzMxYS0yYjU4LTQxYWQtOGYyYS0wODliNmI1YzczODMiLCJkZXZpY2VJZCI6ImI4MDk1NDA1LThjNmEtNDhjMy1hYTU3LWFiYjg1NjM2YjQwZSIsImlhdCI6MTY4NzEwNjYzMiwiZXhwIjoxMTY4NzEwNjYzMn0.Nr-ip8nh9GBA874jBgrjSd83LS3ayH25AH-YvZVFbbo';
      const blogId = '58162b1c-ec95-4792-b741-ab9095851187';
      const [post] = await test.factories().createPostsForBlog(AT, blogId, 1);
      console.log(post);
    });
  });
});
