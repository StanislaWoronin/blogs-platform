import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailConfirmation } from '../../../super-admin/infrastructure/entity/email-confirmation.entity';

@Injectable()
export class OrmTestingRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getConfirmationCode(
    userId: string,
  ) /*: Promise<{ confirmationCode: string }>*/ {
    const result = await this.dataSource
      .getRepository('email_confirmation')
      .createQueryBuilder('ec')
      .select('ec.confirmationCode')
      .where('ec.userId = :id', { id: userId })
      .getOne();

    return result;
  }

  async checkUserConfirmed(
    userId: string,
  ) /*: Promise<{isConfirmed: boolean}>*/ {
    const result = await this.dataSource
      .getRepository('email_confirmation')
      .createQueryBuilder('ec')
      .select('ec.isConfirmed')
      .where('ec.userId = :id', { id: userId })
      .getOne();

    return result;
  }

  async getUserPassword(userId: string) /*: Promise<{passwordHash: string}>*/ {
    const result = await this.dataSource
      .getRepository('users')
      .createQueryBuilder('u')
      .select('u.passwordHash')
      .where('u.id = :id', { id: userId })
      .getOne();

    return result;
  }

  async makeExpired(userId: string, expirationDate: string): Promise<boolean> {
    const result = await this.dataSource
      .getRepository('email_confirmation')
      .createQueryBuilder('ec')
      .update()
      .set({
        expirationDate,
      })
      .where('userId = :id', { id: userId })
      .execute();

    if (result.affected !== 1) {
      return false;
    }
    return true;
  }

  async deleteAll(): Promise<boolean> {
    try {
      const entities = this.dataSource.entityMetadatas;
      const tableNames = entities
        .map((entity) => `"${entity.tableName}"`)
        .join(', ');

      const deleted = await this.dataSource.query(
        `TRUNCATE ${tableNames} CASCADE;`,
      );

      return deleted;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
