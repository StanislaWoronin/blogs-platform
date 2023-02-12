import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { createApp } from "../src/helpers/create-app";
import request from "supertest";
import { preparedPost } from "./helper/prepeared-data";
import {getPosts, getPostsByBlogId, getStandardPosts} from "./helper/expect-post-models";
import { v4 as uuidv4 } from 'uuid';
import {getCreatedComment} from "./helper/expect-comment-model";
import {endpoints, getUrlForComment, getUrlForEndpointPostByBlogger} from "./helper/routing";
import {Factories} from "./helper/factories";

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(30 * second);

  let app: INestApplication;
  let server;
  let factories: Factories;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const rawApp = await moduleFixture.createNestApplication();
    app = createApp(rawApp);
    await app.init();
    server = await app.getHttpServer();
    factories = new Factories(server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public posts', () => {
    it('Clear date base', async () => {
      await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204)
    })

    it('Creat blogs', async () => {
      const [user] = await factories.createAndLoginUsers(1)

      const [blog1, blog2] = await factories.createBlogs(user.accessToken,2)

      expect.setState({
        user: user.user,
        token: user.accessToken,
        blog1,
        blog2})
    })

    it('Create posts', async () => {
      const {token, blog1, blog2} = expect.getState()

      const url = getUrlForEndpointPostByBlogger(endpoints.bloggerController.blogs, blog2.id)

      const post0 = await request(server)
          .post(url)
          .send(preparedPost.valid)
          .auth(token, {type: 'bearer'})
          .expect(201)

      const [post1, post2, post3] = await factories.createPostsForBlog(token, blog1.id, 3)

      expect.setState({post0: post0.body, post1, post2, post3})
    })

    describe('Return all posts', () => {
      it('Return posts without query', async () => {
        const {blog1, blog2, post1, post2, post3, post0} = expect.getState()

        const response = await request(server)
          .get(endpoints.postController)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 4,
          items: [
            getPosts(post3,blog1),
            getPosts(post2,blog1),
            getPosts(post1,blog1),
            getPosts(post0,blog2),
          ]
        })
      })

      it('Return posts with sorting and pagination', async () => {
        const {blog1, blog2, post3} = expect.getState()

        const response = await request(server)
          .get(`${endpoints.postController}?sortBy=title&sortDirection=asc&pageNumber=2&pageSize=2`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 2,
          page: 2,
          pageSize: 2,
          totalCount: 4,
          items: [
            getPosts(post3, blog1),
            getStandardPosts(blog2)
          ]
        })
      })

      it('Return posts with sorting and pagination', async () => {
        const blog = expect.getState().blog1

        const response = await request(server)
          .get(`${endpoints.postController}?sortBy=content&sortDirection=desc&pageSize=2`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 3,
          items: [
            getPostsByBlogId(3, 3, blog),
            getPostsByBlogId(2, 3, blog)
          ]
        })
      })
    })

    describe('Return post by id', () => {
      it('Try find not exist post', async () => {
        const randomUUID = uuidv4()

        await request(server)
          .get(`${endpoints.postController}${randomUUID}`)
          .expect(404)
      })

      it('Should return post by id', async () => {
        const blog = expect.getState().blog1
        const post = expect.getState().post1
        const response = await request(server)
          .get(`/posts/${post.id}`)
          .expect(200)

        expect(response.body).toStrictEqual(getPosts(post, blog))
      })
    })

    describe('Create new comment', () => {
      it('Unauthorized user try create comment', async () => {
        const post = expect.getState().post1
        const url = getUrlForComment(endpoints.postController, post.id)

        await request(server)
          .post(url)
          .send({content: "stringstringstringst"})
          .expect(401)
      })

      it('Try create comment for post with specified postId doesn`t exists', async () => {
        const {token} = expect.getState()
        const randomId = uuidv4()
        const url = getUrlForComment(endpoints.postController, randomId)

        await request(server)
          .post(url)
          .send({content: "aBqFljveZokLojESGyqiRg"})
          .auth(token, {type: 'bearer'})
          .expect(404)
      })

      it('Try create comment with short input data', async () => {
        const post = expect.getState().post1
        const {token} = expect.getState()
        const url = getUrlForComment(endpoints.postController, post.id)

        await request(server)
          .post(url)
          .send({content: "BqFljveZokLojESGyqi"})
          .auth(token, {type: 'bearer'})
          .expect(400)
      })

      it('Try create comment with long input data', async () => {
        const post = expect.getState().post1
        const {token} = expect.getState()
        const url = getUrlForComment(endpoints.postController, post.id)

        await request(server)
          .post(url)
          .send({content: "WOYrXLGOlXAYUYiZWdISgtqlRVZeakwOeRbRDDfJkpqsjZpAPkLsmTyhIOhifNjMoyRNrTnKWlTKZxfTscTYLBFmNWUBrLopVUXKVrsgeFZPVMWzVnCsbQJqwvHwviyZzgpBpdbUSfnVvktIWyBFvfqPTNFfohVFSHikdXfmgdWtTCmlZBynERyjFcIlMUmYSPPjhnXIPxhJIyHDBDstPGFHuzepkmktMyvJyXYFHztZRpqAdjmAbPHfnCooIBkwWfIyqApnKHhjgXlVNsQdYsxSqvkrdewtmabbXRRqJlwwv"})
          .auth(token, {type: 'bearer'})
          .expect(400)
      })

      it('Should return created comment', async () => {
        const post = expect.getState().post1
        const {user, token} = expect.getState()
        const url = getUrlForComment(endpoints.postController, post.id)

        const response = await request(server)
          .post(url)
          .send({content: "aBqFljveZokLojESGyqiRg"})
          .auth(token, {type: 'bearer'})
          .expect(201)

        expect(response.body).toStrictEqual(getCreatedComment(user))
        })
      })
    })

    describe('Return comments for specified post', () => {
      it('Create comments', async () => {
        const post = expect.getState().post2
        const token = expect.getState().token
        const [comment1, comment2, comment3] = await factories.createComments(token, post.id, 3)

        expect.setState({comment1, comment2, comment3})
      })

      it('Try find comment for passed postId doesn`t exist', async () => {
        const randomId = uuidv4()
        const url = getUrlForComment(endpoints.postController, randomId)

        await request(server)
            .get(url)
            .expect(404)
      })

      it('Return all by post id comments without query', async () => {
        const post = expect.getState().post2
        const {comment1, comment2, comment3} = expect.getState()
        const url = getUrlForComment(endpoints.postController, post.id)

        const response = await request(server)
            .get(url)
            .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 3,
          items: [comment3, comment2, comment1]
        })
      })

      it('Return comments with sorting and pagination', async () => {
        const {post2, comment1, comment2, comment3} = expect.getState()
        const url = getUrlForComment(endpoints.postController, post2.id)
        console.log(comment1)
        console.log(comment2)
        console.log(comment3)

        const response1 = await request(server)
            .get(`${url}?sortDirection=asc&pageNumber=2&pageSize=2`)
            .expect(200)

        expect(response1.body).toStrictEqual({
          pagesCount: 2,
          page: 2,
          pageSize: 2,
          totalCount: 3,
          items: [comment3]
        })

        const response = await request(server)
          .get(`${url}?sortDirection=desc&pageSize=2`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 2,
          page: 1,
          pageSize: 2,
          totalCount: 3,
          items: [comment3, comment2]
        })
      })
    })
});