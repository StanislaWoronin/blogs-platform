import { CommentDTO } from '../../src/modules/public/comments/api/dto/commentDTO';
import request from 'supertest';
import {
  endpoints,
  getUrlForComment,
  getUrlForReactionStatus,
  getUrlWithId,
} from '../helper/routing';

export class Comments {
  constructor(private readonly server: any) {}

  async getCommentById(commentId: string, accessToken?: string) {
    const url = getUrlWithId(endpoints.commentController, commentId);

    const response = await request(this.server)
      .get(url)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status, body: response.body };
  }

  async createComments(
    postId: string,
    inputPostData: CommentDTO,
    accessToken?: string,
  ) {
    const url = getUrlForComment(endpoints.postController, postId);

    const response = await request(this.server)
      .post(url)
      .auth(accessToken, { type: 'bearer' })
      .send(inputPostData);

    return { status: response.status, body: response.body };
  }

  async updateComment(
    commentId: string,
    value: CommentDTO,
    accessToken?: string,
  ) {
    const url = getUrlWithId(endpoints.commentController, commentId);

    const response = await request(this.server)
      .put(url)
      .auth(accessToken, { type: 'bearer' })
      .send(value);

    return { status: response.status, errorsMessages: response.body };
  }

  async addReaction(commentId: string, status: string, accessToken?: string) {
    const url = getUrlForReactionStatus(endpoints.commentController, commentId);

    const response = await request(this.server)
      .put(url)
      .auth(accessToken, { type: 'bearer' })
      .send({
        likeStatus: `${status}`,
      });

    return { status: response.status, errorsMessages: response.body };
  }

  async deleteComment(commentId: string, accessToken?: string) {
    const url = getUrlWithId(endpoints.commentController, commentId);

    const response = await request(this.server)
      .delete(url)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status };
  }
}
