import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export class WallpaperValidator {
  async transform(image: Express.Multer.File) {
    const { size, width, height } = await sharp(image.buffer).metadata();

    const exception = [];
    if (size > 100000) {
      exception.push({
        message: 'Размер изображения превышает допустимый предел.',
        field: 'size',
      });
    }
    if (width !== 1028) {
      exception.push({
        message: 'Ширина изображения не соответствует ожидаемому значению.',
        field: 'width',
      });
    }
    if (height !== 312) {
      exception.push({
        message: 'Высота изображения не соответствует ожидаемому значению.',
        field: 'height',
      });
    }
    if (exception.length) {
      throw new BadRequestException(exception);
    }

    return image;
  }
}
