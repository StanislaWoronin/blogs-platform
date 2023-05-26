import {Controller, Get, HttpCode, HttpStatus, Post, UploadedFile, UseGuards, UseInterceptors} from "@nestjs/common";
import {FileInterceptor} from "@nestjs/platform-express";
import {AuthBearerGuard} from "../../../guards/auth.bearer.guard";
import {UserDBModel} from "../../super-admin/infrastructure/entity/userDB.model";
import {User} from "../../../decorator/user.decorator";
import sharp from "sharp";
import {ForbiddenGuard} from "../../../guards/forbidden.guard";
import {join} from "node:path";
import {readTextFileAsync} from "../../../helpers/fs-utils";
import {WallpaperDto} from "./dto/wallpaper.dto";

@Controller('blogger/blogs')
//@UseGuards(AuthBearerGuard, ForbiddenGuard)
export class ImagesController {

    @Get('images')
    async changeAvatarPage() {
        const htmlContent = await readTextFileAsync(
            join('src', 'images', 'change-image-page.html'),
        );

        return htmlContent;
    }

    @Post('images/wallpaper')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    async uploadBackgroundWallpaper(
        @UploadedFile() image: WallpaperDto,
        @User() user: UserDBModel
    ) {
        //const userId = user.id
        return
    }
}
