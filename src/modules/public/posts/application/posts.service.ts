import {Inject, Injectable} from '@nestjs/common';
import { PgLikesRepository } from '../../likes/infrastructure/pg-likes.repository';
import { ReactionModel } from '../../../../global-model/reaction.model';
import { PostDto } from '../../../blogger/api/dto/post.dto';
import { PostViewModel } from '../api/dto/postsView.model';
import { PostDBModel } from '../infrastructure/entity/post-db.model';
import { v4 as uuidv4 } from 'uuid';
import { PgPostsRepository } from '../infrastructure/pg-posts.repository';
import {
  toCreatedPostsViewModel,
} from '../../../../data-mapper/to-posts-view.model';
import {PgQueryPostsRepository} from "../infrastructure/pg-query-posts.repository";
import {IBanInfoRepository} from "../../../super-admin/infrastructure/i-ban-info.repository";

@Injectable()
export class PostsService {
  constructor(
    @Inject(IBanInfoRepository) protected banInfoRepository: IBanInfoRepository,
    protected likesRepository: PgLikesRepository,
    protected postsRepository: PgPostsRepository,
    protected queryPostRepository: PgQueryPostsRepository
  ) {}

  async checkUserBanStatus(userId: string, postId: string): Promise<boolean> {
    const blogId = await this.queryPostRepository.getBlogIdByPostId(postId)

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

    const createdPost = await this.postsRepository.createPost(newPost);

    return toCreatedPostsViewModel(createdPost);
  }

  async updatePostReaction(
    userId: string,
    postId: string,
    likeStatus: string,
  ): Promise<boolean> {
    const currentReaction = await this.likesRepository.getPostReaction(
      userId,
      postId,
    );
    if (!currentReaction) {
      if (likeStatus === ReactionModel.None) {
        return true;
      }

      return await this.likesRepository.createPostReaction(
        userId,
        postId,
        likeStatus,
        new Date().toISOString(),
      );
    }

    if (likeStatus === ReactionModel.None) {
      return await this.likesRepository.deletePostReaction(userId, postId);
    }

    return await this.likesRepository.updatePostReaction(
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
