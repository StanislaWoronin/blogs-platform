import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode, Inject,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from '../application/comments.service';
import { CommentDTO } from './dto/commentDTO';
import { AuthBearerGuard } from '../../../../guards/auth.bearer.guard';
import { User } from '../../../../decorator/user.decorator';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { ReactionDto } from '../../../../global-model/reaction.dto';
import { AccessTokenValidationGuard } from '../../../../guards/access-token-validation.guard';
import {IQueryCommentsRepository} from "../infrastructure/i-query-comments.repository";

@Controller('comments')
export class CommentsController {
  constructor(
    protected commentsService: CommentsService,
    @Inject(IQueryCommentsRepository) protected queryCommentsRepository: IQueryCommentsRepository,
  ) {}

  @UseGuards(AccessTokenValidationGuard)
  @Get(':id')
  async getCommentById(
    @Param('id') commentId: string,
    @User() user: UserDBModel,
  ) {
    let userId;
    if (user) {
      userId = user.id;
    }

    const comment = await this.queryCommentsRepository.getCommentById(
      commentId,
      userId,
    );

    if (!comment) {
      throw new NotFoundException();
    }

    return comment;
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(AuthBearerGuard)
  async updateCommentById(
    @Body() dto: CommentDTO,
    @Param('id') commentId: string,
    @User() user: UserDBModel,
  ) {
    const comment = await this.queryCommentsRepository.commentExists(commentId);

    if (!comment) {
      throw new NotFoundException();
    }

    if (comment.userId !== user.id) {
      throw new ForbiddenException();
    }

    const isUpdate = await this.commentsService.updateComment(
      commentId,
      dto.content,
    );

    if (!isUpdate) {
      Error('Something went wrong.');
    }
    return;
  }

  @Put(':id/like-status')
  @HttpCode(204)
  @UseGuards(AuthBearerGuard)
  async updateLikeStatus(
    @Body() dto: ReactionDto,
    @Param('id') commentId: string,
    @User() user: UserDBModel,
  ) {
    const comment = await this.queryCommentsRepository.commentExists(commentId);
    if (!comment) {
      throw new NotFoundException();
    }

    const banStatus = await this.commentsService.checkUserBanStatus(user.id, commentId)
    if (banStatus) {
      throw new ForbiddenException();
    }

    const result = await this.commentsService.updateReaction(
      user.id,
      commentId,
      dto.likeStatus,
    );

    if (!result) {
      Error('Something went wrong.');
    }

    return;
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthBearerGuard)
  async deleteCommentById(
    @Param('id') commentId: string,
    @User() user: UserDBModel,
  ) {
    const comment = await this.queryCommentsRepository.commentExists(commentId);
    if (!comment) {
      throw new NotFoundException();
    }

    if (comment.userId !== user.id) {
      throw new ForbiddenException();
    }

    const isDeleted = await this.commentsService.deleteCommentById(commentId);
    if (!isDeleted) {
      Error('Something went wrong.');
    }
    return;
  }
}
