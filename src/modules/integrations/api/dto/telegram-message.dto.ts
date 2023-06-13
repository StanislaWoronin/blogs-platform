export type TelegramMessageDto = {
    message: {
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            last_name: string;
        };
        text: string;
    };
};