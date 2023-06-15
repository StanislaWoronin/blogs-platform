import request from 'supertest';
import { endpoints, getUrlForBanned } from '../helper/routing';
import { faker } from '@faker-js/faker';
import { preparedBlog, preparedPost } from '../helper/prepeared-data';
import { images } from '../images/images';
import { ImageStatus } from '../images/image-status.enum';
import { join } from 'path';

export class Blogger {
  constructor(private readonly server: any) {}

  async createBlog(accessToken: string) {
    const response = await request(this.server)
      .post(endpoints.bloggerController.blogs)
      .send(preparedBlog.valid)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status, body: response.body };
  }

  async uploadBackgroundWallpaper(
    blogId: string,
    imageStatus: ImageStatus,
    accessToken?: string,
  ) {
    const url = `/blogger/blogs/${blogId}/images/wallpaper`;
    if (!accessToken) {
      const response = await request(this.server)
        .post(url)
        .auth(accessToken, { type: 'bearer' })
        .send();

      return { status: response.status, body: response.body };
    }

    const imagePath = join(
      __dirname,
      '..',
      'images',
      'blog',
      images.blog.wallpaper[imageStatus],
    );

    const response = await request(this.server)
      .post(url)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', imagePath);

    return { status: response.status, body: response.body };
  }

  async uploadMainImageForBlog(
    blogId: string,
    imageStatus: ImageStatus,
    accessToken?: string,
  ) {
    const url = `/blogger/blogs/${blogId}/images/main`;
    if (!accessToken) {
      const response = await request(this.server)
        .post(url)
        .auth(accessToken, { type: 'bearer' })
        .send();

      return { status: response.status, body: response.body };
    }

    const imagePath = join(
      __dirname,
      '..',
      'images',
      'blog',
      images.blog.main[imageStatus],
    );

    const response = await request(this.server)
      .post(url)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', imagePath);

    return { status: response.status, body: response.body };
  }

  async uploadMainImageForPost(
    blogId: string,
    postId: string,
    imageStatus: ImageStatus,
    accessToken?: string,
  ) {
    const url = `/blogger/blogs/${blogId}/posts/${postId}/images/main`;

    if (!accessToken) {
      const response = await request(this.server)
        .post(url)
        .auth(accessToken, { type: 'bearer' })
        .send();

      return { status: response.status, body: response.body };
    }

    const imagePath = join(
      __dirname,
      '..',
      'images',
      'post',
      images.post.original[imageStatus],
    );

    const response = await request(this.server)
      .post(url)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', imagePath);

    return { status: response.status, body: response.body };
  }

  async banUser(
    accessToken: string,
    userId: string,
    blogId: string,
    banStatus: boolean,
  ) {
    const url = getUrlForBanned(endpoints.bloggerController.users[''], userId);

    const response = await request(this.server)
      .put(url)
      .auth(accessToken, { type: 'bearer' })
      .send({
        isBanned: banStatus,
        banReason: faker.random.alpha(20),
        blogId: blogId,
      });

    return { status: response.status, errorsMessages: response.body };
  }

  async getComments(accessToken?: string) {
    const response = await request(this.server)
      .get(`${endpoints.bloggerController.blogs}/comments`)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status, body: response.body };
  }

  async getMembership(blogId: string, accessToken?: string) {
    const response = await request(this.server)
      .get(`/blogger/users/blogs/${blogId}/payments`)
      .auth(accessToken, { type: 'bearer' });

    return { status: response.status, body: response.body };
  }
}
