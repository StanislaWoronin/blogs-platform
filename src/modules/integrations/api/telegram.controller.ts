import {Controller, Get, Post, UseGuards} from "@nestjs/common";
import {AccessTokenValidationGuard} from "../../../guards/access-token-validation.guard";
import {User} from "../../../decorator/user.decorator";
import {UserDBModel} from "../../super-admin/infrastructure/entity/userDB.model";

@Controller('integrations/telegram/webhook')
export class TelegramController {
    @Post('webhook')
    async webhook() {

    }

    @Get('auth-bot-link')
    @UseGuards(AccessTokenValidationGuard)
    async getPersonalTelegramLink(
        @User() user: UserDBModel,
    ) {}
}