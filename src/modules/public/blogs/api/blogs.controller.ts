import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import { PgQueryBlogsRepository } from '../infrastructure/pg-query-blogs.repository';
import { PgQueryPostsRepository } from '../../posts/infrastructure/pg-query-posts.repository';

@Controller('blogs')
export class BlogsController {
  constructor(
    protected queryBlogsRepository: PgQueryBlogsRepository,
    protected queryPostsRepository: PgQueryPostsRepository,
  ) {}

  @Get()
  async getBlogs(
    @Query()
    query: QueryParametersDto,
  ) {
    return this.queryBlogsRepository.getBlogs(query);
  }

  @Get(':id')
  async getBlogById(@Param('id') blogId: string) {
    const blog = await this.queryBlogsRepository.getBlog(blogId);

    if (!blog) {
      throw new NotFoundException();
    }

    return blog;
  }

  @Get(':id/posts')
  async getPostsByBlogId(
    @Query() query: QueryParametersDto,
    @Param('id') blogId: string,
  ) {
    const post = await this.queryBlogsRepository.getBlog(blogId);

    if (!post) {
      throw new NotFoundException();
    }

    return this.queryPostsRepository.getPostsForBlog(
      query,
      blogId,
    );
  }
}
