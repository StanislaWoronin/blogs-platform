import { Injectable } from '@nestjs/common';
import { EmailAdapters } from './email.adapter';

@Injectable()
export class EmailManager {
  constructor(protected emailAdapters: EmailAdapters) {}

  async sendConfirmationEmail(
    email: string,
    confirmationCode: string,
  ): Promise<void> {
    const subject = 'Confirm your email';
    const message = `<h1>Thank for your registration</h1><p>To finish registration please follow the link below:
                         <a href=\'https://somesite.com/confirm-email?code=${confirmationCode}\'>complete registration</a>
                         </p>`;

    return await this.emailAdapters.sendEmail(email, subject, message);
  }

  async sendPasswordRecoveryEmail(email: string, recoveryCode: string) {
    const subject = 'Password recovery';
    const message = `<h1>Password recovery</h1>
                         <p>To finish password recovery please follow the link below:
                         <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
                         </p>`;

    return this.emailAdapters.sendEmail(email, subject, message);
  }
}
