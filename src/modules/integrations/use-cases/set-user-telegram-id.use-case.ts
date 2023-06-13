import {Injectable} from "@nestjs/common";
import {TelegramMessageDto} from "../api/dto/telegram-message.dto";
import {IntegrationRepository} from "../infrastructure/integration.repository";

@Injectable()
export class SetUserTelegramIdUseCase {
    constructor(
        private integrationRepository: IntegrationRepository,
    ) {
    }

    async execute(payload: TelegramMessageDto) {
        if (payload.message.from.is_bot) {
            throw Error('Bot can\'t subscribe to a blog')
        }
        const authorizationCode = payload.message.text.split('=')[1]

        return await this.integrationRepository.saveUserTelegramId(payload.message.from.id, authorizationCode)
    }
}