import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class PgTestingRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getConfirmationCode(userId: string) {
    const result = await this.dataSource.query(`
      SELECT "confirmationCode"
        FROM public.email_confirmation
       WHERE "userId" = '${userId}'
    `);

    return result[0];
  }

  async checkUserConfirmed(userId: string) {
    const result = await this.dataSource.query(`
      SELECT "isConfirmed"
        FROM public.email_confirmation
       WHERE "userId" = '${userId}'
    `);

    return result[0];
  }

  async getUserPassword(userId: string) {
    const result = await this.dataSource.query(`
      SELECT "passwordHash"
        FROM public.users
       WHERE id = '${userId}'
    `);

    return result[0];
  }

  async makeExpired(userId: string, expirationDate: string) {
    const result = await this.dataSource.query(`
      UPDATE public.email_confirmation
         SET "expirationDate" = '${expirationDate}'
       WHERE "userId" = '${userId}';
    `);

    if (result[1] !== 1) {
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
