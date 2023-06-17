import request from 'supertest';
import { endpoints, getUrlWithId } from '../helper/routing';

export class Blogs {
  constructor(private readonly server: any) {}

  async getBlogById(blogId: string, accessToken?: string) {
    const url = getUrlWithId(endpoints.blogController, blogId);
    let response;
    if (!accessToken) {
      response = await request(this.server).get(url);
    } else {
      response = await request(this.server)
        .get(url)
        .auth(accessToken, { type: 'bearer' });
    }

    return { status: response.status, body: response.body };
  }

  async getBlogs(accessToken?: string) {
    const response = await request(this.server)
      .get(endpoints.blogController)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status, body: response.body };
  }

  async subscribeToBlog(blogId: string, accessToken?: string) {
    const response = await request(this.server)
      .post(`/blogs/${blogId}/subscription`)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status, body: response.body };
  }

  async updateSubscribeStatus(
    blogId: string,
    accessToken?: string,
  ): Promise<number> {
    const response = await request(this.server)
      .delete(`/blogs/${blogId}/subscription`)
      .auth(accessToken, { type: 'bearer' });

    return response.status;
  }
}
