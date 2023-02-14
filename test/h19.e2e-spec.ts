import {INestApplication} from "@nestjs/common";
import {Factories} from "./helper/factories";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {EmailManager} from "../src/modules/public/auth/email-transfer/email.manager";
import {EmailManagerMock} from "./mock/emailAdapter.mock";
import {createApp} from "../src/helpers/create-app";
import request from "supertest";
import {endpoints, getUrlForReactionStatus} from "./helper/routing";
import {Response} from "./helper/response";
import {randomUUID} from "crypto";
import {getErrorMessage} from "./helper/helpers";

describe('e2e tests', () => {
    const second = 1000;
    jest.setTimeout(30 * second);

    let app: INestApplication;
    let server;
    let factories: Factories;
    let response: Response;

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
        response = new Response(server)
    });

    afterAll(async () => {
        await app.close();
    });

    /*
        Add:
         CRUD for comments
         Likes for posts and comments
         Logic for all get response where we should return users reaction status
     */

    describe('Post`s reaction status', () => {
        describe('PUT "/posts/:postId/like-status"', () => {
            it('Drop all data.', async () => {
                await request(server)
                    .delete(endpoints.testingController.allData)
                    .expect(204)
            })

            it('Create data', async () => {
                const [response] = await factories.createAndLoginUsers(1)
                const [blog] = await factories.createBlogs(response.accessToken, 1)
                const [post] = await factories.createPostsForBlog(response.accessToken, blog.id, 1)

                expect.setState({
                    accessToken: response.accessToken,
                    postId: post.id
                })
            })

            it('Shouldn`t put status if post with specified postId doesn\'t exists', async () => {
                const { accessToken } = expect.getState()
                const randomId = randomUUID()

                const url = getUrlForReactionStatus(endpoints.postController, randomId)
                const responseStatus = await response.addReaction(accessToken, url, 'Like')

                expect(responseStatus.status).toBe(404)
            })

            it('Shouldn`t put status if user unauthorized', async () => {
                const { postId } = expect.getState()
                const accessToken = ''

                const url = getUrlForReactionStatus(endpoints.postController, postId)
                const responseStatus = await response.addReaction(accessToken, url, 'Like')

                expect(responseStatus.status).toBe(401)
            })

            it('Shouldn`t put status if the inputModel has incorrect values', async () => {
                const { accessToken, postId } = expect.getState()
                const errorsMessages = getErrorMessage(['likeStatus'])
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus1 = await response.addReaction(accessToken, url, '')
                expect(responseStatus1.status).toBe(400)
                expect(responseStatus1.errorsMessages).toEqual({ errorsMessages })

                const responseStatus2 = await response.addReaction(accessToken, url, 'like')
                expect(responseStatus2.status).toBe(400)
                expect(responseStatus2.errorsMessages).toEqual({ errorsMessages })
            })

            it('Should put "Like"', async () => {
                const { accessToken, postId } = expect.getState()
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus = await response.addReaction(accessToken, url, 'Like')
                expect(responseStatus.status).toBe(204)

                const postWithoutToken = await response.getPostById(postId)
                expect(postWithoutToken.extendedLikesInfo.likesCount).toBe(1)
                expect(postWithoutToken.extendedLikesInfo.dislikesCount).toBe(0)
                expect(postWithoutToken.extendedLikesInfo.myStatus).toBe('None')

                const postWithToken = await response.getPostById(postId, accessToken)
                expect(postWithToken.extendedLikesInfo.myStatus).toBe('Like')
            })

            it('Should put "Dislike"', async () => {
                const { accessToken, postId } = expect.getState()
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus = await response.addReaction(accessToken, url, 'Dislike')
                expect(responseStatus.status).toBe(204)

                const post = await response.getPostById(postId, accessToken)
                expect(post.extendedLikesInfo.likesCount).toBe(0)
                expect(post.extendedLikesInfo.dislikesCount).toBe(1)
                expect(post.extendedLikesInfo.myStatus).toBe('Dislike')
            })

            it('Should put "None"', async () => {
                const { accessToken, postId } = expect.getState()
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus = await response.addReaction(accessToken, url, 'None')
                expect(responseStatus.status).toBe(204)

                const post = await response.getPostById(postId, accessToken)
                expect(post.extendedLikesInfo.likesCount).toBe(0)
                expect(post.extendedLikesInfo.dislikesCount).toBe(0)
                expect(post.extendedLikesInfo.myStatus).toBe('None')
            })
        })
    })
})