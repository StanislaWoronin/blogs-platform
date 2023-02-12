import { EmailAdapters } from '../../src/modules/public/auth/email-transfer/email.adapter';

export class EmailManagerMock {
  constructor() {}

  async sendConfirmationEmail(email: string, confirmationCode: string) {
    return;
  }

  async sendPasswordRecoveryEmail(email: string, recoveryCode: string) {
    return;
  }
}
