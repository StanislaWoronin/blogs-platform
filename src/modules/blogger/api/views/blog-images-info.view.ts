import { PicturesInfo } from './pictures-info.view';
import {settings} from "../../../../settings";
import {join} from "path";

export class BlogImagesInfo {
  wallpaper: PicturesInfo;
  main: PicturesInfo[];

  static relativeToAbsoluteUrl(obj): BlogImagesInfo {
    for (let key in obj) {
      if (typeof obj[key] === 'object') {
        BlogImagesInfo.relativeToAbsoluteUrl(obj[key])
      } else if (key === 'url') {
        const relativeUrl = obj[key]
        obj[key] = join(settings.s3.baseUrl, settings.s3.bucketsName, relativeUrl)
      }
    }
    return obj
  }
}
