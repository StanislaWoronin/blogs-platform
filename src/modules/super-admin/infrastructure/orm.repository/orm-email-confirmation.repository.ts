import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailConfirmationModel } from '../entity/emailConfirmation.model';
import { EmailConfirmation } from '../entity/email-confirmation.entity';
import { Users } from '../entity/users.entity';

@Injectable()
export class OrmEmailConfirmationRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getEmailConfirmationByCode(
    code: string,
  ): Promise<EmailConfirmationModel | null> {
    const builder = this.dataSource
      .createQueryBuilder()
      .select('ec.userId', 'userId')
      .addSelect('ec.confirmationCode', 'confirmationCode')
      .addSelect('ec.expirationDate', 'expirationDate')
      .addSelect('ec.isConfirmed', 'isConfirmed')
      .from(EmailConfirmation, 'ec')
      .where('ec.confirmationCode = :code', { code: code });

    return await builder.getRawOne();
  }

  async checkConfirmation(userId: string): Promise<boolean | null> {
    const builder = this.dataSource
      .createQueryBuilder()
      .select('ec.isConfirmed', 'isConfirmed')
      .from(EmailConfirmation, 'ec')
      .where('ec.userId = :id', { id: userId });
    const status = await builder.getRawOne();

    if (!status) {
      return null;
    }
    return status.isConfirmed;
  }

  async createEmailConfirmation(
    emailConfirmation: EmailConfirmationModel,
  ): Promise<EmailConfirmationModel | null> {
    try {
      const result = await this.dataSource
        .getRepository(EmailConfirmation)
        .save(emailConfirmation);

      return {
        userId: result.userId,
        confirmationCode: result.confirmationCode,
        expirationDate: result.expirationDate,
        isConfirmed: result.isConfirmed,
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async updateConfirmationInfo(confirmationCode: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(EmailConfirmation)
      .set({
        isConfirmed: true,
      })
      .where('confirmationCode = :code', { code: confirmationCode })
      .execute();

    if (result.affected != 1) {
      return false;
    }
    return true;
  }

  async updateConfirmationCode(
    userId: string,
    confirmationCode: string,
    expirationDate: string,
  ): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(EmailConfirmation)
      .set({
        confirmationCode,
        expirationDate,
      })
      .where('userId = :id', { id: userId })
      .execute();

    if (result.affected != 1) {
      return false;
    }
    return true;
  }

  async deleteEmailConfirmationById(userId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(EmailConfirmation)
      .where('userId = :id', { id: userId })
      .execute();

    if (result.affected != 1) {
      return false;
    }
    return true;
  }
}
