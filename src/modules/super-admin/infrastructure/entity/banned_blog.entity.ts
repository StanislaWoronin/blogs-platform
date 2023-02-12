import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Blogs } from '../../../public/blogs/infrastructure/entity/blogs.entity';

@Entity()
export class BannedBlog {
  @PrimaryColumn()
  blogId: string;
  @OneToOne(() => Blogs, (b) => b.isBanned)
  @JoinColumn()
  blog: Blogs;

  @Column()
  banDate: string;
}
