import {Injectable} from '@nestjs/common';
import {S3FileStorageAdapter} from '../adapter/s3-file-storage.adapter';
import {ImageType} from '../imageType';
import sharp from 'sharp';
import {DataSource} from 'typeorm';
import {Image} from '../image';
import {BlogImagesInfo} from '../api/views';

@Injectable()
export class UploadBlogMainImageUseCase {
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
    const { url, imageId } = await this.s3FileStorageAdapter.saveImage(
      userId,
      blogId,
      imageBuffer,
      originalName,
      ImageType.Main,
    );

    const { size, width, height } = await sharp(imageBuffer).metadata();
    const image = Image.create(
      imageId,
      blogId,
      ImageType.Main,
      url,
      width,
      height,
      size,
    );
    console.log(image)
    await this.dataSource.getRepository(Image).save(image);
    const [blogImagesInfo]: BlogImagesInfo[] = await this.dataSource.query(
      this.getBlogImagesInfoQuery(),
      [blogId],
    );

    return BlogImagesInfo.relativeToAbsoluteUrl(blogImagesInfo);
  }

  private getBlogImagesInfoQuery = (): string => {
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
