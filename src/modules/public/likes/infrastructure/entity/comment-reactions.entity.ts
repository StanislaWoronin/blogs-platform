import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../../../super-admin/infrastructure/entity/users.entity';
import { Comments } from '../../../comments/infrastructure/entity/comments.entity';

@Entity()
export class CommentReactions {
  @PrimaryGeneratedColumn() id: number;

  @Column() status: string;

  @Column() addedAt: string;

  @ManyToOne(() => Users, (u) => u.cReactions)
  @JoinColumn()
  user: Users;
  @Column() userId: string;

  @ManyToOne(() => Comments, (c) => c.reactions)
  @JoinColumn()
  comment: Comments;
  @PrimaryColumn() commentId: string;
}
