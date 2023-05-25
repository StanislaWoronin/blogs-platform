import { NewestLikesModel } from './entity/newestLikes.model';

export interface IQueryReactionRepository {
  getCommentReaction(userId: string, commentId: string): Promise<string | null>;

  getPostReaction(userId: string, postId: string): Promise<string | null>;

  newestLikes(postId: string): Promise<NewestLikesModel[]>;
}

export const IQueryReactionRepository = 'IQueryReactionRepository';
