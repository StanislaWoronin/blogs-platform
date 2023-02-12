import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReactionModel } from './reaction.model';

export class ReactionDto {
  @IsNotEmpty()
  @IsEnum(ReactionModel)
  likeStatus: ReactionModel;
}
