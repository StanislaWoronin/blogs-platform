import { v4 as uuidv4 } from 'uuid';
import add from 'date-fns/add';
import { Inject, Injectable } from '@nestjs/common';
import { EmailManager } from '../email-transfer/email.manager';
import { IEmailConfirmationRepository } from '../../../super-admin/infrastructure/i-email-confirmation.repository';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IEmailConfirmationRepository)
    protected emailConfirmationRepository: IEmailConfirmationRepository,
    protected emailsManager: EmailManager,
  ) {}

  async sendPasswordRecovery(userId: string, email: string): Promise<boolean> {
    const newRecoveryCode = uuidv4();
    const expirationDate = add(new Date(), { hours: 24 }).toISOString();
    const result =
      await this.emailConfirmationRepository.updateConfirmationCode(
        userId,
        newRecoveryCode,
        expirationDate,
      );

    if (!result) {
      return false;
    }

    await this.emailsManager.sendPasswordRecoveryEmail(email, newRecoveryCode);
    return true;
  }

  async updateConfirmationCode(userId: string): Promise<string | null> {
    const newConfirmationCode = uuidv4();
    const newExpirationDate = add(new Date(), { hours: 24 }).toISOString();
    const result =
      await this.emailConfirmationRepository.updateConfirmationCode(
        userId,
        newConfirmationCode,
        newExpirationDate,
      );

    if (!result) {
      return null;
    }

    return newConfirmationCode;
  }
}
