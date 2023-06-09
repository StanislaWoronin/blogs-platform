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
import { settings } from '../src/settings';
import { ImageType } from '../src/modules/blogger/imageType';
import { images } from './images/images';
import request from 'supertest';
import { preparedBlog } from './helper/prepeared-data';
import { randomUUID } from 'crypto';

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(5 * second);

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
    factories = new Factories(server, blogger);
    posts = new Posts(server);
    sa = new SA(server);
    testing = new Testing(server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Upload background wallpaper', () => {
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
      const url = `${settings.s3.baseUrl}/${settings.s3.bucketsName}/content/users/${userId}/${fistUserBlogId}/${ImageType.Wallpaper}`;
      const expectUrl = `${url}/${images.blog.wallpaper.valid}`;
      // const expectUrl = join(
      //   settings.s3.baseUrl,
      //   settings.s3.bucketsName,
      //   'content',
      //   'users',
      //   userId,
      //   fistUserBlogId,
      //   ImageType.Wallpaper,
      //   images.blog.wallpaper.valid,
      // ); // "join" should be used to glue file paths, not links
      const result = await blogger.uploadBackgroundWallpaper(
        fistUserBlogId,
        ImageStatus.Valid,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        wallpaper: {
          url: expectUrl,
          width: settings.images.wallpaper.width,
          height: settings.images.wallpaper.height,
          fileSize: expect.any(Number),
        },
        main: [],
      });

      expect.setState({ url });
    });

    it(`Status: ${HttpStatus.CREATED}.
         Update wallpaper.`, async () => {
      const { fistUserBlogId, accessToken, url } = expect.getState();
      const expectUrl = `${url}/${images.blog.wallpaper.copy}`;

      const result = await blogger.uploadBackgroundWallpaper(
        fistUserBlogId,
        ImageStatus.Copy,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        wallpaper: {
          url: expectUrl,
          width: settings.images.wallpaper.width,
          height: settings.images.wallpaper.height,
          fileSize: expect.any(Number),
        },
        main: [],
      });
    });
  });

  describe('Upload main square image for blog', () => {
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
      const { fistUserBlogId } = expect.getState();
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
      const url = `${settings.s3.baseUrl}/${settings.s3.bucketsName}/content/users/${userId}/${fistUserBlogId}/${ImageType.Main}`;
      const expectUrl = `${url}/${images.blog.main.valid}`;

      const result = await blogger.uploadMainImageForBlog(
        fistUserBlogId,
        ImageStatus.Valid,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        wallpaper: null,
        main: [
          {
            url: expect.any(String),
            width: settings.images.main.blog.width,
            height: settings.images.main.blog.height,
            fileSize: expect.any(Number),
          },
        ],
      });

      const _url = result.body.main[0].url;
      const __url = _url.split('-');
      __url.pop();
      const receivedUrl = __url.join('-');
      expect(receivedUrl).toBe(expectUrl);
    });
  });

  describe('Upload main image for post', () => {
    it('Clear data base', async () => {
      await testing.clearDb();
    });

    it('Create testing date', async () => {
      const [firstUser, secondUser] = await factories.createAndLoginUsers(2);
      const fistUserBlog = await blogger.createBlog(firstUser.accessToken);
      const secondUserBlog = await blogger.createBlog(secondUser.accessToken);
      const [post] = await factories.createPostsForBlog(
        firstUser.accessToken,
        fistUserBlog.body.id,
        1,
      );

      expect.setState({
        accessToken: firstUser.accessToken,
        userId: firstUser.user.id,
        fistUserBlogId: fistUserBlog.body.id,
        secondUserBlogId: secondUserBlog.body.id,
        postId: post.id,
      });
    });

    it(`Status: ${HttpStatus.NOT_FOUND}.
         If user try to update post main image that doesn't belong to current user.`, async () => {
      const { accessToken, postId, fistUserBlogId } = expect.getState();

      // const randomBlogId = randomUUID();
      // const notExistBlog = await blogger.uploadMainImageForPost(
      //   randomBlogId,
      //   postId,
      //   ImageStatus.Valid,
      //   accessToken,
      // );
      // expect(notExistBlog.status).toBe(HttpStatus.NOT_FOUND);

      const randomPostId = randomUUID();
      const notExistPost = await blogger.uploadMainImageForPost(
        fistUserBlogId,
        randomPostId,
        ImageStatus.Valid,
        accessToken,
      );
      expect(notExistPost.status).toBe(HttpStatus.NOT_FOUND);
    });

    it.skip(`Status: ${HttpStatus.FORBIDDEN}.
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

    it.skip(`Status: ${HttpStatus.UNAUTHORIZED}.
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
    it.skip(`Status: ${HttpStatus.BAD_REQUEST}.
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

    it.skip(`Status: ${HttpStatus.BAD_REQUEST}.
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

    it.skip(`Status: ${HttpStatus.CREATED}.
         Save main image in cloud.`, async () => {
      const { userId, fistUserBlogId, accessToken, postId } = expect.getState();
      const url = `${settings.s3.baseUrl}/${settings.s3.bucketsName}/content/users/${userId}/${fistUserBlogId}/${postId}/${ImageType.Main}`;

      const result = await blogger.uploadMainImageForPost(
        fistUserBlogId,
        postId,
        ImageStatus.Valid,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      console.dir(result.body, { depth: null });
      console.dir(
        {
          main: [
            {
              url: `${url}/original`,
              width: settings.images.main.post.original.width,
              height: settings.images.main.post.original.height,
              fileSize: expect.any(Number),
            },
            {
              url: `${url}/middle`,
              width: settings.images.main.post.middle.width,
              height: settings.images.main.post.middle.height,
              fileSize: expect.any(Number),
            },
            {
              url: `${url}/small`,
              width: settings.images.main.post.small.width,
              height: settings.images.main.post.small.height,
              fileSize: expect.any(Number),
            },
          ],
        },
        { depth: null },
      );
      expect(result.body).toStrictEqual({
        main: [
          {
            url: `${url}/original`,
            width: settings.images.main.post.original.width,
            height: settings.images.main.post.original.height,
            fileSize: expect.any(Number),
          },
          {
            url: `${url}/middle`,
            width: settings.images.main.post.middle.width,
            height: settings.images.main.post.middle.height,
            fileSize: expect.any(Number),
          },
          {
            url: `${url}/small`,
            width: settings.images.main.post.small.width,
            height: settings.images.main.post.small.height,
            fileSize: expect.any(Number),
          },
        ],
      });

      expect.setState({ url });
    });

    it.skip(`Status: ${HttpStatus.CREATED}.
         Save new main image in cloud.`, async () => {
      const { userId, fistUserBlogId, accessToken, postId, url } =
        expect.getState();

      const result = await blogger.uploadMainImageForPost(
        fistUserBlogId,
        postId,
        ImageStatus.Copy,
        accessToken,
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.body).toStrictEqual({
        main: [
          {
            url: `${url}/original`,
            width: settings.images.main.post.original.width,
            height: settings.images.main.post.original.height,
            fileSize: expect.any(Number),
          },
          {
            url: `${url}/middle`,
            width: settings.images.main.post.middle.width,
            height: settings.images.main.post.middle.height,
            fileSize: expect.any(Number),
          },
          {
            url: `${url}/small`,
            width: settings.images.main.post.small.width,
            height: settings.images.main.post.small.height,
            fileSize: expect.any(Number),
          },
        ],
      });
    });
  });

  describe('Create blog and post', () => {
    it('Clear data base', async () => {
      await testing.clearDb();
    });

    it('Created blog and return with image info', async () => {
      const [user] = await factories.createAndLoginUsers(1);
      const blog = await blogger.createBlog(user.accessToken);
      expect(blog.status).toBe(HttpStatus.CREATED);
      expect(blog.body).toStrictEqual({
        id: blog.body.id,
        name: blog.body.name,
        description: blog.body.description,
        websiteUrl: blog.body.websiteUrl,
        createdAt: blog.body.createdAt,
        isMembership: blog.body.isMembership,
        images: {
          wallpaper: null,
          main: [],
        },
      });

      expect.setState({ accessToken: user.accessToken, blogId: blog.body.id });
    });

    it('Created post and return with image info', async () => {
      const { accessToken, blogId } = expect.getState();

      const [post] = await factories.createPostsForBlog(accessToken, blogId, 1);
      expect(post).toStrictEqual({
        id: expect.any(String),
        title: 'title0',
        shortDescription: 'shortDescription0',
        content: 'content0',
        blogId: blogId,
        blogName: preparedBlog.valid.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
        images: {
          main: [],
        },
      });
    });
  });

  describe('Return blogs and posts with images info', () => {
    it('Clear data base', async () => {
      await testing.clearDb();
    });

    it('Create data', async () => {
      const [user] = await factories.createAndLoginUsers(1);
      const blog = await blogger.createBlog(user.accessToken);
      const [post] = await factories.createPostsForBlog(
        user.accessToken,
        blog.body.id,
        1,
      );
      const blogBackgroundWallpaper = await blogger.uploadBackgroundWallpaper(
        blog.body.id,
        ImageStatus.Valid,
        user.accessToken,
      );
      const blogMainImages = await blogger.uploadMainImageForBlog(
        blog.body.id,
        ImageStatus.Valid,
        user.accessToken,
      );
      const postMainImages = await blogger.uploadMainImageForPost(
        blog.body.id,
        post.id,
        ImageStatus.Valid,
        user.accessToken,
      );

      expect.setState({
        user,
        blog,
        post,
        blogBackgroundWallpaper,
        blogMainImages,
        postMainImages,
      });
    });

    it('Get blogs by blogger', async () => {
      const { user, blog, blogMainImages } = expect.getState();

      const result = await request(server)
        .get('/blogger/blogs')
        .auth(user.accessToken, { type: 'bearer' });
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.body).toStrictEqual({
        page: 1,
        pageSize: 10,
        pagesCount: 1,
        totalCount: 1,
        items: [
          {
            id: blog.body.id,
            name: blog.body.name,
            description: blog.body.description,
            websiteUrl: blog.body.websiteUrl,
            createdAt: blog.body.createdAt,
            isMembership: blog.body.isMembership,
            images: blogMainImages.body,
          },
        ],
      });
      expect.setState({ expectedBlog: result.body });
    });

    it('Get blogs by simple user', async () => {
      const { expectedBlog } = expect.getState();
      const result = await request(server).get('/blogs');
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.body).toStrictEqual(expectedBlog);
    });

    it('Get blog via id by simple user', async () => {
      const { expectedBlog } = expect.getState();
      const result = await request(server).get(
        `/blogs/${expectedBlog.items[0].id}`,
      );
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.body).toStrictEqual(expectedBlog.items[0]);
      // const imageUrl = result.body.images.wallpaper.url;
      // console.log(result.body.images.wallpaper.url);
      // expect(imageUrl).toBeDefined();
      // expect(imageUrl).toStrictEqual(expect.any(String));
      // const file = createWriteStream('file.png');
      // const test = https.get(imageUrl, (res) => {
      //   res.pipe(file);
      //   file.on('finish', () => {
      //     file.close();
      //
      //     console.log('download ok');
      //   });
      // });
      // console.log(test);
      // expect(test).toBeDefined();
      // expect(test.status).toBe(200)
    });

    it('Get posts via blogId by simple user', async () => {
      const { expectedBlog, postMainImages } = expect.getState();
      const result = await request(server).get(
        `/blogs/${expectedBlog.items[0].id}/posts`,
      );
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [
          {
            id: expect.any(String),
            title: 'title0',
            shortDescription: 'shortDescription0',
            content: 'content0',
            blogId: expectedBlog.items[0].id,
            blogName: preparedBlog.valid.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
              likesCount: 0,
              dislikesCount: 0,
              myStatus: 'None',
              newestLikes: [],
            },
            images: postMainImages.body,
          },
        ],
      });
    });

    it('Get posts by simple user', async () => {
      const { expectedBlog, postMainImages } = expect.getState();
      const result = await request(server).get(`/posts`);
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [
          {
            id: expect.any(String),
            title: 'title0',
            shortDescription: 'shortDescription0',
            content: 'content0',
            blogId: expectedBlog.items[0].id,
            blogName: preparedBlog.valid.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
              likesCount: 0,
              dislikesCount: 0,
              myStatus: 'None',
              newestLikes: [],
            },
            images: postMainImages.body,
          },
        ],
      });
    });

    it('Get posts via id by simple user', async () => {
      const { post, expectedBlog, postMainImages } = expect.getState();
      const result = await request(server).get(`/posts/${post.id}`);
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.body).toStrictEqual({
        id: expect.any(String),
        title: 'title0',
        shortDescription: 'shortDescription0',
        content: 'content0',
        blogId: expectedBlog.items[0].id,
        blogName: preparedBlog.valid.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
        images: postMainImages.body,
      });
    });
  });

  describe('Try send text format fail', () => {
    it('Clear data base', async () => {
      await testing.clearDb();
    });

    it('Send text format fail.', async () => {
      const [user] = await factories.createAndLoginUsers(1);
      const blog = await blogger.createBlog(user.accessToken);

      const response = await blogger.uploadBackgroundWallpaper(
        blog.body.id,
        ImageStatus.Txt,
        user.accessToken,
      );
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe(
    'Create five blogs and add. Add wallpaper and main images ' +
      'for each blog. Get blogs. Should return blog list with added images.' +
      'Status 200',
    () => {
      it('Clear data base', async () => {
        await testing.clearDb();
      });

      it('Crate data and get blog.', async () => {
        const [user] = await factories.createAndLoginUsers(1);
        const expectItems = await factories.createBlogsAndSendImages(
          user.accessToken,
          5,
        );

        const response = await request(server).get('/blogs');
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.items).toStrictEqual(expectItems);
      });
    },
  );
});
