import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode, Inject,
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
import { PgQueryPostsRepository } from '../infrastructure/pg.repository/pg-query-posts.repository';
import { JwtService } from '../../auth/application/jwt.service';
import { PgQueryCommentsRepository } from '../../comments/infrastructure/pg-repository/pg-query-comments.repository';
import { AccessTokenValidationGuard } from "../../../../guards/access-token-validation.guard";
import {IQueryCommentsRepository} from "../../comments/infrastructure/i-query-comments.repository";
import { IQueryPostsRepository } from "../infrastructure/i-query-posts.repository";

@Controller('posts')
export class PostsController {
  constructor(
    protected commentsService: CommentsService,
    protected jwtService: JwtService,
    protected postsService: PostsService,
    @Inject(IQueryCommentsRepository) protected queryCommentsRepository: IQueryCommentsRepository,
    @Inject(IQueryPostsRepository) protected queryPostsRepository: IQueryPostsRepository,
  ) {}

  @UseGuards(AccessTokenValidationGuard)
  @Get()
  async getPosts(@Query() query: QueryParametersDto, @User() user: UserDBModel) {
    let blogId = undefined;
    let userId;
    if (user) {
      userId = user.id;
    }

    return this.queryPostsRepository.getPosts(query, blogId, userId);
  }

  @Get(':id')
  async getPostById(@Param('id') postId: string, @Req() req: Request) {
    let userId = undefined;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const tokenPayload = await this.jwtService.getTokenPayload(token);
      userId = tokenPayload.userId;
    }

    const post = await this.queryPostsRepository.getPostById(postId, userId);

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  @UseGuards(AccessTokenValidationGuard)
  @Get(':id/comments')
  async getCommentsByPostId(
    @Query() query: QueryParametersDto,
    @Param('id') postId: string,
    @User() user: UserDBModel
  ) {
    let userId;
    if (user) {
      userId = user.id;
    }

    const comment = await this.queryCommentsRepository.getCommentByPostId(
      query,
      postId,
      userId,
    );

    if (!comment) {
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
    console.log('post exist --->', post);
    if (!post) {
      throw new NotFoundException();
    }

    const banStatus = await this.postsService.checkUserBanStatus(
      user.id,
      postId,
    );
    if (banStatus) {
      throw new ForbiddenException();
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

    const banStatus = await this.postsService.checkUserBanStatus(
        user.id,
        postId,
    );
    if (banStatus) {
      throw new ForbiddenException();
    }

    await this.postsService.updatePostReaction(user.id, postId, dto.likeStatus);

    return;
  }
}
