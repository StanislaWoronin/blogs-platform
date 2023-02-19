import { INestApplication } from '@nestjs/common';
import { Factories } from './helper/factories';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { EmailManager } from '../src/modules/public/auth/email-transfer/email.manager';
import { EmailManagerMock } from './mock/emailAdapter.mock';
import { createApp } from '../src/helpers/create-app';
import request from 'supertest';
import {
  endpoints,
} from './helper/routing';
import { Posts } from './request/posts';
import { randomUUID } from 'crypto';
import { getErrorMessage } from './helper/helpers';
import { ReactionModel } from '../src/global-model/reaction.model';
import { preparedComment, preparedPost, preparedStatus } from "./helper/prepeared-data";
import { Comments } from './request/comments';
import {SA} from "./request/sa";
import {Blogger} from "./request/blogger";
import { getExpectComment } from "./helper/expect-comment-model";

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
    comments = new Comments(server);
    factories = new Factories(server);
    posts = new Posts(server);
    sa = new SA(server);
  });

  afterAll(async () => {
    await app.close();
  });

  /*
        Add:
         CRUD for comments
         Likes for posts and comments
         Logic for all get response where we should return users reaction status
         Banned user cant put reaction and comments
     */

  describe('Post`s reaction status', () => {
    describe('PUT "/posts/:postId/like-status"', () => {
      it('Drop all data.', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204);
      });

      it('Create data', async () => {
        const [postOwner, justUser] = await factories.createAndLoginUsers(2);
        const [blog] = await factories.createBlogs(postOwner.accessToken, 1);
        const [post] = await factories.createPostsForBlog(
            postOwner.accessToken,
          blog.id,
          1,
        );

        expect.setState({
          userToken: justUser.accessToken,
          postId: post.id,
        });
      });

      it("Shouldn`t put status if post with specified postId doesn't exists", async () => {
        const { userToken } = expect.getState();
        const randomId = randomUUID();

        const responseStatus = await posts.addReaction(
          randomId,
          ReactionModel.Like,
            userToken,
        );
        expect(responseStatus.status).toBe(404);
      });

      it('Shouldn`t put status if user unauthorized', async () => {
        const { postId } = expect.getState();

        const responseStatus = await posts.addReaction(
          postId,
          ReactionModel.Like,
        );
        expect(responseStatus.status).toBe(401);
      });

      it('Shouldn`t put status if the inputModel has incorrect values', async () => {
        const { userToken, postId } = expect.getState();
        const errorsMessages = getErrorMessage(['likeStatus']);

        const emptyString = await posts.addReaction(
          postId,
          preparedStatus.notValid.emptyString,
            userToken,
        );
        expect(emptyString.status).toBe(400);
        expect(emptyString.errorsMessages).toEqual({ errorsMessages });

        const lowerCase = await posts.addReaction(
          postId,
          preparedStatus.notValid.lowerCase,
            userToken,
        );
        expect(lowerCase.status).toBe(400);
        expect(lowerCase.errorsMessages).toEqual({ errorsMessages });

        const abracadabra = await posts.addReaction(
          postId,
          preparedStatus.notValid.abracadabra,
            userToken,
        );
        expect(abracadabra.status).toBe(400);
        expect(abracadabra.errorsMessages).toEqual({ errorsMessages });
      });

      it('Should put "Like"', async () => {
        const { userToken, postId } = expect.getState();

        const responseStatus = await posts.addReaction(
          postId,
          ReactionModel.Like,
            userToken,
        );
        expect(responseStatus.status).toBe(204);

        const postWithoutToken = await posts.getPostById(postId);
        expect(postWithoutToken.status).toBe(200);
        expect(postWithoutToken.body.extendedLikesInfo.likesCount).toBe(1);
        expect(postWithoutToken.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(postWithoutToken.body.extendedLikesInfo.myStatus).toBe(
          ReactionModel.None,
        );

        const postWithToken = await posts.getPostById(postId, userToken);
        expect(postWithToken.status).toBe(200);
        expect(postWithToken.body.extendedLikesInfo.myStatus).toBe(
          ReactionModel.Like,
        );
      });

      it('Should put "Dislike"', async () => {
        const { userToken, postId } = expect.getState();

        const responseStatus = await posts.addReaction(
          postId,
          ReactionModel.Dislike,
            userToken,
        );
        expect(responseStatus.status).toBe(204);

        const post = await posts.getPostById(postId, userToken);
        expect(post.status).toBe(200);
        expect(post.body.extendedLikesInfo.likesCount).toBe(0);
        expect(post.body.extendedLikesInfo.dislikesCount).toBe(1);
        expect(post.body.extendedLikesInfo.myStatus).toBe(
          ReactionModel.Dislike,
        );
      });

      it('Should put "None"', async () => {
        const { userToken, postId } = expect.getState();

        const responseStatus = await posts.addReaction(
          postId,
          ReactionModel.None,
            userToken,
        );
        expect(responseStatus.status).toBe(204);

        const post = await posts.getPostById(postId, userToken);
        expect(post.status).toBe(200);
        expect(post.body.extendedLikesInfo.likesCount).toBe(0);
        expect(post.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(post.body.extendedLikesInfo.myStatus).toBe(ReactionModel.None);
      });

      describe('Testing all method returning post with reaction info', () => {
        // Has only one method XD
        it('Drop all data.', async () => {
          await request(server)
            .delete(endpoints.testingController.allData)
            .expect(204);
        });

        it('Create data', async () => {
          const [user1, user2, user3, user4, user5] =
            await factories.createAndLoginUsers(5);
          const [blog] = await factories.createBlogs(user1.accessToken, 1);
          const [post1, post2, post3] = await factories.createPostsForBlog(
            user1.accessToken,
            blog.id,
            3,
          );

          await posts.addReaction(
            post1.id,
            ReactionModel.Like,
            user2.accessToken,
          );
          await posts.addReaction(
            post2.id,
            ReactionModel.Dislike,
            user2.accessToken,
          );
          await posts.addReaction(
            post3.id,
            ReactionModel.Like,
            user2.accessToken,
          );

          await posts.addReaction(
            post1.id,
            ReactionModel.Like,
            user3.accessToken,
          );
          await posts.addReaction(
            post2.id,
            ReactionModel.Dislike,
            user3.accessToken,
          );
          await posts.addReaction(
            post3.id,
            ReactionModel.Dislike,
            user3.accessToken,
          );

          await posts.addReaction(
            post1.id,
            ReactionModel.Dislike,
            user4.accessToken,
          );
          await posts.addReaction(
            post2.id,
            ReactionModel.Dislike,
            user4.accessToken,
          );
          await posts.addReaction(
            post3.id,
            ReactionModel.Dislike,
            user4.accessToken,
          );

          await posts.addReaction(
            post1.id,
            ReactionModel.Like,
            user5.accessToken,
          );
          await posts.addReaction(
            post1.id,
            ReactionModel.Dislike,
            user5.accessToken,
          );
          await posts.addReaction(
            post2.id,
            ReactionModel.Dislike,
            user5.accessToken,
          );
          await posts.addReaction(
            post2.id,
            ReactionModel.Like,
            user5.accessToken,
          );
          await posts.addReaction(
            post3.id,
            ReactionModel.Dislike,
            user5.accessToken,
          );
          await posts.addReaction(
            post3.id,
            ReactionModel.Dislike,
            user5.accessToken,
          );

          expect.setState({
            accessToken2: user2.accessToken,
            user2: user2.user,
            user3: user3.user,
            user4: user4.user,
            user5: user5.user,
          });
        });

        it('GET "/posts" for unauthorized user', async () => {
          const { user2, user3, user5 } = expect.getState();
          const response = await posts.getPosts();

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
            ],
          });
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
            ],
          });
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
            ],
          });
        });

        it('GET "/posts" for user2', async () => {
          const { accessToken2, user2, user3, user5 } = expect.getState();

          const response = await posts.getPosts(accessToken2);
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
            ],
          });
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
            ],
          });
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
            ],
          });
        });
      });
    });
  });

  describe(
    'CRUD operations for comments. Get comment by id is supporting method' +
      'for all CRUD operation',
    () => {
      it('Drop all data.', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204);
      });

      it('Create data', async () => {
        const [commentOwner, justUser] = await factories.createAndLoginUsers(2);
        const [blog] = await factories.createBlogs(commentOwner.accessToken, 1);
        const [post] = await factories.createPostsForBlog(
          commentOwner.accessToken,
          blog.id,
          1,
        );
        const [comment] = await factories.createComments(
          commentOwner.accessToken,
          post.id,
          1,
        );

        expect.setState({
          commentOwner: commentOwner.user,
          ownerToken: commentOwner.accessToken,
          userToken: justUser.accessToken,
          blog,
          comment,
        });
      });

      describe('Update comment "/comments/:commentId"', () => {
        it('Shouldn`t update not exist comment', async () => {
          const { ownerToken } = expect.getState();
          const randomId = randomUUID();

          const response = await comments.updateComment(
            randomId,
            preparedComment.valid,
            ownerToken,
          );
          expect(response.status).toBe(404);
        });

        it('Shouldn`t update if user try edit the comment that is not your own', async () => {
          const { userToken, comment } = expect.getState();

          const response = await comments.updateComment(
            comment.id,
            preparedComment.valid,
            userToken,
          );
          expect(response.status).toBe(403);
        });

        it('Shouldn`t update if user unauthorized', async () => {
          const { comment } = expect.getState();

          const response = await comments.updateComment(
            comment.id,
            preparedComment.valid,
          );
          expect(response.status).toBe(401);
        });

        it('Shouldn`t update if the inputModel has incorrect values', async () => {
          const { ownerToken, comment } = expect.getState();
          const errorsMessages = getErrorMessage(['content']);

          const response1 = await comments.updateComment(
            comment.id,
            preparedComment.short,
            ownerToken,
          );
          expect(response1.status).toBe(400);
          expect(response1.errorsMessages).toStrictEqual({ errorsMessages });

          const response2 = await comments.updateComment(
            comment.id,
            preparedComment.long,
            ownerToken,
          );
          expect(response2.status).toBe(400);
          expect(response2.errorsMessages).toStrictEqual({ errorsMessages });
        });

        it('Should update comment', async () => {
          const { ownerToken, comment } = expect.getState();
          const response = await comments.updateComment(
            comment.id,
            preparedComment.newValid,
            ownerToken,
          );
          expect(response.status).toBe(204);

          const updatedComment = await comments.getCommentById(comment.id);

          expect(updatedComment.body).not.toEqual(comment);
          expect(updatedComment.body.content).toEqual(
            preparedComment.newValid.content,
          );

          expect.setState({
            updatedComment: updatedComment.body
          })
        });
      });

      describe('Put reaction "/comments/:commentId/like-status"', () => {
        it('Shouldn`t put reaction if comment with specified id doesn`t exists', async () => {
          const { ownerToken } = expect.getState();
          const randomId = randomUUID();

          const response = await comments.addReaction(
            randomId,
            ReactionModel.Like,
            ownerToken,
          );
          expect(response.status).toBe(404);
        });

        it('Shouldn`t put reaction if user is unauthorized', async () => {
          const { comment } = expect.getState();

          const response = await comments.addReaction(
            comment.id,
            ReactionModel.Like,
          );
          expect(response.status).toBe(401);
        });

        it('Shouldn`t put reaction if user is unauthorized', async () => {
          const { comment } = expect.getState();

          const response = await comments.addReaction(
            comment.id,
            ReactionModel.Like,
          );
          expect(response.status).toBe(401);
        });

        it('Shouldn`t put reaction if the inputModel has incorrect values', async () => {
          const { ownerToken, comment } = expect.getState();
          const errorsMessages = getErrorMessage(['likeStatus']);

          const emptyString = await comments.addReaction(
            comment.id,
            preparedStatus.notValid.emptyString,
            ownerToken,
          );
          expect(emptyString.status).toBe(400);
          expect(emptyString.errorsMessages).toEqual({ errorsMessages });

          const lowerCase = await comments.addReaction(
            comment.id,
            preparedStatus.notValid.lowerCase,
            ownerToken,
          );
          expect(lowerCase.status).toBe(400);
          expect(lowerCase.errorsMessages).toEqual({ errorsMessages });

          const abracadabra = await comments.addReaction(
            comment.id,
            preparedStatus.notValid.abracadabra,
            ownerToken,
          );
          expect(abracadabra.status).toBe(400);
          expect(abracadabra.errorsMessages).toEqual({ errorsMessages });
        });

        it('Should add reaction', async () => {
          const { commentOwner, ownerToken, userToken, updatedComment } =
            expect.getState();

          const ownerLike = await comments.addReaction(
            updatedComment.id,
            ReactionModel.Like,
            ownerToken,
          );
          expect(ownerLike.status).toBe(204);

          const userLike = await comments.addReaction(
            updatedComment.id,
            ReactionModel.Like,
            userToken,
          );
          expect(userLike.status).toBe(204);

          const commentWithLike = await comments.getCommentById(
            updatedComment.id,
            userToken,
          );
          expect(commentWithLike.body).toEqual(
            getExpectComment(commentOwner, updatedComment, 2, 0, ReactionModel.Like),
          );
        });

        it('Should update reaction', async () => {
          const { commentOwner, userToken, updatedComment } = expect.getState();

          const response = await comments.addReaction(
            updatedComment.id,
            ReactionModel.Dislike,
            userToken,
          );
          expect(response.status).toBe(204);

          const commentWithLike = await comments.getCommentById(
            updatedComment.id,
            userToken,
          );

          expect(commentWithLike.body).toEqual(
            getExpectComment(
              commentOwner,
              updatedComment,
              1,
              1,
              ReactionModel.Dislike,
            ),
          );
        });

        it('Should remove reaction', async () => {
          const { commentOwner, userToken, updatedComment } = expect.getState();

          const response = await comments.addReaction(
            updatedComment.id,
            ReactionModel.None,
            userToken,
          );
          expect(response.status).toBe(204);

          const commentWithLike = await comments.getCommentById(
            updatedComment.id,
            userToken,
          );
          expect(commentWithLike.body).toEqual(
            getExpectComment(commentOwner, updatedComment, 1, 0, ReactionModel.None),
          );
        });
      });

      describe('Shouldn`t return comment if comment`s owner or this comment blog banned', () => {
        it('Shouldn`t return comment if owner banned by sa', async () => {
          const {commentOwner, updatedComment} = expect.getState()

          const banUser = await sa.saBannedUser(commentOwner.id, true)
          expect(banUser.status).toBe(204)

          const tryGetComment1 = await comments.getCommentById(updatedComment.id)
          expect(tryGetComment1.status).toBe(404)

          const unBanUser = await sa.saBannedUser(commentOwner.id, false)
          expect(unBanUser.status).toBe(204)

          const tryGetComment2 = await comments.getCommentById(updatedComment.id)
          expect(tryGetComment2.status).toBe(200)
        })

        it('Should`t return comment if comment owner banned for blog', async () => {
          const { blog, updatedComment } = expect.getState()

          const bannedPost = await sa.saBannedBlog(blog.id, true)
          expect(bannedPost.status).toBe(204)

          const tryGetComment1 = await comments.getCommentById(updatedComment.id)
          expect(tryGetComment1.status).toBe(404)

          const unBanPost = await sa.saBannedBlog(blog.id, false)
          expect(unBanPost.status).toBe(204)

          const tryGetComment2 = await comments.getCommentById(updatedComment.id)
          expect(tryGetComment2.status).toBe(200)
        })
      })

      describe('Delete comment "/comments/:commentsId"', () => {
        it('Shouldn`t delete comment if comment id not exists', async () => {
          const { ownerToken } = expect.getState();
          const randomId = randomUUID();

          const response = await comments.deleteComment(randomId, ownerToken);
          expect(response.status).toBe(404);
        });

        it('Shouldn`t delete comment if try delete the comment that is not your own', async () => {
          const { userToken, comment } = expect.getState();

          const response = await comments.deleteComment(comment.id, userToken);
          expect(response.status).toBe(403);
        });

        it('Shouldn`t delete comment without unauthorized', async () => {
          const { comment } = expect.getState();

          const response = await comments.deleteComment(comment.id);
          expect(response.status).toBe(401);
        });

        it('Shouldn delete comment', async () => {
          const { ownerToken, comment } = expect.getState();

          const response = await comments.deleteComment(comment.id, ownerToken);
          expect(response.status).toBe(204);

          const deletedComment = await comments.getCommentById(comment.id);
          expect(deletedComment.status).toBe(404);

          const tryDeleteAgain = await comments.deleteComment(
            comment.id,
            ownerToken,
          );
          expect(tryDeleteAgain.status).toBe(404);
        });
      });
    },
  );

  describe('Shouldn`t put reaction if user was banned', () => {
    it('Drop all data.', async () => {
      await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204);
    });

    it('Create data', async () => {
      const [owner, simpleUser] = await factories.createAndLoginUsers(2)
      const [blog] = await factories.createBlogs(owner.accessToken, 1)
      const [post] = await factories.createPostsForBlog(owner.accessToken, blog.id, 1)
      const [comment] = await factories.createComments(owner.accessToken, post.id, 1)

      expect.setState({
        ownerToken: owner.accessToken,
        simpleUserId: simpleUser.user.id,
        simpleUserToken: simpleUser.accessToken,
        blogId: blog.id,
        postId: post.id,
        commentId: comment.id
      })
    })

    describe('User banned by sa can`t put comment and reactions', () => {
      it('SA banned simple user', async () => {
        const {simpleUserId} = expect.getState()

        const isBanned = await sa.saBannedUser(simpleUserId, true)
        expect(isBanned.status).toBe(204)
      })

      it('User banned by sa try put status to post', async () => {
        const {simpleUserToken, postId} = expect.getState()

        const response = await posts.addReaction(postId, ReactionModel.Like, simpleUserToken)
        expect(response.status).toBe(401)
      })

      it('User banned by sa try put status to comment', async () => {
        const {simpleUserToken, commentId} = expect.getState()

        const response = await comments.addReaction(commentId, ReactionModel.Like, simpleUserToken)
        expect(response.status).toBe(401)
      })

      it('User banned by sa try put comment', async () => {
        const {simpleUserToken, postId} = expect.getState()

        const response = await comments.createComments(postId, preparedComment.valid, simpleUserToken)
        expect(response.status).toBe(401)
      })

      it('SA unBan simple user', async () => {
        const {simpleUserId} = expect.getState()

        const isBanned = await sa.saBannedUser(simpleUserId, false)
        expect(isBanned.status).toBe(204)
      })
    })

    describe('User banned by blogger can`t put comment and reactions', () => {
      it('Blogger banned simple user', async () => {
        const {ownerToken, simpleUserId, blogId} = expect.getState()

        const isBanned = await blogger.banUser(ownerToken, simpleUserId, blogId,true)
        expect(isBanned.status).toBe(204)
      })

      it('User banned by blogger try put status to post', async () => {
        const {simpleUserToken, postId} = expect.getState()

        const response = await posts.addReaction(postId, ReactionModel.Like, simpleUserToken)
        expect(response.status).toBe(403)
      })

      it('User banned by blogger try put status to comment', async () => {
        const {simpleUserToken, commentId} = expect.getState()

        const response = await comments.addReaction(commentId, ReactionModel.Like, simpleUserToken)
        expect(response.status).toBe(403)
      })

      it('User banned by blogger try put comment', async () => {
        const {simpleUserToken, postId} = expect.getState()

        const response = await comments.createComments(postId, preparedComment.valid, simpleUserToken)
        expect(response.status).toBe(403)
      })
    })
  })

  describe('Return all comment specified user`s blog', () => {
    it('Drop all data.', async () => {
      await request(server)
        .delete(endpoints.testingController.allData)
        .expect(204);
    });

    it('Create data', async () => {
      const [commentOwner, simpleUser] = await factories.createAndLoginUsers(2);
      const [blog1, blog2] = await factories.createBlogs(commentOwner.accessToken, 2);
      const [blogSimpleUser] = await factories.createBlogs(simpleUser.accessToken, 1)
      const [post1, post2] = await factories.createPostsForBlog(
        commentOwner.accessToken,
        blog1.id,
        2,
      );
      const [postSimpleUser] = await factories.createPostsForBlog(
        simpleUser.accessToken,
        blogSimpleUser.id,
        1,
      );
      const [comment1, comment2] = await factories.createComments(
        commentOwner.accessToken,
        post1.id,
        2,
      );
      const [comment3, comment4] = await factories.createComments(
        commentOwner.accessToken,
        post2.id,
        2,
      );
      const [comment1SimpleUser, comment2SimpleUser] = await factories.createComments(
        simpleUser.accessToken,
        postSimpleUser.id,
        2
      )

      const response = await request(server)
        .get(`/blogger/blogs/comments`)
        .auth(commentOwner.accessToken, {type: 'bearer'})
        .expect(200)
      expect(response.body.items).toHaveLength(4)
      expect(response.body).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 4,
        items: expect.any(Array)
      })
      expect(response.body.items[0]).toStrictEqual({
        id: expect.any(String),
        content: preparedComment.valid.content,
        createdAt: expect.any(String),
        commentatorInfo: {
          userId: commentOwner.user.id,
          userLogin: commentOwner.user.login
        },
        postInfo: {
          id: post2.id,
          title: post2.title,
          blogId: blog1.id,
          blogName: blog1.name,
        }
      })
      expect(response.body.items[1]).toStrictEqual({
        id: expect.any(String),
        content: preparedComment.valid.content,
        createdAt: expect.any(String),
        commentatorInfo: {
          userId: commentOwner.user.id,
          userLogin: commentOwner.user.login
        },
        postInfo: {
          id: post2.id,
          title: post2.title,
          blogId: blog1.id,
          blogName: blog1.name,
        }
      })
      expect(response.body.items[2]).toStrictEqual({
        id: expect.any(String),
        content: preparedComment.valid.content,
        createdAt: expect.any(String),
        commentatorInfo: {
          userId: commentOwner.user.id,
          userLogin: commentOwner.user.login
        },
        postInfo: {
          id: post1.id,
          title: post1.title,
          blogId: blog1.id,
          blogName: blog1.name,
        }
      })
      expect(response.body.items[3]).toStrictEqual({
        id: expect.any(String),
        content: preparedComment.valid.content,
        createdAt: expect.any(String),
        commentatorInfo: {
          userId: commentOwner.user.id,
          userLogin: commentOwner.user.login
        },
        postInfo: {
          id: post1.id,
          title: post1.title,
          blogId: blog1.id,
          blogName: blog1.name,
        }
      })
    });
  })

  describe('Fix mistakes', () => {
    describe('DELETE, PUT -> "/comments/:id", GET, POST -> "posts/:postId/comments": should' +
      'return error if :id from uri param not found; status 404;', () => {

      it('Drop all data.', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204);
      });

      it('Should return error if :id from uri param not found; status 404', async () => {
        const [owner] = await factories.createAndLoginUsers(2)

        const deleteRes = await request(server)
          .delete('/comments/602afe92-7d97-4395-b1b9-6cf98b351bbe')
          .auth(owner.accessToken, { type: 'bearer' })
          .expect(404)

        await request(server)
          .put('/comments/602afe92-7d97-4395-b1b9-6cf98b351bbe')
          .auth(owner.accessToken, { type: 'bearer' })
          .send(preparedComment.valid)
          .expect(404)

        const postCommentRes = await request(server)
          .post(`/posts/602afe92-7d97-4395-b1b9-6cf98b351bbe/comments`)
          .auth(owner.accessToken, { type: 'bearer' })
          .send({"content":"length_21-weqweqweqwq"})
          .expect(404)
      })
    })

    describe('PUT -> "/posts/:postId/like-status": create post then: like the post by user 1,' +
      'user 2, user 3, user 4. get the post after each like by user 1. NewestLikes should be sorted' +
      'in descending; status 204; used additional methods: POST => /blogger/blogs,' +
      'POST => /blogger/blogs/:blogId/posts, GET => /posts/:id;', () => {

      it('Drop all data.', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204);
      });

      it('get "/post/:id"', async () => {
        const [owner] = await factories.createAndLoginUsers(1)
        const [blog] = await factories.createBlogs(owner.accessToken, 1)
        const [post] = await factories.createPostsForBlog(owner.accessToken, blog.id, 1)

        const response = await posts.getPostById(post.id)
        console.log(response);
      })
    })

    describe('PUT -> "/posts/:postId/like-status": create post then: like the post by user 1,' +
      ' user 2, user 3, user 4. get the post after each like by user 1. NewestLikes should be sorted' +
      ' in descending; status 204; used additional methods: POST => /blogger/blogs,' +
      ' POST => /blogger/blogs/:blogId/posts, GET => /posts/:id;', () => {

      it('Drop all data.', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204);
      });

      it('Create data', async () => {
        const [owner, user1, user2, user3, user4] = await factories.createAndLoginUsers(5)
        const [blog] = await factories.createBlogs(owner.accessToken, 1)
        const [post] = await factories.createPostsForBlog(owner.accessToken, blog.id, 1)

        expect.setState({postId: post.id, user1, user2, user3, user4})
      })

      it('User1 likes post', async () => {
        const { postId, user1 } = expect.getState()

        const request = await posts.addReaction(postId, ReactionModel.Like, user1.accessToken)
        expect(request.status).toBe(204)

        const post = await posts.getPostById(postId)
        console.log(post.body.extendedLikesInfo.newestLikes[0])
        expect(post.status).toBe(200)
        expect(post.body.extendedLikesInfo.likesCount).toBe(1)
        expect(post.body.extendedLikesInfo.newestLikes).toHaveLength(1)
        expect(post.body.extendedLikesInfo.newestLikes[0]).toStrictEqual({
          userId: user1.user.id,
          login: user1.user.login,
          addedAt: expect.any(String)
        })
      })

      it('User2 likes post', async () => {
        const { postId, user2 } = expect.getState()

        const request = await posts.addReaction(postId, ReactionModel.Like, user2.accessToken)
        expect(request.status).toBe(204)

        const post = await posts.getPostById(postId)
        expect(post.status).toBe(200)
        expect(post.body.extendedLikesInfo.likesCount).toBe(2)
        expect(post.body.extendedLikesInfo.newestLikes).toHaveLength(2)
        expect(post.body.extendedLikesInfo.newestLikes[0]).toEqual(
          {
            userId: user2.user.id,
            login: user2.user.login,
            addedAt: expect.any(String)
          }
        )
      })

      it('User3 likes post', async () => {
        const { postId, user3 } = expect.getState()

        const request = await posts.addReaction(postId, ReactionModel.Like, user3.accessToken)
        expect(request.status).toBe(204)

        const post = await posts.getPostById(postId)
        expect(post.status).toBe(200)
        expect(post.body.extendedLikesInfo.likesCount).toBe(3)
        expect(post.body.extendedLikesInfo.newestLikes).toHaveLength(3)
        expect(post.body.extendedLikesInfo.newestLikes[0]).toEqual(
          {
            userId: user3.user.id,
            login: user3.user.login,
            addedAt: expect.any(String)
          }
        )
      })
    })

    describe('GET -> "/posts/:postId/comments": should return status 200; content: comments with' +
      'pagination; used additional methods: POST => /blogger/blogs, POST => /blogger/blogs/:blogId/posts,' +
      'POST => /posts/:postId/comments;', () => {

      it('Drop all data.', async () => {
        await request(server)
          .delete(endpoints.testingController.allData)
          .expect(204);
      });

      it('Create mistakes', async () => {
        const [owner] = await factories.createAndLoginUsers(1)
        const [blog] = await factories.createBlogs(owner.accessToken, 1)
        const [post] = await factories.createPostsForBlog(owner.accessToken, blog.id, 1)
        const [comment] = await factories.createComments(owner.accessToken, post.id, 1)

        const response = await posts.getComments(post.id, owner.accessToken)
        expect(response.status).toBe(200)
        expect(response.body.items).toHaveLength(1)
        expect(response.body.items[0]).toStrictEqual({
          id: expect.any(String),
          content: preparedComment.valid.content,
          createdAt: expect.any(String),
          likesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: 'None'
          },
          commentatorInfo: {
            userId: owner.user.id,
            userLogin: owner.user.login
          }
        })
      })
    })


  })


});
