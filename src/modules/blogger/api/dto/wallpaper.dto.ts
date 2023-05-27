import { IsEmpty, Validate } from 'class-validator';
import { WallpaperValidator } from '../../../../validation/wallpaper.validator';

export class WallpaperDto {
  @IsEmpty()
  @Validate(WallpaperValidator)
  wallpaper: Express.Multer.File;
}
