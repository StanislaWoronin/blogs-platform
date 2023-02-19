import request from 'supertest';
import {
  endpoints, getUrlForComment,
  getUrlForReactionStatus,
  getUrlWithId
} from "../helper/routing";

export class Posts {
  constructor(private readonly server: any) {}

  async addReaction(postId: string, status: string, accessToken?: string) {
    const url = getUrlForReactionStatus(endpoints.postController, postId);

    const response = await request(this.server)
      .put(url)
      .auth(accessToken, { type: 'bearer' })
      .send({
        likeStatus: `${status}`,
      });

    return { status: response.status, errorsMessages: response.body };
  }

  async getPostById(postId: string, accessToken?: string) {
    const url = getUrlWithId(endpoints.postController, postId);

    const response = await request(this.server)
      .get(url)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.statusCode, body: response.body };
  }

  async getPosts(accessToken?: string) {
    const response = await request(this.server)
      .get(endpoints.postController)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.statusCode, body: response.body };
  }

  async getComments(postId: string, accessToken?: string) {
    const url = getUrlForComment(endpoints.postController, postId)

    const response = await request(this.server)
      .get(url)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.statusCode, body: response.body };
  }
}
