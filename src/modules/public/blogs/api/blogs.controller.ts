import {
  Controller,
  Get, Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import { PgQueryBlogsRepository } from '../infrastructure/pg-repository/pg-query-blogs.repository';
import { PgQueryPostsRepository } from '../../posts/infrastructure/pg.repository/pg-query-posts.repository';
import { OrmQueryBlogsRepository } from '../infrastructure/orm-repository/orm-query-blogs.repository';
import {IQueryBlogsRepository} from "../infrastructure/i-query-blogs.repository";
import { IQueryPostsRepository } from "../../posts/infrastructure/i-query-posts.repository";

@Controller('blogs')
export class BlogsController {
  constructor(
    @Inject(IQueryBlogsRepository) protected queryBlogsRepository: IQueryBlogsRepository,
    @Inject(IQueryPostsRepository) protected queryPostsRepository: IQueryPostsRepository,
  ) {}

  @Get()
  async getBlogs(
    @Query()
    query: QueryParametersDto,
  ) {
    try {
      return await this.queryBlogsRepository.getBlogs(query);
    } catch (e) {
      console.log(e);
    }
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

    return this.queryPostsRepository.getPostsForBlog(query, blogId);
  }
}
