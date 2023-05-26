import { IsEmpty, Validate } from 'class-validator';

export class WallpaperDto {
  @IsEmpty()
  wallpaper: Express.Multer.File;
}
