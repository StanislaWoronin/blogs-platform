import {Injectable} from '@nestjs/common';
import {S3FileStorageAdapter} from '../adapter/s3-file-storage.adapter';
import {ImageType} from '../imageType';
import sharp from 'sharp';
import {DataSource} from 'typeorm';
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
      const middle = sharp(imageBuffer)
          .resize({width: 300, height: 180})
          .toBuffer()
      const small = sharp(imageBuffer)
          .resize({width: 149, height: 96})
          .toBuffer()
      const resizePromise = await Promise.all([original, middle, small])

      let metadataArr= []
      for (let buffer of resizePromise) {
        const metadata = sharp(buffer).metadata();
        metadataArr.push(metadata)
      }
      const metadataPromise = await Promise.all(metadataArr)

      const mainImages = {};
      const imageSizes = ['original', 'middle', 'small'];
      for (let i = 0; i < resizePromise.length; i++) {
        const key = imageSizes[i];
        const buffer = resizePromise[i];
        const metadata = metadataPromise[i];

        mainImages[key] = {
          buffer: buffer,
          width: metadata.width,
          height: metadata.height,
          size: metadata.size,
        };
      }

      const saveImage = []
      for (let key in mainImages) {
        const saveInStorage = this.s3FileStorageAdapter.saveImage(
            userId,
            blogId,
            mainImages[key].buffer,
            key,
            ImageType.Main,
            postId
        );

        const image = PostImage.create(
            postId,
            ImageType.Main,
            mainImages[key].width,
            mainImages[key].height,
            mainImages[key].size,
            userId,
            blogId,
            key
        );
        const saveInBd = this.dataSource.getRepository(PostImage).save(image);

        saveImage.push(saveInStorage)
        saveImage.push(saveInBd)
      }
      await Promise.all(saveImage)

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
