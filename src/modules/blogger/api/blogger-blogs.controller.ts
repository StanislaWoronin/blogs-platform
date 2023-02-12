import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthBearerGuard } from '../../../guards/auth.bearer.guard';
import { BloggerBlogService } from '../application/blogger-blogs.service';
import { QueryParametersDto } from '../../../global-model/query-parameters.dto';
import { User } from '../../../decorator/user.decorator';
import { UserDBModel } from '../../super-admin/infrastructure/entity/userDB.model';
import { BlogDto } from './dto/blog.dto';
import { PgQueryBlogsRepository } from '../../public/blogs/infrastructure/pg-query-blogs.repository';
import { ForbiddenGuard } from '../../../guards/forbidden.guard';
import { PostDto } from './dto/post.dto';
import { PgCommentsRepository } from '../../public/comments/infrastructure/pg-comments.repository';
import { ContentPageModel } from '../../../global-model/contentPage.model';
import { BlogViewModel } from '../../public/blogs/api/dto/blogView.model';
import { PostsService } from '../../public/posts/application/posts.service';
import { BlogsService } from '../../public/blogs/application/blogs.service';
import { PgQueryCommentsRepository } from '../../public/comments/infrastructure/pg-query-comments.repository';

@UseGuards(AuthBearerGuard)
@Controller('blogger/blogs')
export class BloggerBlogsController {
  constructor(
    protected blogsService: BlogsService,
    protected postsService: PostsService,
    protected queryBlogsRepository: PgQueryBlogsRepository,
    protected queryCommentsRepository: PgQueryCommentsRepository,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: QueryParametersDto,
    @User() user: UserDBModel,
  ): Promise<ContentPageModel> {
    console.log('getBlogs');
    const blogs = await this.queryBlogsRepository.getBlogs(query, user.id);

    return blogs
  }

  @Get('comments')
  getComments(@Query() query: QueryParametersDto, @User() user: UserDBModel) {
    return this.queryCommentsRepository.getComments(user.id, query);
  }

  @Post()
  @HttpCode(201)
  async createBlog(
    @Body() dto: BlogDto,
    @User() user: UserDBModel,
  ): Promise<BlogViewModel> {
    const createdBlog = await this.blogsService.createBlog(user.id, dto);

    if (!createdBlog) {
      throw new Error('Blog was not created');
    }

    return createdBlog;
  }

  @UseGuards(ForbiddenGuard)
  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostByBlogId(
    @Body() dto: PostDto,
    @Param('blogId') blogId: string,
  ) {
    const createdPost = await this.postsService.createPost(dto, blogId);

    return createdPost;
  }

  @UseGuards(ForbiddenGuard)
  @Put(':blogId')
  @HttpCode(204)
  async updateBlog(@Body() dto: BlogDto, @Param('blogId') blogId: string) {
    const result = await this.blogsService.updateBlog(blogId, dto);

    if (!result) {
      throw new NotFoundException();
    }

    return;
  }

  @UseGuards(ForbiddenGuard)
  @Put(':blogId/posts/:postId')
  @HttpCode(204)
  async updatePost(@Body() dto: PostDto, @Param('postId') postId: string) {
    const result = await this.postsService.updatePost(postId, dto);

    if (!result) {
      throw new NotFoundException();
    }

    return;
  }

  @UseGuards(ForbiddenGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(@Param('blogId') blogId: string) {
    const result = await this.blogsService.deleteBlog(blogId);

    if (!result) {
      throw new NotFoundException();
    }

    return;
  }

  @UseGuards(ForbiddenGuard)
  @Delete(':blogId/posts/:postId')
  @HttpCode(204)
  async deletePost(@Param('postId') postId: string) {
    const result = await this.postsService.deletePost(postId);

    if (!result) {
      throw new NotFoundException();
    }

    return;
  }
}
