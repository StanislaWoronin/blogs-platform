import { preparedComment, superUser } from './prepeared-data';
import { UserDto } from '../../src/modules/super-admin/api/dto/user.dto';
import request from 'supertest';
import {
  UserViewModel,
  UserViewModelWithBanInfo,
} from '../../src/modules/super-admin/api/dto/user.view.model';
import { PostViewModel } from '../../src/modules/public/posts/api/dto/postsView.model';
import { PostDto } from '../../src/modules/blogger/api/dto/post.dto';
import { PostWithBlogIdDTO } from '../../src/modules/public/posts/api/dto/postDTO';
import { faker } from '@faker-js/faker';
import { BlogDto } from '../../src/modules/blogger/api/dto/blog.dto';
import {
  endpoints,
  getUrlForComment,
  getUrlForEndpointPostByBlogger,
} from './routing';
import { CreatedComment } from '../../src/modules/public/comments/infrastructure/entity/db_comment.model';
import { CommentDTO } from '../../src/modules/public/comments/api/dto/commentDTO';
import { ImageStatus } from '../images/image-status.enum';
import { Blogger } from '../request/blogger';

export class Factories {
  constructor(private readonly server: any, private blogger: Blogger) {}

  async createUsers(usersCount: number): Promise<UserViewModelWithBanInfo[]> {
    const users = [];

    for (let i = 0; i < usersCount; i++) {
      const inputUserData: UserDto = {
        login: `user${i}`,
        email: `somemail${i}@email.com`,
        password: `password${i}`,
      };

      const response = await request(this.server)
        .post(endpoints.sa.users)
        .auth(superUser.valid.login, superUser.valid.password, {
          type: 'basic',
        })
        .send(inputUserData);

      users.push(response.body);
    }

    return users;
  }

  async createAndLoginUsers(userCount: number): Promise<
    {
      user: UserViewModelWithBanInfo;
      accessToken: string;
      refreshToken: string;
    }[]
  > {
    const users = await this.createUsers(userCount);

    const tokens = [];
    for (let i = 0; i < userCount; i++) {
      const userLoginData = {
        loginOrEmail: users[i].login,
        password: `password${i}`,
      };

      const response = await request(this.server)
        .post(endpoints.authController.login)
        .set('User-Agent', faker.internet.userAgent())
        .send(userLoginData);

      const accessToken = response.body.accessToken;
      const refreshToken = response.headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

      tokens.push({ user: users[i], accessToken, refreshToken });
    }
    return tokens;
  }

  async createAndLoginOneUserManyTimes(loginCount: number): Promise<{
    user: UserViewModelWithBanInfo;
    accessToken: string;
    refreshToken: string;
  }> {
    const [user] = await this.createUsers(loginCount);
    const userWithTokens = { user, accessToken: null, refreshToken: null };

    const userLoginData = {
      loginOrEmail: user.login,
      password: `password0`,
    };

    for (let i = 0; i < loginCount; i++) {
      const response = await request(this.server)
        .post(endpoints.authController.login)
        .set('User-Agent', faker.internet.userAgent())
        .send(userLoginData);

      userWithTokens.accessToken = response.body.accessToken;
      userWithTokens.refreshToken = response.headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

      if (i != loginCount - 1) await new Promise((r) => setTimeout(r, 2500));
    }

    return userWithTokens;
  }

  async createBlogs(accessToken: string, blogsCount: number) {
    const blogs = [];

    for (let i = 0; i < blogsCount; i++) {
      const inputBlogData: BlogDto = {
        name: `name${i}`,
        description: `description${i}`,
        websiteUrl: `websiteUrl${i}.com`,
      };

      const response = await request(this.server)
        .post(endpoints.bloggerController.blogs)
        .auth(accessToken, { type: 'bearer' })
        .send(inputBlogData);

      blogs.push(response.body);
    }

    return blogs;
  }

  async createBlogsAndSendImages(accessToken: string, blogsCount: number) {
    const blogs = [];
    for (let i = 0; i < blogsCount; i++) {
      const inputBlogData: BlogDto = {
        name: `name${i}`,
        description: `description${i}`,
        websiteUrl: `websiteUrl${i}.com`,
      };

      const blog = await request(this.server)
        .post(endpoints.bloggerController.blogs)
        .auth(accessToken, { type: 'bearer' })
        .send(inputBlogData);

      await this.blogger.uploadBackgroundWallpaper(
        blog.body.id,
        ImageStatus.Valid,
        accessToken,
      );

      const images = await this.blogger.uploadMainImageForBlog(
        blog.body.id,
        ImageStatus.Valid,
        accessToken,
      );

      blogs.push({
        id: blog.body.id,
        name: blog.body.name,
        description: blog.body.description,
        websiteUrl: blog.body.websiteUrl,
        createdAt: blog.body.createdAt,
        isMembership: blog.body.isMembership,
        images: images.body,
      });
    }

    return blogs.reverse();
  }

  async createPostsForBlog(
    accessToken: string,
    blogId: string,
    postsCount: number,
  ): Promise<PostViewModel[]> {
    const posts = [];

    for (let i = 0; i < postsCount; i++) {
      const inputPostData: PostWithBlogIdDTO = {
        title: `title${i}`,
        shortDescription: `shortDescription${i}`,
        content: `content${i}`,
        blogId: blogId,
      };

      const url = getUrlForEndpointPostByBlogger(
        endpoints.bloggerController.blogs,
        blogId,
      );

      const response = await request(this.server)
        .post(url)
        .auth(accessToken, { type: 'bearer' })
        .send(inputPostData);
      posts.push(response.body);
    }

    return posts;
  }

  async createComments(
    accessToken: string,
    postId: string,
    commentCount: number,
  ): Promise<CreatedComment[]> {
    const comment = [];

    for (let i = 0; i < commentCount; i++) {
      const inputPostData: CommentDTO = preparedComment.valid;

      const url = getUrlForComment(endpoints.postController, postId);

      const response = await request(this.server)
        .post(url)
        .auth(accessToken, { type: 'bearer' })
        .send(inputPostData);
      comment.push(response.body);
    }

    return comment;
  }
}
