import { BadRequestException, Injectable } from '@nestjs/common';
import { S3FileStorageAdapter } from '../adapter/s3-file-storage.adapter';
import { ImageType } from '../imageType';
import sharp from 'sharp';
import { DataSource } from 'typeorm';
import { Image } from '../image';
import { BlogImagesInfoView } from '../api/views';

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
  ): Promise<BlogImagesInfoView> {
    const wallpaper = await this.dataSource.query(this.checkWallpaperExist(), [
      userId,
      ImageType.Wallpaper,
    ]);
    console.log(wallpaper);
    if (wallpaper.length) {
      await this.s3FileStorageAdapter.deleteImage(wallpaper.url);
      await this.dataSource
        .getRepository(Image)
        .delete({ imageId: wallpaper.imageId });
    }

    const { url, imageId } = await this.s3FileStorageAdapter.saveImage(
      userId,
      blogId,
      imageBuffer,
      originalName,
      ImageType.Wallpaper,
    );

    const { size, width, height } = await sharp(imageBuffer).metadata();
    console.log(size);
    const image = Image.create(
      imageId,
      blogId,
      ImageType.Wallpaper,
      url,
      width,
      height,
      size,
    );
    await this.dataSource.getRepository(Image).save(image);
    const [blogImagesInfo]: BlogImagesInfoView[] = await this.dataSource.query(
      this.getBlogImagesInfo(),
      [blogId],
    );

    return blogImagesInfo;
  }

  private checkWallpaperExist = (): string => {
    return `
      SELECT "imageId", url
        FROM image
       WHERE "blogId" = $1 AND "imageType" = $2
    `;
  };

  private getBlogImagesInfo = (): string => {
    return `
      SELECT 
        (
          SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
            FROM image 
           WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = $1
        ) AS wallpaper,
        COALESCE((
          SELECT JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize"))
            FROM image 
           WHERE "imageType" = '${ImageType.Main}' AND "blogId" = $1
        ), '[]') AS main;
    `;
  };
}
