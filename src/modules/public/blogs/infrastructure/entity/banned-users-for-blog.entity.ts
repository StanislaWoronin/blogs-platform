import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import { Users } from '../../../../super-admin/infrastructure/entity/users';
import { Blogs } from './blogs.entity';

@Entity()
export class BannedUsersForBlog {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  blogId: string;
  @ManyToOne(() => Blogs, (b) => b.bannedUsers)
  blog: Blogs;

  @Column()
  userId: string;
  @ManyToOne(() => Users, (u) => u.bannedForBlog)
  user: Users;

  @Column() banReason: string;

  @Column() banDate: string;
}
