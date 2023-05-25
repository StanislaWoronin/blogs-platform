import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailConfirmationModel } from '../entity/emailConfirmation.model';
import { v4 as uuidv4 } from 'uuid';
import { log } from 'util';
import { EmailConfirmation } from '../entity/email-confirmation.entity';

@Injectable()
export class PgEmailConfirmationRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getEmailConfirmationByCode(
    code: string,
  ): Promise<EmailConfirmationModel | null> {
    const query = `
      SELECT "userId", "confirmationCode", "expirationDate", "isConfirmed"
        FROM public.email_confirmation
       WHERE "confirmationCode" = '${code}';
    `;
    const result = await this.dataSource.query(query);

    return result[0];
  }

  async checkConfirmation(userId: string): Promise<boolean | null> {
    const query = `
      SELECT "isConfirmed"
        FROM public.email_confirmation
       WHERE "userId" = $1;
    `;
    const result = await this.dataSource.query(query, [userId]);

    if (!result.length) {
      return null;
    }
    return result[0]['isConfirmed'];
  }

  async createEmailConfirmation(
    emailConfirmation: EmailConfirmationModel,
  ): Promise<EmailConfirmationModel | null> {
    const filter = this.getCreateFilter(emailConfirmation);
    const query = `
      INSERT INTO public.email_confirmation
             ("userId", "confirmationCode", "expirationDate", "isConfirmed")
      VALUES (${filter})
    `;
    await this.dataSource.query(query);

    return emailConfirmation;
  }

  async updateConfirmationInfo(confirmationCode: string): Promise<boolean> {
    const query = `
      UPDATE public.email_confirmation
         SET "isConfirmed" = true
       WHERE "confirmationCode" = $1;
    `;
    const result = await this.dataSource.query(query, [confirmationCode]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async updateConfirmationCode(
    userId: string,
    confirmationCode: string,
    expirationDate: string,
  ): Promise<boolean> {
    const query = `
      UPDATE public.email_confirmation
         SET "confirmationCode" = $2, "expirationDate" = $3
       WHERE "userId" = $1;
    `;
    const result = await this.dataSource.query(query, [
      userId,
      confirmationCode,
      expirationDate,
    ]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deleteEmailConfirmationById(userId: string): Promise<boolean> {
    const query = `
      DELETE FROM public.email_confirmation
       WHERE "userId" = $1;
    `;

    const result = await this.dataSource.query(query, [userId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  private getCreateFilter(emailConfirmation: EmailConfirmationModel): string {
    let filter = `'${emailConfirmation.userId}', null, null, '${emailConfirmation.isConfirmed}'`;
    if (emailConfirmation.confirmationCode !== null) {
      return (filter = `'${emailConfirmation.userId}', '${emailConfirmation.confirmationCode}', '${emailConfirmation.expirationDate}', '${emailConfirmation.isConfirmed}'`);
    }
    return filter;
  }
}
