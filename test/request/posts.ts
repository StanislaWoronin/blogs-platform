import request from 'supertest';
import {
  endpoints,
  getUrlForReactionStatus,
  getUrlWithId,
} from '../helper/routing';

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

    if (!accessToken) {
      const response = await request(this.server).get(url);
      return { status: response.statusCode, body: response.body };
    }

    const response = await request(this.server)
      .get(url)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.statusCode, body: response.body };
  }

  async getPosts(accessToken?: string) {
    // if (!accessToken) {
    //     const response = await request(this.server)
    //         .get(endpoints.postController)
    //
    //     return {status: response.statusCode, body: response.body}
    // }

    const response = await request(this.server)
      .get(endpoints.postController)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.statusCode, body: response.body };
  }
}
