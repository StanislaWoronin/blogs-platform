import {Injectable} from "@nestjs/common";
import {IntegrationRepository} from "../infrastructure/integration.repository";
import {TelegramBotSubscriptions} from "../infrastructure/entity/telegram-bot-subscriptions.entity";
import {randomInt} from "crypto";
import {settings} from "../../../settings";

@Injectable()
export class CreateNewBotSubscriptionUseCase {
    constructor(private integrationRepository: IntegrationRepository) {
    }

    async execute(userId) {
        const botSubscription = TelegramBotSubscriptions.create(userId)
        const authorizationCode = await this.integrationRepository.createNewBotSubscription(botSubscription)

        return {link: `${settings.telegram.botInviteLink}?code=${authorizationCode}`}
    }
}