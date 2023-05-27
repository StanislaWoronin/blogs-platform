import { BadRequestException, Injectable } from '@nestjs/common';
import { S3FileStorageAdapter } from '../adapter/s3-file-storage.adapter';
import { BlogImagesInfoView } from '../api/views';
import { ImageType } from '../imageType';
import sharp from 'sharp';
import { DataSource } from 'typeorm';
import { Image } from '../image';

@Injectable()
export class UploadBackgroundWallpaperUseCase {
  constructor(
    private s3FileStorageAdapter: S3FileStorageAdapter,
    private dataSource: DataSource,
  ) /*: Promise<BlogImagesInfoView>*/ {}
  async execute(userId: string, imageBuffer: Buffer, originalName: string) {
    const { size, width, height } = await sharp(imageBuffer).metadata();

    if (size > 100000) throw BadRequestException;
    if (width !== 1028) throw BadRequestException;
    if (height !== 312) throw BadRequestException;

    const url = await this.s3FileStorageAdapter.saveImage(
      userId,
      imageBuffer,
      originalName,
      ImageType.Wallpaper,
    );
    // проверить, существует ли обои, если да, сохранить, иначе удалить в хранилище, создать и сохранить
    const image = Image.create(userId, url, width, height, size);
    await this.dataSource.getRepository(Image).create(image);
    //await this.dataSource.query();
    await this.dataSource;
  }
}
