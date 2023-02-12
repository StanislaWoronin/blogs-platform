import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  NotImplementedException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from '../application/comments.service';
import { CommentDTO } from './dto/commentDTO';
import { Request } from 'express';
import { AuthBearerGuard } from '../../../../guards/auth.bearer.guard';
import { User } from '../../../../decorator/user.decorator';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { ReactionDto } from '../../../../global-model/reaction.dto';

@Controller('comments')
export class CommentsController {
  constructor(protected commentsService: CommentsService) {}

  // @Get(':id')
  // async getCommentById(@Param('id') commentId: string, @Req() req: Request) {
  //   const comment = await this.commentsService.getCommentById(
  //     commentId,
  //     req.headers.authorization,
  //   );
  //
  //   if (!comment) {
  //     throw new NotFoundException();
  //   }
  //
  //   return comment;
  // }
  //
  // @Put(':id')
  // @HttpCode(204)
  // @UseGuards(AuthBearerGuard)
  // async updateCommentById(
  //   @Body() dto: CommentDTO,
  //   @Param('id') commentId: string,
  //   @User() user: UserDBModel,
  // ) {
  //   const comment = await this.commentsService.getCommentById(commentId);
  //
  //   if (!comment) {
  //     throw new NotFoundException();
  //   }
  //
  //   if (comment.userId !== user.id) {
  //     throw new ForbiddenException(); //	If try edit the comment that is not your own
  //   }
  //
  //   const isUpdate = await this.commentsService.updateComment(
  //     commentId,
  //     dto.content,
  //   );
  //
  //   if (!isUpdate) {
  //     throw new NotFoundException();
  //   }
  //
  //   return await this.commentsService.getCommentById(commentId);
  // }
  //
  // @Put(':id/like-status')
  // @HttpCode(204)
  // @UseGuards(AuthBearerGuard)
  // async updateLikeStatus(
  //   @Body() dto: ReactionDto,
  //   @Param('id') commentId: string,
  //   @User() user: UserDBModel,
  // ) {
  //   const comment = await this.commentsService.getCommentById(commentId);
  //
  //   if (!comment) {
  //     throw new NotFoundException();
  //   }
  //
  //   const result = await this.commentsService.updateLikesInfo(
  //     user.id,
  //     commentId,
  //     dto.likeStatus,
  //   );
  //
  //   if (!result) {
  //     throw new NotImplementedException();
  //   }
  //
  //   return;
  // }
  //
  // @Delete(':id')
  // @HttpCode(204)
  // @UseGuards(AuthBearerGuard)
  // async deleteCommentById(
  //   @Param('id') commentId: string,
  //   @User() user: UserDBModel,
  // ) {
  //   const comment = await this.commentsService.getCommentById(commentId);
  //
  //   if (!comment) {
  //     throw new NotFoundException();
  //   }
  //
  //   if (comment.userId !== user.id) {
  //     throw new ForbiddenException(); //	If try edit the comment that is not your own
  //   }
  //
  //   const isDeleted = await this.commentsService.deleteCommentById(commentId);
  //
  //   if (!isDeleted) {
  //     throw new NotFoundException();
  //   }
  //
  //   return;
  // }
}
