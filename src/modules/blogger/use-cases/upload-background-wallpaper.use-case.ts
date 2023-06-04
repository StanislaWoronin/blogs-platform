import { Injectable } from '@nestjs/common';
import { S3FileStorageAdapter } from '../adapter/s3-file-storage.adapter';
import { ImageType } from '../imageType';
import sharp from 'sharp';
import { DataSource } from 'typeorm';
import { BlogImagesInfo } from '../api/views';
import { BlogImage } from '../blog-image.entity';

@Injectable()
export class UploadBackgroundWallpaperUseCase {
  constructor(
    private s3FileStorageAdapter: S3FileStorageAdapter,
    private dataSource: DataSource,
  ) {}
  async execute(
    userId: string,
    blogId: string,
    imageBuffer: Buffer,
    originalName: string,
  ): Promise<BlogImagesInfo> {
    const [wallpaper] = await this.dataSource.query(
      this.getWallpaperExistQuery(),
      [blogId, ImageType.Wallpaper],
    );

    if (wallpaper) {
      const deleteInCloud = this.s3FileStorageAdapter.deleteImage(
        wallpaper.url,
      );
      const deleteInBd = this.dataSource
        .getRepository(BlogImage)
        .delete({ imageId: wallpaper.imageId });

      await Promise.all([deleteInCloud, deleteInBd]);
    }

    const { url } = await this.s3FileStorageAdapter.saveImage(
      userId,
      blogId,
      imageBuffer,
      originalName,
      ImageType.Wallpaper,
    );

    const { size, width, height } = await sharp(imageBuffer).metadata();
    const image = BlogImage.create(
      blogId,
      ImageType.Wallpaper,
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

  private getWallpaperExistQuery = (): string => {
    return `
      SELECT "imageId", url
        FROM blog_image
       WHERE "blogId" = $1 AND "imageType" = $2;
    `;
  };

  private getBlogImagesInfoQuery = (): string => {
    return `
      SELECT 
        (
          SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
            FROM blog_image 
           WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = $1
        ) AS wallpaper,
        COALESCE((
          SELECT JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize"))
            FROM blog_image 
           WHERE "imageType" = '${ImageType.Main}' AND "blogId" = $1
        ), '[]') AS main;
    `;
  };
}
