import axios, {AxiosInstance} from "axios";
import {Injectable} from "@nestjs/common";
import {settings} from "../../../settings";

@Injectable()
export class TelegramAdapter {
    private readonly axiosInstance: AxiosInstance;
    constructor() {
        const token = settings.telegram.botToken;
        this.axiosInstance = axios.create({
            baseURL: settings.telegram.baseUrl,
        });
    }

    async setWebhook(url: string) {
        await this.axiosInstance.post(`setWebhook`, {
            url: url,
        });
    }
}