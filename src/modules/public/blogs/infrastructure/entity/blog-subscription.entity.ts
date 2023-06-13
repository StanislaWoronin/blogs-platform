import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blogs } from './blogs.entity';
import { Users } from '../../../../super-admin/infrastructure/entity/users.entity';

@Entity()
export class BlogSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Blogs, (b) => b.subscriptions)
  @JoinColumn()
  blog: Blogs;
  @Column() blogId: string;

  @ManyToOne(() => Users, (u) => u.subscriptions)
  @JoinColumn()
  user: Users;
  @Column() userId: string;

  @Column()
  isActive = true;

  @Column()
  createdAt: string = new Date().toISOString();

  static create(userId: string, blogId: string) {
    const blogSubscription = new BlogSubscription();
    blogSubscription.userId = userId;
    blogSubscription.blogId = blogId;

    return blogSubscription;
  }
}
