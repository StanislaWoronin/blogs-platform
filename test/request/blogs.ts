import request from 'supertest';
import { endpoints, getUrlWithId } from '../helper/routing';

export class Blogs {
  constructor(private readonly server: any) {}

  async getBlogById(blogId: string) {
    const url = getUrlWithId(endpoints.blogController, blogId);

    const response = await request(this.server).get(url);

    return { status: response.status, body: response.body };
  }
}
