import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthBearerGuard } from '../../../guards/auth.bearer.guard';
import { ForbiddenGuard } from '../../../guards/forbidden.guard';
import { QueryParametersDto } from '../../../global-model/query-parameters.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { BloggerBlogService } from '../application/blogger-blogs.service';
import { PgQueryUsersRepository } from '../../super-admin/infrastructure/pg-query-users.repository';

@UseGuards(AuthBearerGuard, ForbiddenGuard)
@Controller('blogger/users')
export class BloggerUsersController {
  constructor(
    protected blogsService: BloggerBlogService,
    protected queryUsersRepository: PgQueryUsersRepository,
  ) {}

  @Get('blog/:id')
  async getBannedUsers(
    @Query() query: QueryParametersDto,
    @Param('id') blogId: string,
  ) {
    const result = await this.queryUsersRepository.getBannedUsers(
      blogId,
      query,
    );

    if (!result) {
      throw new NotFoundException();
    }

    return result;
  }

  @UseGuards(ForbiddenGuard)
  @Put(':id/ban')
  @HttpCode(204)
  async updateUserBanStatus(
    @Body() dto: BanUserDto,
    @Param('id') userId: string,
  ) {
    const result = await this.blogsService.updateUserBanStatus(userId, dto);

    if (!result) {
      throw new NotFoundException();
    }

    return result;
  }
}
