import {INestApplication} from "@nestjs/common";
import {Factories} from "./helper/factories";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {EmailManager} from "../src/modules/public/auth/email-transfer/email.manager";
import {EmailManagerMock} from "./mock/emailAdapter.mock";
import {createApp} from "../src/helpers/create-app";
import request from "supertest";
import {preparedBlog, preparedUser, superUser} from "./helper/prepeared-data";
import {faker} from "@faker-js/faker";
import {bannedUser} from "./helper/exect-blogger.model";

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

    describe('PUT -> "/blogger/users/:id/ban": should unban user by blogger for specified blog;' +
        'status 204; used additional methods: POST => blogger/blogs, GET => "blogger/users/blog/:id;"', () => {

        it('Drop all data.', async () => {
            await request(server)
                .delete('/testing/all-data')
                .expect(204)
        })

        it('Create data', async () => {
            const [user1, user2] = await factories.createAndLoginUsers(2)
            const [blog1, blog2] = await factories.createBlogs(user1.accessToken, 2)

            expect.setState({
                accessToken: user1.accessToken,
                user2: user2.user,
                userId2: user2.user.id,
                blogId1: blog1.id,
                blogId2: blog2.id,
            })
        })

        it('Ban user2 for two blogs, PUT -> "/blogger/users/:id/ban"', async () => {
            const { accessToken, userId2, blogId1, blogId2 } = expect.getState()

            await request(server)
                .put(`/blogger/users/${userId2}/ban`)
                .send({
                    isBanned: true,
                    banReason: faker.lorem.words(5),
                    blogId: blogId1
                })
                .auth(accessToken, {type: 'bearer'})
                .expect(204)

            await request(server)
                .put(`/blogger/users/${userId2}/ban`)
                .send({
                    isBanned: true,
                    banReason: faker.lorem.words(5),
                    blogId: blogId2
                })
                .auth(accessToken, {type: 'bearer'})
                .expect(204)
        })

        it('Should get one banned user for each blog, GET => "blogger/users/blog/:id;"', async () => {
            const { accessToken, blogId1, blogId2, user2 } = expect.getState()

            const response1 = await request(server)
                .get(`/blogger/users/blog/${blogId1}`)
                .auth(accessToken, {type: 'bearer'})
                .expect(200)

            expect(response1.body.items).toHaveLength(1)
            expect(response1.body.items[0]).toEqual(bannedUser(user2))

            const response2 = await request(server)
                .get(`/blogger/users/blog/${blogId2}`)
                .auth(accessToken, {type: 'bearer'})
                .expect(200)

            expect(response2.body.items).toHaveLength(1)
            expect(response2.body.items[0]).toEqual(bannedUser(user2))
        })

        it('Unban user2 for blog2, PUT -> "/blogger/users/:id/ban"', async () => {
            const { accessToken, userId2, blogId2 } = expect.getState()

            await request(server)
                .put(`/blogger/users/${userId2}/ban`)
                .send({
                    isBanned: false,
                    banReason: faker.lorem.words(5),
                    blogId: blogId2
                })
                .auth(accessToken, {type: 'bearer'})
                .expect(204)
        })

        it('Should get one banned user for blog1 and shouldn`t get unbanned user for blog2,' +
            'GET => "blogger/users/blog/:id;"', async () => {

            const { accessToken, blogId1, blogId2, user2 } = expect.getState()

            const response1 = await request(server)
                .get(`/blogger/users/blog/${blogId1}`)
                .auth(accessToken, {type: 'bearer'})
                .expect(200)

            expect(response1.body.items).toHaveLength(1)
            expect(response1.body.items[0]).toEqual(bannedUser(user2))

            const response2 = await request(server)
                .get(`/blogger/users/blog/${blogId2}`)
                .auth(accessToken, {type: 'bearer'})
                .expect(200)

            expect(response2.body.items).toHaveLength(0)
            expect(response2.body.items[0]).toBeUndefined()
        })
    })

    describe('PUT -> "/sa/blogs/:id/ban": should ban blog; status 204; used additional methods:' +
        'POST => /blogger/blogs, GET => /blogs, GET => /blogs/:id, GET => /sa/blogs;', () => {

        it('Drop all data.', async () => {
            await request(server)
                .delete('/testing/all-data')
                .expect(204)
        })

        it('Create data', async  () => {
            const [user] = await factories.createAndLoginUsers(1)
            const [blog1, blog2] = await factories.createBlogs(user.accessToken, 2)

            expect.setState({
                user: user.user,
                blogId: blog2.id
            })
        })

        it('PUT -> "/sa/blogs/:id/ban"', async () => {
            const { blogId } = expect.getState()

            await request(server)
                .put(`/sa/blogs/${blogId}/ban`)
                .send({
                    "isBanned": true
                })
                .auth(superUser.valid.login, superUser.valid.password, {type: "basic"})
                .expect(204)
        })

        it('GET => /blogs, should return 1 blog', async () => {
            const response = await request(server)
                .get(`/blogs`)
                .expect(200)

            expect(response.body.items).toHaveLength(1)
        })

        it('GET => /sa/blogs, should return 2 blog', async () => {
            const response = await request(server)
              .get(`/sa/blogs`)
              .auth(superUser.valid.login, superUser.valid.password, {type: "basic"})
              .expect(200)

            expect(response.body.items).toHaveLength(2)
        })

        it('GET => /blogs/:id, shouldn`t return banned blog', async () => {
            const { blogId } = expect.getState()

            const response = await request(server)
                .get(`/blogs/${blogId}`)
                .expect(404)
        })


        it('PUT -> "/sa/blogs/:id/ban", should unban blog', async () => {
            const { blogId } = expect.getState()

            await request(server)
              .put(`/sa/blogs/${blogId}/ban`)
              .send({
                  "isBanned": false
              })
              .auth(superUser.valid.login, superUser.valid.password, {type: "basic"})
              .expect(204)
        })

        it('GET => /blogs, should return 2 blog', async () => {
            const response = await request(server)
              .get(`/blogs`)
              .expect(200)

            expect(response.body.items).toHaveLength(2)
        })
    })

    describe('GET -> "blogger/blogs": should return blogs created by blogger. Shouldn\'t return' +
      'blogs created by other bloggers; status 200; content: blog array with pagination; used additional' +
      'methods: POST -> /blogger/blogs, POST -> /sa/users, POST -> /auth/login;', () => {

        it('Drop all data.', async () => {
            await request(server)
              .delete('/testing/all-data')
              .expect(204)
        })

        it('Create data', async  () => {
            const [token1, token2] = await factories.createAndLoginUsers(2)
            const [blog1] = await factories.createBlogs(token1.accessToken, 1)
            const [blog2] = await factories.createBlogs(token2.accessToken, 1)

            expect.setState({
                accessToken1: token1.accessToken,
                accessToken2: token2.accessToken,
                blog1,
                blog2
            })
        })

        it('GET -> "blogger/blogs"', async () => {
            const { accessToken1 } = expect.getState()

            const response = await request(server)
              .get(`/blogger/blogs`)
              .auth(accessToken1, {type: 'bearer'})
              .expect(200)

            console.log(response.body);
        })
    })

    describe('GET -> "/posts/:id": Shouldn\'t return banned blog post. Should return unbanned blog' +
        'post; status 404; used additional methods: PUT => /sa/blogs/:id/ban, POST => /auth/login,' +
        'POST => /blogger/blogs, POST => /blogger/blogs/:blogId/posts, GET => /posts/:id;', () => {

        it('Drop all data.', async () => {
            await request(server)
                .delete('/testing/all-data')
                .expect(204)
        })

        it('Create data', async  () => {
            const [token] = await factories.createAndLoginUsers(1)
            const [blog] = await factories.createBlogs(token.accessToken, 1)
            const [post0, post1, post2] = await factories.createPostsForBlog(token.accessToken, blog.id, 3)

            expect.setState({
                blogId: blog.id,
                post0, post1, post2
            })
        })

        it('SA ban blog', async () => {
            const { blogId } = expect.getState()

            await request(server)
                .put(`/sa/blogs/${blogId}/ban`)
                .send({
                    "isBanned": true
                })
                .auth(superUser.valid.login, superUser.valid.password, {type: "basic"})
                .expect(204)
        })

        it('Shouldn`t return post if owned blog was banned', async () => {
            const {post0} = expect.getState()

            await request(server)
                .get(`/posts/${post0.id}`)
                .expect(404)
        })

        it('SA unban blog', async () => {
            const { blogId } = expect.getState()

            await request(server)
              .put(`/sa/blogs/${blogId}/ban`)
              .send({
                  "isBanned": false
              })
              .auth(superUser.valid.login, superUser.valid.password, {type: "basic"})
              .expect(204)
        })

        it('Shouldn`t return post if owned blog was banned', async () => {
            const {post0} = expect.getState()

            await request(server)
              .get(`/posts/${post0.id}`)
              .expect(200)
        })
    })
})