import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class PgJwtRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async checkTokenInBlackList(refreshToken: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(SELECT token FROM public.token_black_list WHERE token = $1)
    `;
    const result = await this.dataSource.query(query, [refreshToken]);

    return result[0].exists;
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
