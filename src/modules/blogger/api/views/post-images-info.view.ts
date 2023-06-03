import { PicturesInfo } from './pictures-info.view';
import { join } from 'path';
import { settings } from '../../../../settings';

export class PostImagesInfo {
  main: PicturesInfo[];

  static relativeToAbsoluteUrl(obj: PostImagesInfo): PostImagesInfo {
    const images = obj.main.map((m) => ({
      url: join(settings.s3.baseUrl, settings.s3.bucketsName, m.url),
      width: m.width,
      height: m.height,
      fileSize: m.fileSize,
    }));

    return { main: images };
  }
}
