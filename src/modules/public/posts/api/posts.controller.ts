import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from '../../comments/application/comments.service';
import { PostsService } from '../application/posts.service';
import { CommentDTO } from '../../comments/api/dto/commentDTO';
import { Request } from 'express';
import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import { AuthBearerGuard } from '../../../../guards/auth.bearer.guard';
import { User } from '../../../../decorator/user.decorator';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { ReactionDto } from '../../../../global-model/reaction.dto';
import { PgQueryPostsRepository } from '../infrastructure/pg-query-posts.repository';
import { JwtService } from '../../auth/application/jwt.service';
import { PgLikesRepository } from '../../likes/infrastructure/pg-likes.repository';
import { PgQueryCommentsRepository } from '../../comments/infrastructure/pg-query-comments.repository';

@Controller('posts')
export class PostsController {
  constructor(
    protected commentsService: CommentsService,
    protected jwtService: JwtService,
    protected postsService: PostsService,
    protected queryCommentsRepository: PgQueryCommentsRepository,
    protected queryPostsRepository: PgQueryPostsRepository,
  ) {}

  @Get()
  async getPosts(@Query() query: QueryParametersDto, @Req() req: Request) {
    let userId;
    if (req.headers.authorization) {
      const tokenPayload = await this.jwtService.getTokenPayload(
        req.headers.authorization,
      );
      userId = tokenPayload.userId;
    }

    return this.queryPostsRepository.getPosts(query, userId);
  }

  @Get(':id')
  async getPostById(@Param('id') postId: string, @Req() req: Request) {
    let userId = undefined;
    if (req.headers.authorization) {
      const tokenPayload = await this.jwtService.getTokenPayload(
        req.headers.authorization,
      );
      userId = tokenPayload.userId;
    }

    const post = await this.queryPostsRepository.getPostById(postId, userId);

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  @Get(':id/comments')
  async getCommentsByPostId(
    @Query() query: QueryParametersDto,
    @Param('id') postId: string,
    @Req() req: Request,
  ) {
    let userId = undefined;
    if (req.headers.authorization) {
      const tokenPayload = await this.jwtService.getTokenPayload(
        req.headers.authorization,
      );
      userId = tokenPayload.userId;
    }

    const comment = await this.queryCommentsRepository.getCommentByPostId(
      query,
      postId,
      userId,
    );

    if (!comment.items.length) {
      throw new NotFoundException();
    }

    return comment;
  }

  @Post('/:id/comments')
  @HttpCode(201)
  @UseGuards(AuthBearerGuard)
  async createComment(
    @Body() dto: CommentDTO,
    @Param('id') postId: string,
    @User() user: UserDBModel,
  ) {
    const post = await this.queryPostsRepository.postExist(postId);

    if (!post) {
      throw new NotFoundException();
    }

    const banStatus = await this.postsService.checkUserBanStatus(
      user.id,
      postId,
    );

    if (banStatus) {
      throw new ForbiddenException(); // if user banned for this blog
    }

    return this.commentsService.createComment(postId, dto.content, user);
  }

  @Put(':id/like-status')
  @HttpCode(204)
  @UseGuards(AuthBearerGuard)
  async updateLikeStatus(
    @Body() dto: ReactionDto,
    @Param('id') postId: string,
    @User() user: UserDBModel,
  ) {
    const post = await this.queryPostsRepository.postExist(postId);

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsService.updatePostReaction(user.id, postId, dto.likeStatus);

    return;
  }
}
