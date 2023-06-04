import { isValidImage } from './helpers';
import { settings } from '../../settings';

export class BlogMainValidator {
  async transform(image: Express.Multer.File) {
    await isValidImage(settings.images.main.blog, image.buffer);

    return image;
  }
}
