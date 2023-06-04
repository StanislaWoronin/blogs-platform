import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

type TImageParametrs = {
  size: number;
  width: number;
  height: number;
};

enum ImagesFormat {
  Jpeg = 'jpeg',
  Png = 'png',
  Webp = 'webp',
  Gif = 'gif',
  Svg = 'svg',
}

export const isValidImage = async (
  parametrs: TImageParametrs,
  image: Express.Multer.File,
): Promise<boolean> => {
  try {
    const { format } = await sharp(image.buffer).metadata();
    // @ts-ignore
    if (!Object.values(ImagesFormat).includes(format)) throw Error();
  } catch (e) {
    throw new BadRequestException([
      {
        message: 'Not supported format.',
        field: 'format',
      },
    ]);
  }

  const { size, width, height } = await sharp(image.buffer).metadata();
  const exception = [];
  if (size > parametrs.size) {
    exception.push({
      message: 'Image size exceeds the allowed limit.',
      field: 'size',
    });
  }
  if (width !== parametrs.width) {
    exception.push({
      message: 'Image width does not match expected value.',
      field: 'width',
    });
  }
  if (height !== parametrs.height) {
    exception.push({
      message: 'Image height does not match expected value.',
      field: 'height',
    });
  }
  if (exception.length) {
    throw new BadRequestException(exception);
  }

  return true;
};
