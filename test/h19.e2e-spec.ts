import {INestApplication} from "@nestjs/common";
import {Factories} from "./helper/factories";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {EmailManager} from "../src/modules/public/auth/email-transfer/email.manager";
import {EmailManagerMock} from "./mock/emailAdapter.mock";
import {createApp} from "../src/helpers/create-app";
import request from "supertest";
import {endpoints, getUrlForReactionStatus} from "./helper/routing";
import {Posts} from "./request/posts";
import {randomUUID} from "crypto";
import {getErrorMessage} from "./helper/helpers";
import {ReactionModel} from "../src/global-model/reaction.model";

describe('e2e tests', () => {
    const second = 1000;
    jest.setTimeout(60 * second);

    let app: INestApplication;
    let server;
    let factories: Factories;
    let posts: Posts;

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
        posts = new Posts(server)
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
                const responseStatus = await posts.addReaction(accessToken, url, 'Like')

                expect(responseStatus.status).toBe(404)
            })

            it('Shouldn`t put status if user unauthorized', async () => {
                const { postId } = expect.getState()
                const accessToken = ''

                const url = getUrlForReactionStatus(endpoints.postController, postId)
                const responseStatus = await posts.addReaction(accessToken, url, 'Like')

                expect(responseStatus.status).toBe(401)
            })

            it('Shouldn`t put status if the inputModel has incorrect values', async () => {
                const { accessToken, postId } = expect.getState()
                const errorsMessages = getErrorMessage(['likeStatus'])
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus1 = await posts.addReaction(accessToken, url, '')
                expect(responseStatus1.status).toBe(400)
                expect(responseStatus1.errorsMessages).toEqual({ errorsMessages })

                const responseStatus2 = await posts.addReaction(accessToken, url, 'like')
                expect(responseStatus2.status).toBe(400)
                expect(responseStatus2.errorsMessages).toEqual({ errorsMessages })
            })

            it('Should put "Like"', async () => {
                const { accessToken, postId } = expect.getState()
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus = await posts.addReaction(accessToken, url, 'Like')
                expect(responseStatus.status).toBe(204)

                const postWithoutToken = await posts.getPostById(postId)
                expect(postWithoutToken.status).toBe(200)
                expect(postWithoutToken.body.extendedLikesInfo.likesCount).toBe(1)
                expect(postWithoutToken.body.extendedLikesInfo.dislikesCount).toBe(0)
                expect(postWithoutToken.body.extendedLikesInfo.myStatus).toBe('None')

                const postWithToken = await posts.getPostById(postId, accessToken)
                expect(postWithToken.status).toBe(200)
                expect(postWithToken.body.extendedLikesInfo.myStatus).toBe('Like')
            })

            it('Should put "Dislike"', async () => {
                const { accessToken, postId } = expect.getState()
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus = await posts.addReaction(accessToken, url, 'Dislike')
                expect(responseStatus.status).toBe(204)

                const post = await posts.getPostById(postId, accessToken)
                expect(post.status).toBe(200)
                expect(post.body.extendedLikesInfo.likesCount).toBe(0)
                expect(post.body.extendedLikesInfo.dislikesCount).toBe(1)
                expect(post.body.extendedLikesInfo.myStatus).toBe('Dislike')
            })

            it('Should put "None"', async () => {
                const { accessToken, postId } = expect.getState()
                const url = getUrlForReactionStatus(endpoints.postController, postId)

                const responseStatus = await posts.addReaction(accessToken, url, 'None')
                expect(responseStatus.status).toBe(204)

                const post = await posts.getPostById(postId, accessToken)
                expect(post.status).toBe(200)
                expect(post.body.extendedLikesInfo.likesCount).toBe(0)
                expect(post.body.extendedLikesInfo.dislikesCount).toBe(0)
                expect(post.body.extendedLikesInfo.myStatus).toBe('None')
            })

            describe('Testing all method returning post with reaction info', () => {
                // Has only one method XD
                it('Drop all data.', async () => {
                    await request(server)
                        .delete(endpoints.testingController.allData)
                        .expect(204)
                })

                it('Create data', async () => {
                    const [user1, user2, user3, user4, user5] = await factories.createAndLoginUsers(5)
                    const [blog] = await factories.createBlogs(user1.accessToken, 1)
                    const [post1, post2, post3] = await factories.createPostsForBlog(user1.accessToken, blog.id, 3)

                    const url1 = getUrlForReactionStatus(endpoints.postController, post1.id)
                    const url2 = getUrlForReactionStatus(endpoints.postController, post2.id)
                    const url3 = getUrlForReactionStatus(endpoints.postController, post3.id)

                    await posts.addReaction(user2.accessToken, url1, ReactionModel.Like)
                    await posts.addReaction(user2.accessToken, url2, ReactionModel.Dislike)
                    await posts.addReaction(user2.accessToken, url3, ReactionModel.Like)

                    await posts.addReaction(user3.accessToken, url1, ReactionModel.Like)
                    await posts.addReaction(user3.accessToken, url2, ReactionModel.Dislike)
                    await posts.addReaction(user3.accessToken, url3, ReactionModel.Dislike)

                    await posts.addReaction(user4.accessToken, url1, ReactionModel.Dislike)
                    await posts.addReaction(user4.accessToken, url2, ReactionModel.Dislike)
                    await posts.addReaction(user4.accessToken, url3, ReactionModel.Dislike)

                    await posts.addReaction(user5.accessToken, url1, ReactionModel.Like)
                    await posts.addReaction(user5.accessToken, url1, ReactionModel.Dislike)
                    await posts.addReaction(user5.accessToken, url2, ReactionModel.Dislike)
                    await posts.addReaction(user5.accessToken, url2, ReactionModel.Like)
                    await posts.addReaction(user5.accessToken, url3, ReactionModel.Dislike)
                    await posts.addReaction(user5.accessToken, url3, ReactionModel.Dislike)

                    expect.setState({
                        accessToken2: user2.accessToken,
                        user2: user2.user, user3: user3.user, user4: user4.user, user5: user5.user
                    })
                })

                it('GET "/posts" for unauthorized user', async () => {
                    const {user2, user3, user5} = expect.getState()
                    const response = await posts.getPosts()

                    expect(response.body.items[0].extendedLikesInfo).toStrictEqual({
                        likesCount: 1,
                        dislikesCount: 3,
                        myStatus: ReactionModel.None,
                        newestLikes: [
                            {
                                userId: expect.any(String),
                                login: user2.login,
                                addedAt: expect.any(String),
                            },
                        ]
                    })
                    expect(response.body.items[1].extendedLikesInfo).toStrictEqual({
                        likesCount: 1,
                        dislikesCount: 3,
                        myStatus: ReactionModel.None,
                        newestLikes: [
                            {
                                userId: expect.any(String),
                                login: user5.login,
                                addedAt: expect.any(String),
                            },
                        ]
                    })
                    expect(response.body.items[2].extendedLikesInfo).toStrictEqual({
                        likesCount: 2,
                        dislikesCount: 2,
                        myStatus: ReactionModel.None,
                        newestLikes: [
                            {
                                userId: expect.any(String),
                                login: user3.login,
                                addedAt: expect.any(String),
                            },
                            {
                                userId: expect.any(String),
                                login: user2.login,
                                addedAt: expect.any(String),
                            },
                        ]
                    })
                })

                it('GET "/posts" for user2', async () => {
                    const {accessToken2, user2, user3, user5} = expect.getState()

                    const response = await posts.getPosts(accessToken2)
                    expect(response.body.items[0].extendedLikesInfo).toStrictEqual({
                        likesCount: 1,
                        dislikesCount: 3,
                        myStatus: ReactionModel.Like,
                        newestLikes: [
                            {
                                userId: expect.any(String),
                                login: user2.login,
                                addedAt: expect.any(String),
                            },
                        ]
                    })
                    expect(response.body.items[1].extendedLikesInfo).toStrictEqual({
                        likesCount: 1,
                        dislikesCount: 3,
                        myStatus: ReactionModel.Dislike,
                        newestLikes: [
                            {
                                userId: expect.any(String),
                                login: user5.login,
                                addedAt: expect.any(String),
                            },
                        ]
                    })
                    expect(response.body.items[2].extendedLikesInfo).toStrictEqual({
                        likesCount: 2,
                        dislikesCount: 2,
                        myStatus: ReactionModel.Like,
                        newestLikes: [
                            {
                                userId: expect.any(String),
                                login: user3.login,
                                addedAt: expect.any(String),
                            },
                            {
                                userId: expect.any(String),
                                login: user2.login,
                                addedAt: expect.any(String),
                            },
                        ]
                    })
                })
            })
        })
    })
})