import {
  Controller,
  Get,
  Param,
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
import { UploadBackgroundWallpaperUseCase } from '../use-cases';
import { BlogImagesInfoView } from './views';
import { WallpaperValidator } from '../../../validation/wallpaper.validator';

@Controller('blogger/blogs')
@UseGuards(AuthBearerGuard, ForbiddenGuard)
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

  @Post(':blogId/images/wallpaper')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackgroundWallpaper(
    @Param('blogId') blogId: string,
    @UploadedFile(new WallpaperValidator()) content: Express.Multer.File,
    @User() user: UserDBModel,
  ): Promise<BlogImagesInfoView> {
    try {
      const imageBuffer = content.buffer;
      const originalName = content.originalname;

      return await this.uploadBackgroundWallpaperUseCase.execute(
        user.id,
        blogId,
        imageBuffer,
        originalName,
      );
    } catch (e) {
      console.log(e);
      return;
    }
  }
}
