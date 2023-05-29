import {Injectable} from '@nestjs/common';
import {S3FileStorageAdapter} from '../adapter/s3-file-storage.adapter';
import {ImageType} from '../imageType';
import sharp from 'sharp';
import {DataSource} from 'typeorm';
import {BlogImagesInfo} from '../api/views';
import {BlogImage} from "../blog-image.entity";
import {PostImage} from "../post-image.entity";

@Injectable()
export class UploadPostMainImageUseCase {
  constructor(
    private s3FileStorageAdapter: S3FileStorageAdapter,
    private dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    blogId: string,
    postId: string,
    imageBuffer: Buffer,
    originalName: string,
  ): Promise<BlogImagesInfo> {
    const images = await this.dataSource.query(this.getPostMainImagesQuery(), [
      postId
    ])

    if (images.length) {
      let deletedImagesPromise = []
      for (let image of images) {
        const deleteImage = this.s3FileStorageAdapter.deleteImage(image.url)
        deletedImagesPromise.push(deleteImage)
      }
      const deleteInBd = this.dataSource.getRepository(PostImage).delete({postId: postId})

      await Promise.all([...deletedImagesPromise, deleteInBd])
    }

    const original = imageBuffer
    const middle = sharp(imageBuffer).resize(300, 180)
    const small = sharp(imageBuffer).resize(149, 96)
    const mainImages = [original, middle, small]



    for (let key of mainImages) {
      const { url, imageId } = await this.s3FileStorageAdapter.saveImage(
          userId,
          blogId,
          imageBuffer,
          `${originalName}-key`,
          ImageType.Main,
          postId
      );

    }


    const { size, width, height } = await sharp(imageBuffer).metadata();
    const image = PostImage.create(
      imageId,
      postId,
      ImageType.Main,
      url,
      width,
      height,
      size,
    );

    await this.dataSource.getRepository(BlogImage).save(image);
    const [blogImagesInfo]: BlogImagesInfo[] = await this.dataSource.query(
      this.getBlogImagesInfoQuery(),
      [blogId],
    );

    return BlogImagesInfo.relativeToAbsoluteUrl(blogImagesInfo);
  }

  private getPostMainImagesQuery = (): string => {
    return `
      SELECT "imageId", url
        FROM post_image
       WHERE "postId" = $1;
    `;
  }

  private getBlogImagesInfoQuery = (): string => {
    return `
      SELECT 
        (
          SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
            FROM post_image 
           WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = $1
        ) AS wallpaper,
        COALESCE((
          SELECT JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize"))
            FROM post_image 
           WHERE "imageType" = '${ImageType.Main}' AND "blogId" = $1
        ), '[]') AS main;
    `;
  };
}
