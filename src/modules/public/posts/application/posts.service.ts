import { Inject, Injectable } from '@nestjs/common';
import { ReactionModel } from '../../../../global-model/reaction.model';
import { PostDto } from '../../../blogger/api/dto/post.dto';
import { PostViewModel } from '../api/dto/postsView.model';
import { PostDBModel } from '../infrastructure/entity/post-db.model';
import { v4 as uuidv4 } from 'uuid';
import { toCreatedPostsViewModel } from '../../../../data-mapper/to-posts-view.model';
import { IBanInfoRepository } from '../../../super-admin/infrastructure/i-ban-info.repository';
import { IReactionsRepository } from '../../likes/infrastructure/i-reactions.repository';
import { IQueryReactionRepository } from '../../likes/infrastructure/i-query-reaction.repository';
import { IQueryPostsRepository } from '../infrastructure/i-query-posts.repository';
import { IPostsRepository } from '../infrastructure/i-posts.repository';
import {TelegramAdapter} from "../../../integrations/adapters/telegram.adapter";
import {IntegrationRepository} from "../../../integrations/infrastructure/integration.repository";
import {IBlogsRepository} from "../../blogs/infrastructure/i-blogs.repository";
import {IQueryBlogsRepository} from "../../blogs/infrastructure/i-query-blogs.repository";

@Injectable()
export class PostsService {
  constructor(
    @Inject(IBanInfoRepository) protected banInfoRepository: IBanInfoRepository,
    @Inject(IReactionsRepository)
    protected ReactionsRepository: IReactionsRepository,
    @Inject(IQueryReactionRepository)
    protected queryReactionsRepository: IQueryReactionRepository,
    @Inject(IPostsRepository) protected postsRepository: IPostsRepository,
    @Inject(IQueryPostsRepository)
    protected queryPostsRepository: IQueryPostsRepository,
    protected telegramAdapter: TelegramAdapter,
    protected integrationRepository: IntegrationRepository,
    @Inject(IQueryBlogsRepository) protected blogQueryRepository: IQueryBlogsRepository
  ) {}

  async checkUserBanStatus(userId: string, postId: string): Promise<boolean> {
    const blogId = await this.queryPostsRepository.getBlogIdByPostId(postId);

    return await this.banInfoRepository.youBanned(userId, blogId);
  }

  async createPost(
    dto: PostDto,
    blogId: string,
  ): Promise<PostViewModel | null> {
    const newPost = new PostDBModel(
      uuidv4(),
      dto.title,
      dto.shortDescription,
      dto.content,
      new Date().toISOString(),
      blogId,
    );

    const blogExist = await this.blogQueryRepository.getBlogName(blogId);
    const createdPost = await this.postsRepository.createPost(newPost);

    const telegramIds = await this.integrationRepository.getBlogSubscribers(blogId)
    const text = `New post published for ${blogExist} blog!`

    for (let id of telegramIds) {
      this.telegramAdapter.sendMessage(id, text);
    }

    return toCreatedPostsViewModel(createdPost);
  }

  async updatePostReaction(
    userId: string,
    postId: string,
    likeStatus: string,
  ): Promise<boolean> {
    const currentReaction = await this.queryReactionsRepository.getPostReaction(
      userId,
      postId,
    );

    if (!currentReaction) {
      if (likeStatus === ReactionModel.None) {
        return true;
      }

      return await this.ReactionsRepository.createPostReaction(
        userId,
        postId,
        likeStatus,
        new Date().toISOString(),
      );
    }

    if (likeStatus === ReactionModel.None) {
      return await this.ReactionsRepository.deletePostReaction(userId, postId);
    }

    return await this.ReactionsRepository.updatePostReaction(
      userId,
      postId,
      likeStatus,
      new Date().toISOString(),
    );
  }

  async updatePost(postId: string, dto: PostDto): Promise<boolean> {
    return await this.postsRepository.updatePost(postId, dto);
  }

  async deletePost(postId: string): Promise<boolean> {
    return await this.postsRepository.deletePost(postId);
  }
}
