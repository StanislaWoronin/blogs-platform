import { isValidImage } from './helpers';
import { settings } from '../../settings';

export class PostMainValidator {
  async transform(image: Express.Multer.File) {
    await isValidImage(settings.images.main.post.original, image.buffer);

    return image;
  }
}
