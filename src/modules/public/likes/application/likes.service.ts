import { Inject, Injectable } from '@nestjs/common';
import { PgLikesRepository } from '../infrastructure/pg-likes.repository';

@Injectable()
export class LikesService {
  constructor(protected likesRepository: PgLikesRepository) {}

  // async getReactionAndReactionCount(id: string, userId: string) {
  //   let reaction = 'None';
  //   if (userId) {
  //     const result = await this.likesRepository.getUserReaction(id, userId);
  //     if (result) {
  //       reaction = result.status;
  //     }
  //   }
  //
  //   const likesCount = await this.likesRepository.getLikeReactionsCount(id);
  //   const dislikesCount = await this.likesRepository.getDislikeReactionsCount(
  //     id,
  //   );
  //
  //   return { reaction, likesCount, dislikesCount };
  // }
}
