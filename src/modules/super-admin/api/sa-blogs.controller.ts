import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthBasicGuard } from '../../../guards/auth.basic.guard';
import { QueryParametersDto } from '../../../global-model/query-parameters.dto';
import { BanBlogDto } from './dto/ban-blog.dto';
import { SaBlogsService } from '../application/sa-blogs.service';
import { BindBlogDto } from './dto/bind-blog.dto';
import { ContentPageModel } from '../../../global-model/contentPage.model';
import { IQueryBlogsRepository } from '../../public/blogs/infrastructure/i-query-blogs.repository';

@UseGuards(AuthBasicGuard)
@Controller('sa/blogs')
export class SaBlogsController {
  constructor(
    @Inject(IQueryBlogsRepository)
    protected queryBlogsRepository: IQueryBlogsRepository,
    protected blogsService: SaBlogsService,
  ) {}

  @Get()
  async getBlogs(
    @Query()
    query: QueryParametersDto,
  ): Promise<ContentPageModel> {
    return await this.queryBlogsRepository.saGetBlogs(query);
  }

  @Put(':id/ban')
  @HttpCode(204)
  async updateBlogStatus(@Body() dto: BanBlogDto, @Param('id') blogId: string) {
    return await this.blogsService.updateBlogBanStatus(blogId, dto.isBanned);
  }

  @Put(':id/bind-with-user/:userId')
  async bindBlog(@Param() params: BindBlogDto) {
    return await this.blogsService.bindBlog(params);
  }
}
