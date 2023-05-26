import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from "class-validator";
import {BadRequestException, Injectable} from "@nestjs/common";
import sharp from "sharp";

@ValidatorConstraint({ name: 'WallpaperValidator', async: true })
@Injectable()
export class WallpaperValidator implements ValidatorConstraintInterface {
    constructor() {}

    async validate(image: Express.Multer.File) {
        const { size, width, height } = await sharp(image.buffer).metadata();

        if (size > 100000) throw BadRequestException
        if (width !== 1028) throw BadRequestException
        if (height !== 312) throw BadRequestException

        return true
    }

    defaultMessage(args: ValidationArguments) {
        return 'Picture is wrong size!';
    }
}
