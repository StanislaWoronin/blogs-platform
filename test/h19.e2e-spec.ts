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
import {preparedComment, preparedStatus} from "./helper/prepeared-data";
import {Comments} from "./request/comments";
import {getExpectComment} from "./helper/expect-comment-model";

describe('e2e tests', () => {
    const second = 1000;
    jest.setTimeout(60 * second);

    let app: INestApplication;
    let server;
    let factories: Factories;
    let comments: Comments;
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
        comments = new Comments(server)
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

                const responseStatus = await posts.addReaction(randomId, ReactionModel.Like, accessToken)
                expect(responseStatus.status).toBe(404)
            })

            it('Shouldn`t put status if user unauthorized', async () => {
                const { postId } = expect.getState()

                const responseStatus = await posts.addReaction(postId, ReactionModel.Like)
                expect(responseStatus.status).toBe(401)
            })

            it('Shouldn`t put status if the inputModel has incorrect values', async () => {
                const { accessToken, postId } = expect.getState()
                const errorsMessages = getErrorMessage(['likeStatus'])

                const emptyString = await posts.addReaction(postId, preparedStatus.notValid.emptyString, accessToken)
                expect(emptyString.status).toBe(400)
                expect(emptyString.errorsMessages).toEqual({ errorsMessages })

                const lowerCase = await posts.addReaction(postId, preparedStatus.notValid.lowerCase, accessToken)
                expect(lowerCase.status).toBe(400)
                expect(lowerCase.errorsMessages).toEqual({ errorsMessages })

                const abracadabra = await posts.addReaction(postId, preparedStatus.notValid.abracadabra, accessToken)
                expect(abracadabra.status).toBe(400)
                expect(abracadabra.errorsMessages).toEqual({ errorsMessages })
            })

            it('Should put "Like"', async () => {
                const { accessToken, postId } = expect.getState()

                const responseStatus = await posts.addReaction(postId, ReactionModel.Like, accessToken)
                expect(responseStatus.status).toBe(204)

                const postWithoutToken = await posts.getPostById(postId)
                expect(postWithoutToken.status).toBe(200)
                expect(postWithoutToken.body.extendedLikesInfo.likesCount).toBe(1)
                expect(postWithoutToken.body.extendedLikesInfo.dislikesCount).toBe(0)
                expect(postWithoutToken.body.extendedLikesInfo.myStatus).toBe(ReactionModel.None)

                const postWithToken = await posts.getPostById(postId, accessToken)
                expect(postWithToken.status).toBe(200)
                expect(postWithToken.body.extendedLikesInfo.myStatus).toBe(ReactionModel.Like)
            })

            it('Should put "Dislike"', async () => {
                const { accessToken, postId } = expect.getState()

                const responseStatus = await posts.addReaction(postId, ReactionModel.Dislike, accessToken)
                expect(responseStatus.status).toBe(204)

                const post = await posts.getPostById(postId, accessToken)
                expect(post.status).toBe(200)
                expect(post.body.extendedLikesInfo.likesCount).toBe(0)
                expect(post.body.extendedLikesInfo.dislikesCount).toBe(1)
                expect(post.body.extendedLikesInfo.myStatus).toBe(ReactionModel.Dislike)
            })

            it('Should put "None"', async () => {
                const { accessToken, postId } = expect.getState()

                const responseStatus = await posts.addReaction(postId, ReactionModel.None, accessToken)
                expect(responseStatus.status).toBe(204)

                const post = await posts.getPostById(postId, accessToken)
                expect(post.status).toBe(200)
                expect(post.body.extendedLikesInfo.likesCount).toBe(0)
                expect(post.body.extendedLikesInfo.dislikesCount).toBe(0)
                expect(post.body.extendedLikesInfo.myStatus).toBe(ReactionModel.None)
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

                    await posts.addReaction(post1.id, ReactionModel.Like, user2.accessToken)
                    await posts.addReaction(post2.id, ReactionModel.Dislike, user2.accessToken)
                    await posts.addReaction(post3.id, ReactionModel.Like, user2.accessToken)

                    await posts.addReaction(post1.id, ReactionModel.Like, user3.accessToken)
                    await posts.addReaction(post2.id, ReactionModel.Dislike, user3.accessToken)
                    await posts.addReaction(post3.id, ReactionModel.Dislike, user3.accessToken)

                    await posts.addReaction(post1.id, ReactionModel.Dislike, user4.accessToken)
                    await posts.addReaction(post2.id, ReactionModel.Dislike, user4.accessToken)
                    await posts.addReaction(post3.id, ReactionModel.Dislike, user4.accessToken)

                    await posts.addReaction(post1.id, ReactionModel.Like, user5.accessToken)
                    await posts.addReaction(post1.id, ReactionModel.Dislike, user5.accessToken)
                    await posts.addReaction(post2.id, ReactionModel.Dislike, user5.accessToken)
                    await posts.addReaction(post2.id, ReactionModel.Like, user5.accessToken)
                    await posts.addReaction(post3.id, ReactionModel.Dislike, user5.accessToken)
                    await posts.addReaction(post3.id, ReactionModel.Dislike, user5.accessToken)

                    expect.setState({
                        accessToken2: user2.accessToken,
                        user2: user2.user, user3: user3.user, user4: user4.user, user5: user5.user
                    })
                })

                it('GET "/posts" for unauthorized user', async () => {
                    const {user2, user3, user5} = expect.getState()
                    const response = await posts.getPosts()
                    console.log(response)
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

    describe('CRUD operations for comments. Get comment by id is supporting method' +
        'for all CRUD operation', () => {
        it('Drop all data.', async () => {
            await request(server)
                .delete(endpoints.testingController.allData)
                .expect(204)
        })

        it('Create data', async () => {
            const [commentOwner, justUser] = await factories.createAndLoginUsers(2)
            const [blog] = await factories.createBlogs(commentOwner.accessToken,1)
            const [post] = await factories.createPostsForBlog(commentOwner.accessToken, blog.id, 1)
            const [comment] = await factories.createComments(commentOwner.accessToken, post.id, 1)

            expect.setState({
                commentOwner: commentOwner.user,
                ownerToken: commentOwner.accessToken,
                userToken: justUser.accessToken,
                comment
            })
        })

        describe('Update comment "/comments/:commentId"', () => {
            it('Shouldn`t update not exist comment', async () => {
                const { ownerToken } = expect.getState()
                const randomId = randomUUID()

                const response = await comments.updateComment(randomId, preparedComment.valid, ownerToken)
                expect(response.status).toBe(404)
            })

            it('Shouldn`t update if user try edit the comment that is not your own', async () => {
                const { userToken, comment } = expect.getState()

                const response = await comments.updateComment(comment.id, preparedComment.valid, userToken)
                expect(response.status).toBe(403)
            })

            it('Shouldn`t update if user unauthorized', async () => {
                const { comment } = expect.getState()

                const response = await comments.updateComment(comment.id, preparedComment.valid)
                expect(response.status).toBe(401)
            })

            it('Shouldn`t update if the inputModel has incorrect values', async () => {
                const { ownerToken, comment } = expect.getState()
                const errorsMessages = getErrorMessage(['content'])

                const response1 = await comments.updateComment(comment.id, preparedComment.short, ownerToken)
                expect(response1.status).toBe(400)
                expect(response1.errorsMessages).toStrictEqual({ errorsMessages })

                const response2 = await comments.updateComment(comment.id, preparedComment.long, ownerToken)
                expect(response2.status).toBe(400)
                expect(response2.errorsMessages).toStrictEqual({ errorsMessages })
            })

            it('Should update comment', async () => {
                const { ownerToken, comment } = expect.getState()
                const response = await comments.updateComment(comment.id, preparedComment.valid, ownerToken)
                expect(response.status).toBe(204)

                const updatedComment = await comments.getCommentById(comment.id)
                expect(updatedComment.body).not.toEqual(comment)
                expect(updatedComment.body.content).toEqual(preparedComment.valid.content)
            })
        })

        describe('Put reaction "/comments/:commentId/like-status"', () => {
            it('Shouldn`t put reaction if comment with specified id doesn`t exists', async () => {
                const { ownerToken } = expect.getState()
                const randomId = randomUUID()

                const response = await comments.addReaction(randomId, ReactionModel.Like, ownerToken)
                expect(response.status).toBe(404)
            })

            it('Shouldn`t put reaction if user is unauthorized', async () => {
                const { comment } = expect.getState()

                const response = await comments.addReaction(comment.id, ReactionModel.Like)
                expect(response.status).toBe(401)
            })

            it('Shouldn`t put reaction if user is unauthorized', async () => {
                const { comment } = expect.getState()

                const response = await comments.addReaction(comment.id, ReactionModel.Like)
                expect(response.status).toBe(401)
            })

            it('Shouldn`t put reaction if the inputModel has incorrect values', async () => {
                const { ownerToken, comment } = expect.getState()
                const errorsMessages = getErrorMessage(['likeStatus'])

                const emptyString = await comments.addReaction(comment.id, preparedStatus.notValid.emptyString, ownerToken)
                expect(emptyString.status).toBe(400)
                expect(emptyString.errorsMessages).toEqual({ errorsMessages })

                const lowerCase = await comments.addReaction(comment.id, preparedStatus.notValid.lowerCase, ownerToken)
                expect(lowerCase.status).toBe(400)
                expect(lowerCase.errorsMessages).toEqual({ errorsMessages })

                const abracadabra = await comments.addReaction(comment.id, preparedStatus.notValid.abracadabra  , ownerToken)
                expect(abracadabra.status).toBe(400)
                expect(abracadabra.errorsMessages).toEqual({ errorsMessages })
            })

            it('Should add reaction', async () => {
                const { commentOwner, ownerToken, userToken, comment } = expect.getState()

                const ownerLike = await comments.addReaction(comment.id, ReactionModel.Like, ownerToken)
                expect(ownerLike.status).toBe(204)

                const userLike = await comments.addReaction(comment.id, ReactionModel.Like, userToken)
                expect(userLike.status).toBe(204)

                const commentWithLike = await comments.getCommentById(comment.id, userToken)
                expect(commentWithLike.body)
                    .toEqual(getExpectComment(commentOwner, comment, 2, 0, ReactionModel.Like))
            })

            it('Should update reaction', async () => {
                const { commentOwner, userToken, comment } = expect.getState()

                const response = await comments.addReaction(comment.id, ReactionModel.Dislike, userToken)
                expect(response.status).toBe(204)

                const commentWithLike = await comments.getCommentById(comment.id, userToken)
                console.log(commentWithLike)
                expect(commentWithLike.body)
                    .toEqual(getExpectComment(commentOwner, comment, 1, 1, ReactionModel.Dislike))
            })

            it('Should remove reaction', async () => {
                const { commentOwner, userToken, comment } = expect.getState()

                const response = await comments.addReaction(comment.id, ReactionModel.None, userToken)
                expect(response.status).toBe(204)

                const commentWithLike = await comments.getCommentById(comment.id, userToken)
                expect(commentWithLike.body)
                    .toEqual(getExpectComment(commentOwner, comment, 1, 0, ReactionModel.None))
            })
        })

        describe('Delete comment "/comments/:commentsId"', () => {
            it('Shouldn`t delete comment if comment id not exists', async () => {
                const { ownerToken } = expect.getState()
                const randomId = randomUUID()

                const response = await comments.deleteComment(randomId, ownerToken)
                expect(response.status).toBe(404)
            })

            it('Shouldn`t delete comment if try delete the comment that is not your own', async () => {
                const { userToken, comment } = expect.getState()

                const response = await comments.deleteComment(comment.id, userToken)
                expect(response.status).toBe(403)
            })

            it('Shouldn`t delete comment without unauthorized', async () => {
                const { comment } = expect.getState()

                const response = await comments.deleteComment(comment.id)
                expect(response.status).toBe(401)
            })

            it('Shouldn delete comment', async () => {
                const { ownerToken, comment } = expect.getState()

                const response = await comments.deleteComment(comment.id, ownerToken)
                expect(response.status).toBe(204)

                const deletedComment = await comments.getCommentById(comment.id)
                expect(deletedComment.status).toBe(404)

                const tryDeleteAgain = await comments.deleteComment(comment.id, ownerToken)
                expect(tryDeleteAgain.status).toBe(404)
            })
        })
    })
})