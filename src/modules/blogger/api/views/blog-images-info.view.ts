import { PicturesInfo } from './pictures-info.view';
import { settings } from '../../../../settings';
import { join } from 'path';

export class BlogImagesInfo {
  wallpaper: PicturesInfo;
  main: PicturesInfo[];

  static relativeToAbsoluteUrl(obj): BlogImagesInfo {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        BlogImagesInfo.relativeToAbsoluteUrl(obj[key]);
      } else if (key === 'url') {
        const relativeUrl = obj[key];
        obj[
          key
        ] = `${settings.s3.baseUrl}/${settings.s3.bucketsName}/${relativeUrl}`;
        // join(
        //   settings.s3.baseUrl,
        //   settings.s3.bucketsName,
        //   relativeUrl,); // "join" should be used to glue file paths, not links
      }
    }
    return obj;
  }
}
