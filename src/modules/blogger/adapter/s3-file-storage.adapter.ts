import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { settings } from '../../../settings';
import { PicturesInfo } from '../api/views';
import { join } from 'node:path';
import { ensureDirSync, saveFileAsync } from '../../../helpers/fs-utils';
import { ImageType } from '../imageType';

@Injectable()
export class S3FileStorageAdapter {
  s3Client: S3Client;
  bucketName = settings.s3.bucketsName;

  constructor() {
    const REGION = 'us-east-1';
    this.s3Client = new S3Client({
      region: REGION,
      endpoint: settings.s3.endpoint,
      credentials: {
        accessKeyId: settings.s3.accessKeyId,
        secretAccessKey: settings.s3.secretAccessKey,
      },
    });
  }

  async saveImage(
    userId: string,
    blogId: string,
    imageBuffer: Buffer,
    originalName: string,
    imageType: ImageType,
  ): Promise<{ url: string; imageId: string }> {
    const key = `content/users/${userId}/${blogId}/${imageType}/${originalName}`;

    const bucketParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
    };

    const command = new PutObjectCommand(bucketParams);

    try {
      const result = await this.s3Client.send(command);

      return {
        url: key,
        imageId: result.ETag,
      };
    } catch (exception) {
      console.log('Try save image:', exception);
      throw exception;
    }
  }

  async deleteImage(url: string) {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: url,
    };

    try {
      const data = await this.s3Client.send(
        new DeleteObjectCommand(bucketParams),
      );
      return data;
    } catch (exception) {
      console.error('Delete error:', exception);
      throw exception;
    }

    return;
  }

  async #ensureUserFolder(userId: string, subFolder: string) {
    const dirPath = join('content', 'users', userId, subFolder);
    await ensureDirSync(dirPath);
    return dirPath;
  }
}
