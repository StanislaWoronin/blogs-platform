import {Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn} from 'typeorm';
import { Users } from '../../../../super-admin/infrastructure/entity/users';
import { Posts } from '../../../posts/infrastructure/entity/posts.entity';

@Entity()
export class PostReactions {
  @PrimaryGeneratedColumn() id: number

  @Column() status: string;

  @Column() addedAt: string;

  @ManyToOne(() => Users, (u) => u.pReactions)
  @JoinColumn()
  user: Users;
  @Column() userId: string;

  @ManyToOne(() => Posts, (c) => c.reactions)
  @JoinColumn()
  post: Posts;
  @Column() postId: string;
}
