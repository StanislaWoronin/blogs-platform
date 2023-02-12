import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany, OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Blogs } from '../../../blogs/infrastructure/entity/blogs.entity';
import { Comments } from '../../../comments/infrastructure/entity/comments.entity';
import { PostReactions } from '../../../likes/infrastructure/entity/post-reactions.entity';
import {BannedPost} from "../../../../super-admin/infrastructure/entity/banned-post.entity";

@Entity()
export class Posts {
  @PrimaryColumn('uuid') id: string;

  @Column() title: string;

  @Column() shortDescription: string;

  @Column() content: string;

  @Column() createdAt: string;

  @ManyToOne(() => Blogs, (b) => b.posts)
  @JoinColumn()
  blog: Blogs;
  @Column() blogId: string;

  @OneToMany(() => Comments, (c) => c.post)
  comments: Comments[];

  @OneToMany(() => PostReactions, (pr) => pr.post)
  reactions: PostReactions;

  @OneToOne(() => BannedPost, bp => bp.post)
  banStatus: BannedPost
}
