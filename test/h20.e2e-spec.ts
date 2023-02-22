import { INestApplication } from "@nestjs/common";
import { Blogger } from "./request/blogger";
import { Comments } from "./request/comments";
import { Factories } from "./helper/factories";
import { Posts } from "./request/posts";
import { SA } from "./request/sa";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { EmailManager } from "../src/modules/public/auth/email-transfer/email.manager";
import { EmailManagerMock } from "./mock/emailAdapter.mock";
import { createApp } from "../src/helpers/create-app";
import request from "supertest";
import { Blogs } from "./request/blogs";

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(5 * 60 * second);

  let app: INestApplication;
  let server;
  let blogger: Blogger
  let comments: Comments;
  let factories: Factories;
  let posts: Posts;
  let sa: SA;
  let blogs: Blogs;

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
    blogger = new Blogger(server)
    blogs = new Blogs(server)
    comments = new Comments(server);
    factories = new Factories(server);
    posts = new Posts(server);
    sa = new SA(server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST -> "/blogger/blogs": should create new blog; status 201;' +
    'content: created blog by blogger; used additional methods:' +
    'GET -> /blogs/:id;', () => {

    it('Drop all data.', async () => {
      await request(server).delete('/testing/all-data').expect(204);
    });

    it('Create mistake', async () => {
      const [user] = await factories.createAndLoginUsers(1);
      const [blog] = await factories.createBlogs(
        user.accessToken,
        1,
      );

      const response = await blogs.getBlogById(blog.id)
      expect(response.status).toBe(200)
      expect(response.body).toStrictEqual(blog)
    })
  })

  describe('GET -> "GET => blogger/blogs/comments": should return status 200;' +
    'content: all comments for all posts inside all current user blogs with pagination;' +
    'used additional methods: POST -> /sa/users, POST => /auth/login, POST => /blogger/blogs,' +
    'POST => /blogger/blogs/:blogId/posts, POST => /posts/:postId/comments;', () => {

    it('Drop all data.', async () => {
      await request(server).delete('/testing/all-data').expect(204);
    });

    it('', async () => {
      const [commentOwner, user1, user2] = await factories.createAndLoginUsers(3);
      const [blog1, blog2] = await factories.createBlogs(commentOwner.accessToken, 2);
      const [post1] = await factories.createPostsForBlog(
        commentOwner.accessToken,
        blog1.id,
        1,
      );
      const [post2] = await factories.createPostsForBlog(
        commentOwner.accessToken,
        blog2.id,
        1,
      );
      const [comment1] = await factories.createComments(
        user1.accessToken,
        post1.id,
        1,
      );
      const [comment2] = await factories.createComments(
        user2.accessToken,
        post2.id,
        1,
      );
      const [comment3] = await factories.createComments(
        user1.accessToken,
        post1.id,
        1,
      );
      const [comment4] = await factories.createComments(
        user2.accessToken,
        post2.id,
        1,
      );

      const getCommentsByBlogger = await blogger.getComments(commentOwner.accessToken)
      expect(getCommentsByBlogger.status).toBe(200)
      console.log(getCommentsByBlogger.body.items);
    })
  })

  describe('GET -> "/posts": should return status 200; content: posts array with' +
    'pagination; used additional methods: POST -> /blogger/blogs,' +
    'POST => /blogger/blogs/:blogId/posts;', () => {

    it('Drop all data.', async () => {
      await request(server).delete('/testing/all-data').expect(204);
    });

    it('Create mistake', async () => {
      const [owner] = await factories.createAndLoginUsers(1);
      const [blog] = await factories.createBlogs(owner.accessToken, 1);
      const [post] = await factories.createPostsForBlog(
        owner.accessToken,
        blog.id,
        12,
      );

      const response = await request(server)
        .get(`/posts?pageSize=9&pageNumber=1&sortBy=blogName&sortDirection=asc`)
        .expect(200)

      console.log(response.body)
      // Errors messages: "sortBy must be a valid enum value",
    })
  })
})