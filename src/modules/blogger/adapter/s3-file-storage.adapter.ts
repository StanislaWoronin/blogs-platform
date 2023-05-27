import { Injectable } from '@nestjs/common';
import {
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
    imageBuffer: Buffer,
    originalName: string,
    imageName: ImageType,
  ): Promise<string> {
    const key = `content/users/${userId}/${imageName}/${imageName}-${originalName}.png`;
    const bucketParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
    };

    const command = new PutObjectCommand(bucketParams);

    try {
      const result: PutObjectCommandOutput = await this.s3Client.send(command);

      return key;
    } catch (exception) {
      console.log(exception);
      throw exception;
    }
  }

  async #ensureUserFolder(userId: string, subFolder: string) {
    const dirPath = join('content', 'users', userId, subFolder);
    await ensureDirSync(dirPath);
    return dirPath;
  }
}
