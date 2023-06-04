import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ImageType } from './imageType';
import { Blogs } from '../public/blogs/infrastructure/entity/blogs.entity';
import { join } from 'path';
import { settings } from '../../settings';
import { BlogImagesInfo } from './api/views';
import { Image } from './image.entity';
import { randomUUID } from 'crypto';

@Entity()
export class BlogImage extends Image {
  @ManyToOne(() => Blogs, (b) => b.images)
  @JoinColumn()
  blog: Blogs;
  @Column() blogId: string;

  static create(
    blogId: string,
    imageType: ImageType,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ) {
    return {
      imageId: randomUUID(),
      blogId,
      imageType,
      url,
      width,
      height,
      fileSize,
    };
  }
}
