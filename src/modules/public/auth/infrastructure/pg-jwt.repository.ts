import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class PgJwtRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getToken(refreshToken: string): Promise<string | null> {
    const query = `
      SELECT token
        FROM public.token_black_list
       WHERE token = $1;
    `;
    const result = await this.dataSource.query(query, [refreshToken]);

    if (!result.length) {
      return null;
    }
    return result[0].token;
  }

  async addTokenInBlackList(refreshToken: string): Promise<boolean> {
    const query = `
      INSERT INTO public.token_black_list
             (token)
      VALUES ($1);
    `;
    const result = await this.dataSource.query(query, [refreshToken]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }
}
