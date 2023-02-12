import { Injectable } from '@nestjs/common';
import { PgBanInfoRepository } from '../../../super-admin/infrastructure/pg-ban-info.repository';
import { PgLikesRepository } from '../../likes/infrastructure/pg-likes.repository';
import { ReactionModel } from '../../../../global-model/reaction.model';
import { PostDto } from '../../../blogger/api/dto/post.dto';
import { PostViewModel } from '../api/dto/postsView.model';
import { PostDBModel } from '../infrastructure/entity/post-db.model';
import { v4 as uuidv4 } from 'uuid';
import { PgPostsRepository } from '../infrastructure/pg-posts.repository';
import { toCreatedPostsViewModel, toPostsViewModel } from "../../../../data-mapper/to-posts-view.model";

@Injectable()
export class PostsService {
  constructor(
    protected banInfoRepository: PgBanInfoRepository,
    protected likesRepository: PgLikesRepository,
    protected postsRepository: PgPostsRepository,
  ) {}

  async checkUserBanStatus(userId: string, postId: string): Promise<boolean> {
    return await this.banInfoRepository.youBanned(userId, postId);
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

    return toCreatedPostsViewModel(createdPost)
  }

  async updatePostReaction(userId, postId, likeStatus): Promise<boolean> {
    if (likeStatus === ReactionModel.None) {
      return await this.likesRepository.deleteReaction(userId, postId);
    }

    const addedAt = new Date().toISOString();

    return await this.likesRepository.updatePostReaction(
      userId,
      postId,
      likeStatus,
      addedAt,
    );
  }

  async updatePost(postId: string, dto: PostDto): Promise<boolean> {
    return await this.postsRepository.updatePost(postId, dto);
  }

  async deletePost(postId: string): Promise<boolean> {
    return await this.postsRepository.deletePost(postId);
  }
}
