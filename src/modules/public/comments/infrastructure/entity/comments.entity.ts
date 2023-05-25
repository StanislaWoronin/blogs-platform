import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Users } from '../../../../super-admin/infrastructure/entity/users.entity';
import { Posts } from '../../../posts/infrastructure/entity/posts.entity';
import { CommentReactions } from '../../../likes/infrastructure/entity/comment-reactions.entity';
import { BannedComment } from '../../../../super-admin/infrastructure/entity/banned-comment.entity';

@Entity()
export class Comments {
  @PrimaryColumn('uuid') id: string;

  @Column() content: string;

  @Column() createdAt: string;

  @ManyToOne(() => Posts, (p) => p.comments)
  @JoinColumn()
  post: Posts;
  @Column() postId: string;

  @ManyToOne(() => Users, (u) => u.comments)
  @JoinColumn()
  user: Users;
  @Column() userId: string;

  @OneToMany(() => CommentReactions, (r) => r.comment)
  reactions: CommentReactions[];

  @OneToOne(() => BannedComment, (c) => c.comment)
  banStatus: BannedComment;
}
