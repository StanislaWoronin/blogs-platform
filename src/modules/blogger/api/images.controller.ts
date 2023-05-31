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
import { BlogImagesInfo } from './views';
import { WallpaperValidator } from '../../../validation/wallpaper.validator';
import {BlogMainValidator} from "../../../validation/blog-main.validator";
import {UploadBlogMainImageUseCase} from "../use-cases/upload-blog-main-image.use-case";
import {PostMainValidator} from "../../../validation/post-main.validator";
import {UploadPostMainImageUseCase} from "../use-cases/upload-post-main-image.use-case";
import {PostImagesInfo} from "./views/post-images-info.view";

@Controller('blogger/blogs')
@UseGuards(AuthBearerGuard, ForbiddenGuard)
export class ImagesController {
  constructor(
    private uploadBackgroundWallpaperUseCase: UploadBackgroundWallpaperUseCase,
    private uploadBlogMainImageUseCase: UploadBlogMainImageUseCase,
    private uploadPostMainImageUseCase: UploadPostMainImageUseCase
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
  ): Promise<BlogImagesInfo> {
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
      console.log(e)
    }
  }

  @Post(':blogId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBlogMainImage(
      @Param('blogId') blogId: string,
      @UploadedFile(new BlogMainValidator()) content: Express.Multer.File,
      @User() user: UserDBModel,
  ): Promise<BlogImagesInfo> {
    const imageBuffer = content.buffer;
    const originalName = content.originalname;

    return await this.uploadBlogMainImageUseCase.execute(
        user.id,
        blogId,
        imageBuffer,
        originalName,
    );
  }

  @Post(':blogId/posts/:postId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostMainImage(
      @Param('blogId') blogId: string,
      @Param('postId') postId: string,
      @UploadedFile(new PostMainValidator()) content: Express.Multer.File,
      @User() user: UserDBModel,
  ): Promise<PostImagesInfo> {
    const imageBuffer = content.buffer;
    const originalName = content.originalname;

    return await this.uploadPostMainImageUseCase.execute(
        user.id,
        blogId,
        postId,
        imageBuffer,
        originalName,
    );
  }
}
