import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import { IQueryBlogsRepository } from '../infrastructure/i-query-blogs.repository';
import { IQueryPostsRepository } from '../../posts/infrastructure/i-query-posts.repository';
import { AccessTokenValidationGuard } from '../../../../guards/access-token-validation.guard';
import { User } from '../../../../decorator/user.decorator';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { SubscribeToBlogUseCase } from '../use-cases/subscribe-to-blog.use-case';
import { UnsubscribeToBlogUseCase } from '../use-cases/unsubscribe-to-blog.use-case';
import { AuthBearerGuard } from '../../../../guards/auth.bearer.guard';

@Controller('blogs')
export class BlogsController {
  constructor(
    @Inject(IQueryBlogsRepository)
    protected queryBlogsRepository: IQueryBlogsRepository,
    @Inject(IQueryPostsRepository)
    protected queryPostsRepository: IQueryPostsRepository,
    private subscribeToBlogUseCase: SubscribeToBlogUseCase,
    private unsubscribeToBlogUseCase: UnsubscribeToBlogUseCase,
  ) {}

  @Get()
  @UseGuards(AccessTokenValidationGuard)
  async getBlogs(
    @Query()
    query: QueryParametersDto,
    @User() user: UserDBModel,
  ) {
    try {
      return await this.queryBlogsRepository.getBlogs(query, user?.id);
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  @UseGuards(AccessTokenValidationGuard)
  async getBlogById(@Param('id') blogId: string, @User() user: UserDBModel) {
    const blog = await this.queryBlogsRepository.getBlog(blogId, user?.id);

    if (!blog) {
      throw new NotFoundException();
    }

    return blog;
  }

  @UseGuards(AccessTokenValidationGuard)
  @Get(':id/posts')
  async getPostsByBlogId(
    @Query() query: QueryParametersDto,
    @Param('id') blogId: string,
    @User() user: UserDBModel,
  ) {
    let userId;
    if (user) {
      userId = user.id;
    }

    const post = await this.queryBlogsRepository.blogExist(blogId);

    if (!post) {
      throw new NotFoundException();
    }

    return this.queryPostsRepository.getPosts(query, blogId, userId);
  }

  @Post(':blogId/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthBearerGuard)
  async subscribeToBlog(
    @Param('blogId') blogId: string,
    @User() user: UserDBModel,
  ) {
    return await this.subscribeToBlogUseCase.execute(user.id, blogId);
  }

  @Delete(':blogId/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthBearerGuard)
  async unsubscribeToBlog(
    @Param('blogId') blogId: string,
    @User() user: UserDBModel,
  ) {
    await this.unsubscribeToBlogUseCase.execute(user.id, blogId);
  }
}
