import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Users } from '../../../../super-admin/infrastructure/entity/users';
import { BannedUsersForBlog } from './banned-users-for-blog.entity';
import { Posts } from '../../../posts/infrastructure/entity/posts.entity';
import { BannedBlog } from '../../../../super-admin/infrastructure/entity/banned_blog.entity';

@Entity()
export class Blogs {
  @PrimaryColumn('uuid') id: string;

  @Column({
    type: "character varying",
    length: 15,
    nullable: false,
    collation: "C"
  })
  name: string;

  @Column() description: string;

  @Column() websiteUrl: string;

  @Column() createdAt: string;

  @Column({default: false}) isMembership: boolean;

  @ManyToOne(() => Users, (u) => u.blogs)
  @JoinColumn()
  user: Users;
  @Column() userId: string;

  @OneToMany(() => BannedUsersForBlog, (bu) => bu.blog)
  bannedUsers: BannedUsersForBlog[];

  @OneToMany(() => Posts, (p) => p.blog)
  posts: Posts;

  @OneToOne(() => BannedBlog, (bb) => bb.blog)
  isBanned: BannedBlog;
}
