import {
  Controller,
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
import sharp from 'sharp';
import { ForbiddenGuard } from '../../../guards/forbidden.guard';

@Controller('blogger/blogs')
@UseGuards(AuthBearerGuard, ForbiddenGuard)
export class ImagesController {
  @Post(':blogId/images/wallpaper')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackgroundWallpaper(
    @UploadedFile() image: Express.Multer.File,
    @User() user: UserDBModel,
  ) {
    console.log(image);
    console.log(sharp(image.buffer).metadata());
    console.log(sharp(image.buffer).stats());
    const userId = user.id;
    return;
  }
}
