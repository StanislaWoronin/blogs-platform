import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ImageType } from './imageType';
import { Blogs } from '../public/blogs/infrastructure/entity/blogs.entity';
import {join} from "path";
import {settings} from "../../settings";
import {BlogImagesInfo} from "./api/views";

@Entity()
export class Image {
  @PrimaryColumn()
  imageId: string;

  @ManyToOne(() => Blogs, (b) => b.images)
  @JoinColumn()
  blog: Blogs;
  @Column() blogId: string;

  @Column()
  imageType: ImageType;

  @Column()
  url: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column()
  fileSize: number;

  static create(
    imageId: string,
    blogId: string,
    imageType: ImageType,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ) {

    return {
      imageId,
      blogId,
      imageType,
      url,
      width,
      height,
      fileSize,
    };
  }
}
