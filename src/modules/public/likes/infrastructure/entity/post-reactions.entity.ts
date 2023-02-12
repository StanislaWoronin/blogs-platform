import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Users } from '../../../../super-admin/infrastructure/entity/users';
import { Posts } from '../../../posts/infrastructure/entity/posts.entity';

@Entity()
export class PostReactions {
  @Column() status: string;

  @Column() addedAt: string;

  @ManyToOne(() => Users, (u) => u.pReactions)
  @JoinColumn()
  user: Users;
  @PrimaryColumn() userId: string;

  @ManyToOne(() => Posts, (c) => c.reactions)
  @JoinColumn()
  post: Posts;
  @Column() postId: string;
}
