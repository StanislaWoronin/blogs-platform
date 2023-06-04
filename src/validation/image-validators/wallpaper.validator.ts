import { isValidImage } from './helpers';
import { settings } from '../../settings';

export class WallpaperValidator {
  async transform(image: Express.Multer.File) {
    await isValidImage(settings.images.wallpaper, image.buffer);

    return image;
  }
}
