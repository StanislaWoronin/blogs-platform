import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { EmailManager } from "../src/modules/public/auth/email-transfer/email.manager";
import { EmailManagerMock } from "./mock/emailAdapter.mock";
import { createApp } from "../src/helpers/create-app";
import request from "supertest";
import { preparedBlog, preparedPost, preparedUser, superUser } from "./helper/prepeared-data";
import { Factories } from "./helper/factories";
import { faker } from "@faker-js/faker";
import { getErrorMessage } from "./helper/helpers";
import {bannedUser, blogsForCurrentUser, createdBlog} from "./helper/exect-blogger.model";
import { randomUUID } from "crypto";
import {
  endpoints,
  getUrlForBanned,
  getUrlForEndpointPostByBlogger,
  getUrlPostForSpecificBlog,
  getUrlWithId
} from "./helper/routing";

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(30 * second);

  let app: INestApplication;
  let server;
  let factories: Factories;

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
    factories = new Factories(server)
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Blogger router testing', () => {
    it('Drop all data.', async () => {
      await request(server)
        .delete(endpoints.testingController.allData)
        .expect(204)
    })

    it('Create blogger', async () => {
      const user = await request(server)
          .post(endpoints.sa.users)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .send({
            login: `blogger`,
            email: `somemail@email.com`,
            password: `password`
          });

      const token = await request(server)
          .post(endpoints.authController.login)
          .set('User-Agent', faker.internet.userAgent())
          .send({
            loginOrEmail: 'blogger',
            password: `password`
          });

      expect.setState({
        user: user.body,
        accessToken: token.body.accessToken,
        refreshToken: token.headers['set-cookie'][0].split(';')[0].split('=')[1]
      })
    })

    it('Create blog', async () => {
      const { accessToken } = expect.getState()

      const response = await request(server)
        .post(endpoints.bloggerController.blogs)
        .send(preparedBlog.valid)
        .auth(accessToken, {type: 'bearer'})
        .expect(201)

      expect.setState({blog: response.body})
    })

    it('Create users', async () => {
      const [user0, user1, user2, user3, user4] = await factories.createAndLoginUsers(5)

      expect.setState({ user0: user0.user, user1: user1.user, user2: user2.user, user3: user3.user, user4: user4.user, accessToken2: user0.accessToken })
    })

    it('Create blog2', async () => {
      const {accessToken2} = expect.getState()

      const blog = await request(server)
        .post(endpoints.bloggerController.blogs)
        .send(preparedBlog.valid)
        .auth(accessToken2, {type: 'bearer'})
        .expect(201)

      expect.setState({
        blog2: blog.body
      })
    })

    describe('blogger/users', () => {
      describe('Ban users', () => {
        it('Try ban without authorization', async () => {
          const { user1, blog } = expect.getState()
          const url = getUrlForBanned(endpoints.bloggerController.users[""], user1.id)

          await request(server)
            .put(url)
            .send({
              isBanned: true,
              banReason: faker.lorem.paragraph(20),
              blogId: blog.id
            })
            .expect(401)
        })

        it('Shouldn`t ban if the inputModel has incorrect values', async () => {
          const { accessToken, blog, user1 } = expect.getState()
          const errorsMessages = getErrorMessage(['banReason', 'isBanned'])
          const url = getUrlForBanned(endpoints.bloggerController.users[""], user1.id)

          const response = await request(server)
            .put(url)
            .send({
              isBanned: 'true',
              banReason: faker.lorem.word(19),
              blogId: blog.id
            })
            .auth(accessToken, {type: 'bearer'})
            .expect(400)

          expect(response.body).toEqual({ errorsMessages })
        })

        it('Should ban three users', async () => {
          const { accessToken, blog, user0, user2, user4 } = expect.getState()
          const url1 = getUrlForBanned(endpoints.bloggerController.users[""], user0.id)
          const url2 = getUrlForBanned(endpoints.bloggerController.users[""], user2.id)
          const url3 = getUrlForBanned(endpoints.bloggerController.users[""], user4.id)

          await request(server)
            .put(url1)
            .send({
              isBanned: true,
              banReason: faker.lorem.words(5),
              blogId: blog.id
            })
            .auth(accessToken, {type: 'bearer'})
            .expect(204)

          await request(server)
            .put(url2)
            .send({
              isBanned: true,
              banReason: faker.lorem.words(5),
              blogId: blog.id
            })
            .auth(accessToken, {type: 'bearer'})
            .expect(204)

          await request(server)
            .put(url3)
            .send({
              isBanned: true,
              banReason: faker.lorem.words(5),
              blogId: blog.id
            })
            .auth(accessToken, {type: 'bearer'})
            .expect(204)

          const response = await request(server)
            .get(`${endpoints.bloggerController.users.blogs}/${blog.id}`)
            .auth(accessToken, {type: 'bearer'})
            .expect(200)

          expect(response.body.items).toHaveLength(3)
        })
      })

      describe('Return all banned users for blog', () => {
        it('Try get users without authorized', async () => {
          const { blog } = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.users.blogs, blog.id)

          await request(server)
            .get(url)
            .expect(401)
        })

        it('Get user via search login term', async () => {
          const { accessToken, blog, user0 } = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.users.blogs, blog.id)

          const response = await request(server)
              .get(`${url}?searchLoginTerm=0`)
              .auth(accessToken, {type: 'bearer'})
              .expect(200)

          expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [bannedUser(user0)]
          })
        })

        it('Get users with query parameters', async () => {
          const { accessToken, blog, user0, user2 } = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.users.blogs, blog.id)

          const response1 = await request(server)
              .get(`${url}?sortBy=login&sortDirection=asc&pageNumber=1&pageSize=2`)
              .auth(accessToken, {type: 'bearer'})
              .expect(200)

          expect(response1.body).toEqual({
            pagesCount: 2,
            page: 1,
            pageSize: 2,
            totalCount: 3,
            items: [
              bannedUser(user0),
              bannedUser(user2)
            ]
          })

          const response2 = await request(server)
              .get(`${url}?sortBy=login&sortDirection=desc&pageNumber=2&pageSize=2`)
              .auth(accessToken, {type: 'bearer'})
              .expect(200)

          expect(response2.body).toEqual({
            pagesCount: 2,
            page: 2,
            pageSize: 2,
            totalCount: 3,
            items: [
              bannedUser(user0)
            ]
          })
        })
      })

      describe('Unban users', () => {
        it('Unban user', async () => {
          const { accessToken, blog, user0 } = expect.getState()
          const url = getUrlForBanned(endpoints.bloggerController.users[""], user0.id)

          await request(server)
              .put(url)
              .send({
                isBanned: false,
                banReason: 'faker.lorem.words(5)',
                blogId: blog.id
              })
              .auth(accessToken, {type: 'bearer'})
              .expect(204)

          const response = await request(server)
              .get(`${endpoints.sa.users}?searchLoginTerm=0`)
              .auth(superUser.valid.login, superUser.valid.password, {type: "basic"})
              .expect(200)

          expect(response.body.items[0]).toEqual(user0)
        })
      })
    })

    describe('blogger/blogs', () => {
      describe('Return all comments for all post current user`s blog', () => {
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204)
        })

        it('Create data', async () => {
          const user1 = await request(server)
            .post(endpoints.sa.users)
            .send(preparedUser.valid1)
            .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
            .expect(201)

          const token1 = await request(server)
            .post(endpoints.authController.login)
            .send(preparedUser.login1)
            .set('User-Agent', faker.internet.userAgent())
            .expect(200)

          const blog1 = await request(server)
            .post(endpoints.bloggerController.blogs)
            .send(preparedBlog.valid)
            .auth(token1.body.accessToken, {type: 'bearer'})
            .expect(201)

          const [post0, post1, post2] = await factories.createPostsForBlog(token1.body.accessToken, blog1.body.id, 3)

          const user2 = await request(server)
            .post(endpoints.sa.users)
            .send(preparedUser.valid2)
            .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
            .expect(201)

          const token2 = await request(server)
            .post(endpoints.authController.login)
            .send(preparedUser.login2)
            .set('User-Agent', faker.internet.userAgent())
            .expect(200)

          const blog2 = await request(server)
            .post(endpoints.bloggerController.blogs)
            .send(preparedBlog.valid)
            .auth(token1.body.accessToken, {type: 'bearer'})
            .expect(201)

          const [post3] = await factories.createPostsForBlog(token2.body.accessToken, blog2.body.id, 1)
        })
      })

      describe('Update exist blog by id', () => {
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204)
        })

        it('Create data', async () => {
          const [accessToken1, accessToken2] = await factories.createAndLoginUsers(2)

          const blog1 = await factories.createBlogs(accessToken1.accessToken, 1)
          const blog2 = await factories.createBlogs(accessToken2.accessToken, 1)

          expect.setState({
            accessToken1: accessToken1.accessToken,
            accessToken2: accessToken2.accessToken,
            blog1: blog1[0],
            blog2: blog2[0]
          })
        })

        it('Try update blog that doesn`t belong to current user', async () => {
          const { accessToken1, blog2 } = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.blogs, blog2.id)

          await request(server)
            .put(url)
            .send(preparedBlog.newValid)
            .auth(accessToken1, {type: 'bearer'})
            .expect(403)
        })

        it('Try update blog without authorization', async () => {
          const { blog1 } = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.blogs, blog1.id)

          await request(server)
            .put(url)
            .send(preparedBlog.newValid)
            .expect(401)
        })

        it('Try update blog with incorrect input data', async () => {
          const { accessToken1, blog1 } = expect.getState()
          const errorsMessages = getErrorMessage(['name', 'description', 'websiteUrl'])
          const url = getUrlWithId(endpoints.bloggerController.blogs, blog1.id)

          const response1 = await request(server)
            .put(url)
            .send(preparedBlog.short)
            .auth(accessToken1, {type: 'bearer'})
            .expect(400)

          const response2 = await request(server)
            .put(url)
            .send(preparedBlog.long)
            .auth(accessToken1, {type: 'bearer'})
            .expect(400)

          expect(response1.body).toEqual({ errorsMessages })
          expect(response2.body).toEqual({ errorsMessages })
        })

        it('Update blog', async () => {
          const { accessToken1, blog1 } = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.blogs, blog1.id)

          await request(server)
            .put(url)
            .send(preparedBlog.newValid)
            .auth(accessToken1, {type: 'bearer'})
            .expect(204)

          const response = await request(server)
            .get(endpoints.bloggerController.blogs)
            .auth(accessToken1, {type: 'bearer'})
            .expect(200)

          expect(response.body.items[0].name).toBe(preparedBlog.newValid.name);
          expect(response.body.items[0].description).toBe(preparedBlog.newValid.description);
          expect(response.body.items[0].websiteUrl).toBe(preparedBlog.newValid.websiteUrl);
        })
      })

      describe('Delete blog by id', () => {
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204)
        })

        it('Create data', async () => {
          const [accessToken1, accessToken2] = await factories.createAndLoginUsers(2)

          const [blog1] = await factories.createBlogs(accessToken1.accessToken, 1)
          const [blog2] = await factories.createBlogs(accessToken2.accessToken, 1)

          expect.setState({
            accessToken: accessToken1.accessToken,
            blogId1: blog1.id,
            blogId2: blog2.id
          })
        })

        it('Try delete blog that doesn`t belong to current user', async () => {
          const {accessToken, blogId2} = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.blogs, blogId2)
          await request(server)
            .delete(url)
            .auth(accessToken, { type: 'bearer' })
            .expect(403)
        })

        it('Try delete blog without authorization', async () => {
          const { blogId1 } = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.blogs, blogId1)

          await request(server)
            .delete(url)
            .expect(401)
        })

        it('Try delete blog that doesn`t belong to current user', async () => {
          const {accessToken, blogId1} = expect.getState()
          const url = getUrlWithId(endpoints.bloggerController.blogs, blogId1)

          await request(server)
            .delete(url)
            .auth(accessToken, { type: 'bearer' })
            .expect(204)

          const response = await request(server)
            .get(endpoints.bloggerController.blogs)
            .auth(accessToken, { type: 'bearer' })
            .expect(200)

          expect(response.body.items).toHaveLength(0)
        })

        it('Blog with this id not found', async () => {
          const {accessToken, blogId1} = expect.getState()
          const randomId = randomUUID()
          const url1 = getUrlWithId(endpoints.bloggerController.blogs, blogId1)
          const url2 = getUrlWithId(endpoints.bloggerController.blogs, randomId)

          await request(server)
            .delete(url1)
            .auth(accessToken, { type: 'bearer' })
            .expect(404)

          await request(server)
            .delete(url2)
            .auth(accessToken, { type: 'bearer' })
            .expect(404)
        })
      })

      describe('Create new blog', () => {
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204)
        })

        it('Create data', async () => {
          const [token] = await factories.createAndLoginUsers(1)

          expect.setState({
            accessToken: token.accessToken
          })
        })

        it('Try create blog without authorization', async () => {
          await request(server)
            .post(endpoints.bloggerController.blogs)
            .send(preparedBlog.valid)
            .expect(401)
        })

        it('Try create blog with incorrect input data', async () => {
          const {accessToken} = expect.getState()
          const errorsMessages = getErrorMessage(['name', 'description', 'websiteUrl'])

          const response1 = await request(server)
            .post(endpoints.bloggerController.blogs)
            .send(preparedBlog.long)
            .auth(accessToken, {type: 'bearer'})
            .expect(400)

          expect(response1.body).toEqual({errorsMessages})

          const response2 = await request(server)
            .post(endpoints.bloggerController.blogs)
            .send(preparedBlog.short)
            .auth(accessToken, {type: 'bearer'})
            .expect(400)

          expect(response2.body).toEqual({errorsMessages})
        })

        it('Should create new blog', async () => {
          const {accessToken} = expect.getState()

          const response = await request(server)
            .post(endpoints.bloggerController.blogs)
            .send(preparedBlog.valid)
            .auth(accessToken, {type: 'bearer'})
            .expect(201)

          expect(response.body).toEqual(createdBlog(preparedBlog.valid))
        })
      })

      describe('Return all blogs for current user', () => {
        it('Drop all data.', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204)
        })

        it('Create data', async () => {
          const [token, token2] = await factories.createAndLoginUsers(2)

          const [blog0, blog1, blog2] = await factories.createBlogs(token.accessToken, 3)
          const [blog3] = await factories.createBlogs(token2.accessToken, 1)

          expect.setState({
            accessToken: token.accessToken,
            blog0,
            blog1,
            blog2
          })
        })

        it('Try get blogs without authorization', async () => {
          await request(server)
            .get(endpoints.bloggerController.blogs)
            .expect(401)
        })

        it('Should return blogs with pagination', async () => {
          const {accessToken, blog0, blog1, blog2} = expect.getState()

          const response1 = await request(server)
            .get(endpoints.bloggerController.blogs)
            .auth(accessToken, {type: 'bearer'})
            .expect(200)

          expect(response1.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 3,
            items: [
              blogsForCurrentUser(blog2),
              blogsForCurrentUser(blog1),
              blogsForCurrentUser(blog0),
            ]
          })

          const response2 = await request(server)
            .get(`${endpoints.bloggerController.blogs}?sortBy=name&sortDirection=asc&pageNumber=2&pageSize=2`)
            .auth(accessToken, {type: 'bearer'})
            .expect(200)

          expect(response2.body).toEqual({
            pagesCount: 2,
            page: 2,
            pageSize: 2,
            totalCount: 3,
            items: [blogsForCurrentUser(blog2),]
          })

          const response3 = await request(server)
            .get(`${endpoints.bloggerController.blogs}?sortBy=name&sortDirection=desc&pageNumber=1&pageSize=2`)
            .auth(accessToken, {type: 'bearer'})
            .expect(200)

          expect(response3.body).toEqual({
            pagesCount: 2,
            page: 1,
            pageSize: 2,
            totalCount: 3,
            items: [blogsForCurrentUser(blog2), blogsForCurrentUser(blog1),]
          })
        })

        it('Return blog via search name term', async () => {
          const {accessToken, blog0} = expect.getState()

          const response = await request(server)
            .get(`${endpoints.bloggerController.blogs}?searchNameTerm=0`)
            .auth(accessToken, {type: 'bearer'})
            .expect(200)

          expect(response.body.items[0]).toEqual(blogsForCurrentUser(blog0),)
        })
      })

      describe('Create new post for specific blog', () => {
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204)
        })

        it('Create data', async () => {
          const [token1, token2] = await factories.createAndLoginUsers(2)

          const [blog1] = await factories.createBlogs(token1.accessToken, 1)
          const [blog2] = await factories.createBlogs(token2.accessToken, 1)

          expect.setState({
            accessToken: token1.accessToken,
            blog: blog1,
            blogId1: blog1.id,
            blogId2: blog2.id
          })
        })

        it('Shouldn`t create post if specific blog doesn`t exists', async () => {
          const {accessToken} = expect.getState()
          const randomId = randomUUID()
          const url = getUrlForEndpointPostByBlogger(endpoints.bloggerController.blogs, randomId)

          await request(server)
            .post(url)
            .send(preparedPost.valid)
            .auth(accessToken, {type: "bearer"})
            .expect(404)
        })

        it('Shouldn`t create post if user try to add post to blog that doesn`t belong to current user', async () => {
          const {accessToken, blogId2} = expect.getState()
          const url = getUrlForEndpointPostByBlogger(endpoints.bloggerController.blogs, blogId2)

          await request(server)
            .post(url)
            .send(preparedPost.valid)
            .auth(accessToken, {type: "bearer"})
            .expect(403)
        })

        it('Try create post without authorization', async () => {
          const {blogId1} = expect.getState()
          const url = getUrlForEndpointPostByBlogger(endpoints.bloggerController.blogs, blogId1)

          await request(server)
            .post(url)
            .send(preparedPost.valid)
            .expect(401)
        })

        it('Try create post with incorrect input data', async () => {
          const {accessToken, blogId1} = expect.getState()
          const errorsMessages = getErrorMessage(['title', 'shortDescription', 'content'])
          const url = getUrlForEndpointPostByBlogger(endpoints.bloggerController.blogs, blogId1)

          const response = await request(server)
            .post(url)
            .send(preparedPost.long)
            .auth(accessToken, {type: "bearer"})
            .expect(400)

          expect(response.body).toEqual({ errorsMessages })
        })

        it('Should create post', async () => {
          const {accessToken, blog, post} = expect.getState()
          const url = getUrlForEndpointPostByBlogger(endpoints.bloggerController.blogs, blog.id)

          const response = await request(server)
            .post(url)
            .send(preparedPost.valid)
            .auth(accessToken, {type: "bearer"})
            .expect(201)

          expect(response.body).toEqual({
            id: expect.any(String),
            title: preparedPost.valid.title,
            shortDescription: preparedPost.valid.shortDescription,
            content: preparedPost.valid.content,
            blogId: blog.id,
            blogName: blog.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
              likesCount: 0,
              dislikesCount: 0,
              myStatus: "None",
              newestLikes: []
            }
          })
        })
      })

      describe('Update exist post by id', () => {
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204)
        })

        it('Create data', async () => {
          const [token1, token2] = await factories.createAndLoginUsers(2)

          const [blog1] = await factories.createBlogs(token1.accessToken, 1)
          const [blog2] = await factories.createBlogs(token2.accessToken, 1)

          const [post1] = await factories.createPostsForBlog(token1.accessToken, blog1.id,1)
          const [post2] = await factories.createPostsForBlog(token2.accessToken, blog2.id,1)

          expect.setState({
            accessToken: token1.accessToken,
            blogId1: blog1.id,
            blogId2: blog2.id,
            postId1: post1.id,
            postId2: post2.id
          })
        })

        it('Try update not existing post', async () => {
          const { accessToken, blogId1 } = expect.getState()
          const randomId = randomUUID()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId1, randomId)

          await request(server)
            .put(url)
            .send(preparedPost.newValid)
            .auth(accessToken, {type: "bearer"})
            .expect(404)
        })

        it('Try to update post that belongs to blog that doesn`t belong to current user', async () => {
          const { accessToken, blogId2, postId1 } = expect.getState()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId2, postId1)

          await request(server)
            .put(url)
            .send(preparedPost.newValid)
            .auth(accessToken, {type: "bearer"})
            .expect(403)
        })

        it('Try to update post without authorization', async () => {
          const { blogId1, postId1 } = expect.getState()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId1, postId1)

          await request(server)
            .put(url)
            .send(preparedPost.newValid)
            .expect(401)
        })

        it('Try to update post that belongs to blog that doesn`t belong to current user', async () => {
          const { accessToken, blogId1, postId1 } = expect.getState()
          const errorsMessages = getErrorMessage(['title', 'shortDescription', 'content'])
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId1, postId1)

          const response = await request(server)
            .put(url)
            .send(preparedPost.long)
            .auth(accessToken, {type: "bearer"})
            .expect(400)

          expect(response.body).toEqual({ errorsMessages })
        })

        it('Should update post', async () => {
          const { accessToken, blogId1, postId1 } = expect.getState()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId1, postId1)
          const urlWithId = getUrlWithId(endpoints.postController, postId1)

          await request(server)
            .put(url)
            .send(preparedPost.valid)
            .auth(accessToken, {type: "bearer"})
            .expect(204)

          const response = await request(server)
            .get(urlWithId)
            .expect(200)

          expect(response.body.title).toEqual(preparedPost.valid.title)
          expect(response.body.shortDescription).toEqual(preparedPost.valid.shortDescription)
          expect(response.body.content).toEqual(preparedPost.valid.content)
        })
      })

      describe('Delete post specified by id', () => {
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204)
        })

        it('Create data', async () => {
          const [token1, token2] = await factories.createAndLoginUsers(2)

          const [blog1] = await factories.createBlogs(token1.accessToken, 1)
          const [blog2] = await factories.createBlogs(token2.accessToken, 1)

          const [post1] = await factories.createPostsForBlog(token1.accessToken, blog1.id,1)
          const [post2] = await factories.createPostsForBlog(token2.accessToken, blog2.id,1)

          expect.setState({
            accessToken: token1.accessToken,
            blogId1: blog1.id,
            blogId2: blog2.id,
            postId1: post1.id,
            postId2: post2.id
          })
        })

        it('Try delete not existing post', async () => {
          const {accessToken, blogId1} = expect.getState()
          const randomId = randomUUID()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId1, randomId)

          await request(server)
            .delete(url)
            .auth(accessToken, {type: "bearer"})
            .expect(404)
        })

        it('Try delete post that belongs to blog that doesn`t belong to current user', async () => {
          const {accessToken, blogId2, postId2} = expect.getState()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId2, postId2)

          await request(server)
            .delete(url)
            .auth(accessToken, {type: "bearer"})
            .expect(403)
        })

        it('Try delete post without authorization', async () => {
          const { blogId1, postId1} = expect.getState()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId1, postId1)

          await request(server)
            .delete(url)
            .expect(401)
        })

        it('Should delete post', async () => {
          const { accessToken, blogId1, postId1} = expect.getState()
          const url = getUrlPostForSpecificBlog(endpoints.bloggerController.blogs, blogId1, postId1)

          await request(server)
            .delete(url)
            .auth(accessToken, {type: "bearer"})
            .expect(204)

          await request(server)
            .delete(url)
            .auth(accessToken, {type: "bearer"})
            .expect(404)
        })
      })
    })
  })
})