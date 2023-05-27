import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthBearerGuard } from '../../../guards/auth.bearer.guard';
import { UserDBModel } from '../../super-admin/infrastructure/entity/userDB.model';
import { User } from '../../../decorator/user.decorator';
import { ForbiddenGuard } from '../../../guards/forbidden.guard';
import { join } from 'node:path';
import { readTextFileAsync } from '../../../helpers/fs-utils';
import { WallpaperDto } from './dto/wallpaper.dto';
import { UploadBackgroundWallpaperUseCase } from '../use-cases';
import { BlogImagesInfoView } from './views';
import sharp from 'sharp';

@Controller('blogger/blogs')
//@UseGuards(AuthBearerGuard, ForbiddenGuard)
export class ImagesController {
  constructor(
    private uploadBackgroundWallpaperUseCase: UploadBackgroundWallpaperUseCase,
  ) {}
  @Get('images')
  async changeAvatarPage() {
    const htmlContent = await readTextFileAsync(
      join('src', 'images', 'change-image-page.html'),
    );

    return htmlContent;
  }

  @Post('images/wallpaper')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackgroundWallpaper(
    //@UploadedFile() content: WallpaperDto,
    @UploadedFile() content: Express.Multer.File,
    s,
    //@User() user: UserDBModel,
  ) /*: Promise<BlogImagesInfoView>*/ {
    const imageBuffer = content.buffer;

    const userId = '1';
    const originalName = content.originalname;

    return await this.uploadBackgroundWallpaperUseCase.execute(
      userId,
      imageBuffer,
      originalName,
    );
  }
}
