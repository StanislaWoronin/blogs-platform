import {Injectable} from '@nestjs/common';
import {S3FileStorageAdapter} from '../adapter/s3-file-storage.adapter';
import {ImageType} from '../imageType';
import sharp from 'sharp';
import {DataSource} from 'typeorm';
import {BlogImagesInfo} from '../api/views';
import {BlogImage} from "../blog-image.entity";
import {PostImage} from "../post-image.entity";
import {PostImagesInfo} from "../api/views/post-images-info.view";

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
  ): Promise<PostImagesInfo> {
    try {
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
      const middle = await sharp(imageBuffer)
          .resize({width: 300, height: 180})
          .toBuffer()
      const small = await sharp(imageBuffer)
          .resize({width: 149, height: 96})
          .toBuffer()
      const mainImages = {original, middle, small}

      const saveImage = []
      for (let key in mainImages) {
        const saveInStorage = await this.s3FileStorageAdapter.saveImage(
            userId,
            blogId,
            mainImages[key].imageBuffer,
            key,
            ImageType.Main,
            postId
        );

        const {size, width, height} = await sharp(mainImages[key]).metadata();
        const image = PostImage.create(
            postId,
            ImageType.Main,
            width,
            height,
            size,
            userId,
            blogId,
            key
        );
        const saveInBd = await this.dataSource.getRepository(PostImage).save(image);

        // saveImage.push(saveInStorage)
        // saveImage.push(saveInBd)
      }
      //await Promise.all(saveImage)

      const [postImagesInfo]: PostImagesInfo[] = await this.dataSource.query(
          this.getPostImagesInfoQuery(),
          [postId],
      );

      return PostImagesInfo.relativeToAbsoluteUrl(postImagesInfo);
    } catch (e) {
      console.log(e)
    }
  }

  private getPostMainImagesQuery = (): string => {
    return `
      SELECT "imageId", url
        FROM post_image
       WHERE "postId" = $1;
    `;
  }

  private getPostImagesInfoQuery = (): string => {
    return `
      SELECT 
        COALESCE((
          SELECT JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize"))
            FROM post_image 
           WHERE "imageType" = '${ImageType.Main}' AND "postId" = $1
        ), '[]') AS main;
    `;
  };
}
