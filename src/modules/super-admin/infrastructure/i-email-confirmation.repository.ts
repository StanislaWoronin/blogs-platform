import {EmailConfirmationModel} from "./entity/emailConfirmation.model";

export interface IEmailConfirmationRepository {
    getEmailConfirmationByCode(
        code: string,
    ): Promise<EmailConfirmationModel | null>;
    checkConfirmation(userId: string): Promise<boolean | null>;
    createEmailConfirmation(
        emailConfirmation: EmailConfirmationModel,
    ): Promise<EmailConfirmationModel | null>;
    updateConfirmationInfo(confirmationCode: string): Promise<boolean>;
    updateConfirmationCode(
        userId: string,
        confirmationCode: string,
        expirationDate: string,
    ): Promise<boolean>;
    deleteEmailConfirmationById(userId: string): Promise<boolean>;
}

export const IEmailConfirmationRepository = 'IEmailConfirmationRepository'