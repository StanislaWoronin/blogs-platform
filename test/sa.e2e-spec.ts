import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { createApp } from '../src/helpers/create-app';
import request from 'supertest';
import { banUserDto, preparedBlog, preparedUser, superUser } from "./helper/prepeared-data";
import { getErrorMessage } from './helper/helpers';
import {endpoints, getUrlForBanned, getUrlWithId} from "./helper/routing";
import {factory} from "ts-jest/dist/transformers/hoist-jest";
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

  describe('sa/users', () => {
    describe('Add new user to the sistem', () => {
      const errorsMessages = getErrorMessage(["login", "password", "email"]);

      it('Clear all data', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204)
      })

      it('SA try create new user without autorisation', async () => {
        await request(server)
          .post(endpoints.sa.users)
          .send(preparedUser.valid1)
          .auth(superUser.notValid.login, superUser.notValid.password, { type: 'basic' })
          .expect(401)
      })

      it('SA try create user with short input data', async () => {
        const response = await request(server)
          .post(endpoints.sa.users)
          .send(preparedUser.short)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(400)

        expect(response.body).toEqual({ errorsMessages })
      })

      it('SA try create user with long input data', async () => {
        const response = await request(server)
          .post(endpoints.sa.users)
          .send(preparedUser.long)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(400)

        expect(response.body).toEqual({ errorsMessages })
      })

      it('SA should create user', async () => {
        const response = await request(server)
          .post(endpoints.sa.users)
          .send(preparedUser.valid1)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        expect(response.body).toEqual({
          id: expect.any(String),
          login1: preparedUser.valid1.login,
          email: preparedUser.valid1.email,
          createdAt: expect.any(String),
          banInfo: {
            isBanned: false,
            banDate: null,
            banReason: null
          }
        })
      })
    })

    describe('Return users with pagination. Additional method Get', () => {
      it('Clear all data', async() => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204)
      })

      it('Create five users and ban even users', async() => {
        const user1 = await request(server)
          .post(endpoints.sa.users)
          .send({login1: 'User5',
            password: 'qwerty',
            email: 'somemail1@gmail.com'})
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        const user2 = await request(server)
          .post(endpoints.sa.users)
          .send({
            login1: 'User4',
            password: 'qwerty',
            email: 'somemail2@gmail.com'})
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        const user3 = await request(server)
          .post(`/sa/users`)
          .send({
            login1: 'User3',
            password: 'qwerty',
            email: 'somemail3@gmail.com'})
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        const user4 = await request(server)
          .post(endpoints.sa.users)
          .send({
            login1: 'User2',
            password: 'qwerty',
            email: 'somemail4@gmail.com'})
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        const user5 = await request(server)
          .post(endpoints.sa.users)
          .send({
            login1: 'User1',
            password: 'qwerty',
            email: 'somemail5@gmail.com'})
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        const url1 = getUrlForBanned(endpoints.sa.users, user2.body.id)
        const url2 = getUrlForBanned(endpoints.sa.users, user4.body.id)

        await request(server)
          .put(url1)
          .send(banUserDto.valid)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(204)

        await request(server)
          .put(url2)
          .send(banUserDto.valid)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(204)

        const response = await request(server)
          .get(endpoints.sa.users)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const bannedUser2 = response.body.items[3]
        const bannedUser4 = response.body.items[1]

        expect.setState({
          user1: user1.body,
          user2: bannedUser2,
          user3: user3.body,
          user4: bannedUser4,
          user5: user5.body,
          items1: [user5.body, bannedUser4, user3.body, bannedUser2, user1.body],
          items2: [user5.body, user3.body, user1.body],
          items3: [bannedUser4, bannedUser2],
          items4: [bannedUser2, user1.body],
          items5: [user5.body, user1.body]
        })
      })

      it('Get users without query, should return all users', async () => {
        const response = await request(server)
          .get(endpoints.sa.users)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const items1 = expect.getState().items1

        expect(response.body).toStrictEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 5,
          items: items1
        })
      })

      it('Should return not banned users', async () => {
        const response = await request(server)
          .get(`${endpoints.sa.users}?banStatus=notBanned&sortBy=login&sortDirection=asc`)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const items2 = expect.getState().items2

        expect(response.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 3,
          items: items2
        })
      })

      it('Should return banned users', async () => {
        const response = await request(server)
          .get(`${endpoints.sa.users}?banStatus=banned&sortBy=email&sortDirection=desc`)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const items3 = expect.getState().items3

        expect(response.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 2,
          items: items3
        })
      })

      it('Should return all users with pagination', async () => {
        const response = await request(server)
          .get(`${endpoints.sa.users}?banStatus=all&pageNumber=2&pageSize=3`)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const items4 = expect.getState().items4

        expect(response.body).toEqual({
          pagesCount: 2,
          page: 2,
          pageSize: 3,
          totalCount: 5,
          items: items4
        })
      })

      it('Should return users with pagination and search login term', async () => {
        const response = await request(server)
          .get(`${endpoints.sa.users}?searchLoginTerm=1`)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const userWithTerm = expect.getState().user5

        expect(response.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [userWithTerm]
        })
      })

      it('Should return users with pagination and search email term', async () => {
        const response = await request(server)
          .get(`${endpoints.sa.users}?searchEmailTerm=1`)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const userWithTerm = expect.getState().user1

        expect(response.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [userWithTerm]
        })
      })

      it('Should return users with pagination and search login or email term', async () => {
        const response = await request(server)
          .get(`${endpoints.sa.users}?searchLoginTerm=1&searchEmailTerm=1`)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        const items5 = expect.getState().items5

        expect(response.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 2,
          items: items5
        })
      })
    })

    describe('Ban/unban user, additional method GET users', () => {
      const errorsMessages = getErrorMessage(['isBanned', 'banReason'])

      it('Clear all data', async() => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204)
      })

      it('Create user', async () => {
        const response = await request(server)
          .post(endpoints.sa.users)
          .send(preparedUser.valid1)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        expect.setState({user: response.body})
      })

      it('SA try ban user without autorisation', async () => {
        const {user} = expect.getState()
        const url = getUrlForBanned(endpoints.sa.users, user.id)

        await request(server)
          .put(url)
          .send(banUserDto.valid)
          .auth(superUser.notValid.login, superUser.notValid.password, { type: 'basic' })
          .expect(401)
      })

      it('SA try ban user with incorrect input data', async () => {
        const {user} = expect.getState()
        const url = getUrlForBanned(endpoints.sa.users, user.id)

        const response = await request(server)
          .put(url)
          .send(banUserDto.notValid)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(400)

        expect(response.body).toStrictEqual({ errorsMessages })
      })

      it('SA should ban user', async () => {
        const { user } = expect.getState()
        const url = getUrlForBanned(endpoints.sa.users, user.id)

        await request(server)
          .put(url)
          .send(banUserDto.valid)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(204)

        const response = await request(server)
          .get(endpoints.sa.users)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        expect(response.body.items[0].banInfo).toEqual({
          isBanned: true,
          banDate: expect.any(String),
          banReason: banUserDto.valid.banReason
        })
      })

      it('SA should unban user', async () => {
        const { user } = expect.getState()
        const url = getUrlForBanned(endpoints.sa.users, user.id)

        await request(server)
          .put(url)
          .send(banUserDto.validUnBun)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(204)

        const response = await request(server)
          .get(endpoints.sa.users)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(200)

        expect(response.body.items[0].banInfo).toEqual({
          isBanned: false,
          banDate: null,
          banReason: null
        })
      })
    })

    describe('Delete user specified by id', () => {
      it('Clear all data', async() => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204)
      })

      it('Create user', async () => {
        const response = await request(server)
          .post(endpoints.sa.users)
          .send(preparedUser.valid1)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(201)

        expect.setState({user: response.body})
      })

      it('SA try delete user without autorisation', async () => {
        const {user} = expect.getState()
        const url = getUrlWithId(endpoints.sa.users, user.id)

        await request(server)
          .delete(url)
          .auth(superUser.notValid.login, superUser.notValid.password, { type: 'basic' })
          .expect(401)
      })

      it('Should delete user', async () => {
        const {user} = expect.getState()
        const url = getUrlWithId(endpoints.sa.users, user.id)

        await request(server)
          .delete(url)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(204)
      })

      it('Try delete already deleted user', async () => {
        const {user} = expect.getState()
        const url = getUrlWithId(endpoints.sa.users, user.id)

        await request(server)
          .delete(url)
          .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
          .expect(404)
      })
    })
  })

  describe('sa/blogs', () => {
    describe('ban/unban blog', () => {
      it('Clear all data', async () => {
        await request(server).delete(endpoints.testingController.allData).expect(204);
      });

      it('Create user -> login -> create blog', async () => {
        // const user = await factory TODO доделать и security
        await request(server)
          .post(endpoints.sa.users)
          .send(preparedUser.valid1)
          .auth(superUser.valid.login, superUser.valid.password, {
            type: 'basic',
          })
          .expect(201);

        const token = await request(server)
          .post(endpoints.authController.login)
          .send(preparedUser.login1)
          .set({ 'user-agent': 'chrome/0.1' })
          .expect(200);

        const blog = await request(server)
          .post(`/blogger/blogs`)
          .send(preparedBlog.valid)
          .set({ Authorization: `Bearer: ${token.body.accessToken}` })
          .expect(201)

        expect.setState({blogId: blog.body.id})
      });

      it('Unauthorized SA try ban blog', async () => {
        const blogId = expect.getState().blogId

        await request(server)
          .put(`/sa/blogs/${blogId}/ban`)
          .send({isBanned: true})
          .auth(superUser.notValid.login, superUser.notValid.password, {
            type: 'basic',
          })
          .expect(401)
      })

      it('SA try ban blog with incorrect input data', async () => {
        const blogId = expect.getState().blogId
        const errorsMessages = getErrorMessage(['isBanned'])
        await request(server)
          .put(`/sa/blogs/${blogId}/ban`)
          .send({isBanned: 'true'})
          .auth(superUser.valid.login, superUser.valid.password, {
            type: 'basic',
          })
          .expect(400)
      })

      it('Should ban blog', async () => {
        const blogId = expect.getState().blogId

        await request(server)
          .put(`/sa/blogs/${blogId}/ban`)
          .send({isBanned: true})
          .auth(superUser.valid.login, superUser.valid.password, {
            type: 'basic',
          })
          .expect(204)

        const response = await request(server)
          .get(`/blogs/${blogId}`)
          .expect(200)

        console.log(response.body, 'blog');
      })
    });
  });
});