import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Security } from '../../../public/security/infrastructure/entity/security';
import { EmailConfirmation } from './email-confirmation.entity';
import { Blogs } from '../../../public/blogs/infrastructure/entity/blogs.entity';
import { BannedUsersForBlog } from '../../../public/blogs/infrastructure/entity/banned-users-for-blog.entity';
import { Comments } from '../../../public/comments/infrastructure/entity/comments.entity';
import { CommentReactions } from '../../../public/likes/infrastructure/entity/comment-reactions.entity';
import { PostReactions } from '../../../public/likes/infrastructure/entity/post-reactions.entity';
import { UserBanInfo } from './user-ban-info.entity';
import { BlogSubscription } from '../../../public/blogs/infrastructure/entity/blog-subscription.entity';

@Entity()
export class Users {
  @PrimaryColumn('uuid') id: string;

  @Column({
    type: 'character varying',
    length: 15,
    nullable: false,
    collation: 'C',
  })
  login: string;

  @Column() email: string;

  @Column() passwordSalt: string;

  @Column() passwordHash: string;

  @Column() createdAt: string;

  @OneToOne(() => UserBanInfo, (bi) => bi.user)
  banInfo: UserBanInfo;

  @OneToMany(() => Security, (s) => s.user)
  security: Security[];

  @OneToOne(() => EmailConfirmation, (ec) => ec.user)
  emailConfirmation: EmailConfirmation;

  @OneToMany(() => Blogs, (b) => b.user)
  blogs: Blogs[];

  @OneToMany(() => BannedUsersForBlog, (bu) => bu.user)
  bannedForBlog: BannedUsersForBlog[];

  @OneToMany(() => Comments, (c) => c.user)
  comments: Comments[];

  @OneToMany(() => CommentReactions, (r) => r.user)
  cReactions: CommentReactions[];

  @OneToMany(() => CommentReactions, (r) => r.user)
  pReactions: PostReactions[];

  @OneToMany(() => BlogSubscription, (bs) => bs.user)
  subscriptions: BlogSubscription[];
}
