import { HttpStatus, INestApplication } from '@nestjs/common';
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
import { Testing } from './request/testing';
import { ImageStatus } from './images/image-status.enum';
import { getErrorMessage } from './helper/helpers';
import {join} from "path";
import {settings} from "../src/settings";
import {ImageType} from "../src/modules/blogger/imageType";
import {images} from "./images/images";

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(10 * second);

  let app: INestApplication;
  let server;
  let blogger: Blogger;
  let comments: Comments;
  let factories: Factories;
  let posts: Posts;
  let sa: SA;
  let blogs: Blogs;
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
    blogger = new Blogger(server);
    blogs = new Blogs(server);
    comments = new Comments(server);
    factories = new Factories(server);
    posts = new Posts(server);
    sa = new SA(server);
    testing = new Testing(server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe.skip('Upload background wallpaper', () => {
    it('Clear data base', async () => {
      await testing.clearDb();
    });

    it('Create testing date', async () => {
      const users = await factories.createAndLoginUsers(2);
      const fistUserBlog = await blogger.createBlog(users[0].accessToken);
      const secondUserBlog = await blogger.createBlog(users[1].accessToken);
      // console.log('accessToken:', users[0].accessToken);
      // console.log('fistUserBlogId:', fistUserBlog.body.id);
      expect.setState({
        accessToken: users[0].accessToken,
        userId: users[0].user.id,
        fistUserBlogId: fistUserBlog.body.id,
        secondUserBlogId: secondUserBlog.body.id,
      });
    });

    it(`Status: ${HttpStatus.FORBIDDEN}.
         If user try to update blog that doesn't belong to current user.`, async () => {
      const { accessToken, secondUserBlogId } = expect.getState();

      const result = await blogger.uploadBackgroundWallpaper(
        secondUserBlogId,
        ImageStatus.Valid,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.FORBIDDEN);
    });

    it(`Status: ${HttpStatus.UNAUTHORIZED}.
         If user try to update without credentials.`, async () => {
      const { fistUserBlogId, accessToken } = expect.getState();
      const result = await blogger.uploadBackgroundWallpaper(
        fistUserBlogId,
        ImageStatus.Valid,
      );
      expect(result.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    const errorsMessages = getErrorMessage(['width', 'height']);
    it(`Status: ${HttpStatus.BAD_REQUEST}.
         Try send big image.`, async () => {
      const { fistUserBlogId, accessToken } = expect.getState();
      const result = await blogger.uploadBackgroundWallpaper(
        fistUserBlogId,
        ImageStatus.Big,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body).toStrictEqual({ errorsMessages });
    });

    it(`Status: ${HttpStatus.BAD_REQUEST}.
         Try send small image.`, async () => {
      const { fistUserBlogId, accessToken } = expect.getState();
      const result = await blogger.uploadBackgroundWallpaper(
        fistUserBlogId,
        ImageStatus.Small,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body).toStrictEqual({ errorsMessages });
    });

    it(`Status: ${HttpStatus.CREATED}.
         Save new wallpaper in cloud.`, async () => {
      const { userId, fistUserBlogId, accessToken } = expect.getState();
      const expectUrl = join(settings.s3.baseUrl, settings.s3.bucketsName, 'content', 'users', userId, fistUserBlogId, ImageType.Wallpaper, images.blog.wallpaper.valid)
      const result = await blogger.uploadBackgroundWallpaper(
        fistUserBlogId,
        ImageStatus.Valid,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        wallpaper: {
          url: expectUrl,
          width: 1028,
          height: 312,
          fileSize: 6321
        },
        main: []
      })
    });

    it(`Status: ${HttpStatus.CREATED}.
         Update wallpaper.`, async () => {
      const { userId, fistUserBlogId, accessToken } = expect.getState();
      const expectUrl = join(settings.s3.baseUrl, settings.s3.bucketsName, 'content', 'users', userId, fistUserBlogId, ImageType.Wallpaper, images.blog.wallpaper.copy)

      const result = await blogger.uploadBackgroundWallpaper(
          fistUserBlogId,
          ImageStatus.Copy,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        wallpaper: {
          url: expectUrl,
          width: 1028,
          height: 312,
          fileSize: 6321
        },
        main: []
      })
    });
  });

  describe.skip('Upload main square image for blog', () => {
    it('Clear data base', async () => {
      await testing.clearDb();
    });

    it('Create testing date', async () => {
      const users = await factories.createAndLoginUsers(2);
      const fistUserBlog = await blogger.createBlog(users[0].accessToken);
      const secondUserBlog = await blogger.createBlog(users[1].accessToken);

      expect.setState({
        accessToken: users[0].accessToken,
        userId: users[0].user.id,
        fistUserBlogId: fistUserBlog.body.id,
        secondUserBlogId: secondUserBlog.body.id,
      });
    });

    it(`Status: ${HttpStatus.FORBIDDEN}.
         If user try to update blog that doesn't belong to current user.`, async () => {
      const { accessToken, secondUserBlogId } = expect.getState();

      const result = await blogger.uploadMainImageForBlog(
          secondUserBlogId,
          ImageStatus.Valid,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.FORBIDDEN);
    });

    it(`Status: ${HttpStatus.UNAUTHORIZED}.
         If user try to update without credentials.`, async () => {
      const { fistUserBlogId, accessToken } = expect.getState();
      const result = await blogger.uploadMainImageForBlog(
          fistUserBlogId,
          ImageStatus.Valid,
      );
      expect(result.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    const errorsMessages = getErrorMessage(['width', 'height']);
    it(`Status: ${HttpStatus.BAD_REQUEST}.
         Try send big image.`, async () => {
      const { fistUserBlogId, accessToken } = expect.getState();
      const result = await blogger.uploadMainImageForBlog(
          fistUserBlogId,
          ImageStatus.Big,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body).toStrictEqual({ errorsMessages });
    });

    it(`Status: ${HttpStatus.BAD_REQUEST}.
         Try send small image.`, async () => {
      const { fistUserBlogId, accessToken } = expect.getState();
      const result = await blogger.uploadMainImageForBlog(
          fistUserBlogId,
          ImageStatus.Small,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body).toStrictEqual({ errorsMessages });
    });

    it(`Status: ${HttpStatus.CREATED}.
         Save new wallpaper in cloud.`, async () => {
      const { userId, fistUserBlogId, accessToken } = expect.getState();
      const expectUrl = join(settings.s3.baseUrl, settings.s3.bucketsName, 'content', 'users', userId, fistUserBlogId, ImageType.Main, images.blog.main.valid)
      const result = await blogger.uploadMainImageForBlog(
          fistUserBlogId,
          ImageStatus.Valid,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        wallpaper: null,
        main: [{
          url: expectUrl,
          width: 156,
          height: 156,
          fileSize: 774
        }]
      })
    });
  });

  describe('Upload main image for post', () => {
    it('Clear data base', async () => {
      await testing.clearDb();
    });

    it('Create testing date', async () => {
      const users = await factories.createAndLoginUsers(2);
      const fistUserBlog = await blogger.createBlog(users[0].accessToken);
      const secondUserBlog = await blogger.createBlog(users[1].accessToken);
      const [post] = await factories.createPostsForBlog(fistUserBlog.body.accessToken, fistUserBlog.body.id, 1)

      expect.setState({
        accessToken: users[0].accessToken,
        userId: users[0].user.id,
        fistUserBlogId: fistUserBlog.body.id,
        secondUserBlogId: secondUserBlog.body.id,
        postId: post.id
      });
    });

    it(`Status: ${HttpStatus.FORBIDDEN}.
         If user try to update post main image that doesn't belong to current user.`, async () => {
      const { accessToken, secondUserBlogId, postId } = expect.getState();

      const result = await blogger.uploadMainImageForPost(
          secondUserBlogId,
          postId,
          ImageStatus.Valid,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.FORBIDDEN);
    });

    it(`Status: ${HttpStatus.UNAUTHORIZED}.
         If user try to update without credentials.`, async () => {
      const { fistUserBlogId, postId } = expect.getState();
      const result = await blogger.uploadMainImageForPost(
          fistUserBlogId,
          postId,
          ImageStatus.Valid,
      );
      expect(result.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    const errorsMessages = getErrorMessage(['width', 'height']);
    it(`Status: ${HttpStatus.BAD_REQUEST}.
         Try send big image.`, async () => {
      const { fistUserBlogId, accessToken, postId } = expect.getState();
      const result = await blogger.uploadMainImageForPost(
          fistUserBlogId,
          postId,
          ImageStatus.Big,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body).toStrictEqual({ errorsMessages });
    });

    it(`Status: ${HttpStatus.BAD_REQUEST}.
         Try send small image.`, async () => {
      const { fistUserBlogId, accessToken } = expect.getState();
      const result = await blogger.uploadMainImageForBlog(
          fistUserBlogId,
          ImageStatus.Small,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body).toStrictEqual({ errorsMessages });
    });

    it(`Status: ${HttpStatus.CREATED}.
         Save new wallpaper in cloud.`, async () => {
      const { userId, fistUserBlogId, accessToken, postId } = expect.getState();
      const expectUrl = join(settings.s3.baseUrl, settings.s3.bucketsName, 'content', 'users', userId, fistUserBlogId, ImageType.Main, images.blog.main.valid)
      const result = await blogger.uploadMainImageForPost(
          fistUserBlogId,
          postId,
          ImageStatus.Valid,
          accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        wallpaper: null,
        main: [{
          url: expectUrl,
          width: 156,
          height: 156,
          fileSize: 774
        }]
      })
    });
  });
});
