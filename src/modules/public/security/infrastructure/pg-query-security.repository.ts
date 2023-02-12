import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserDeviceModel } from './entity/userDevice.model';

@Injectable()
export class PgQuerySecurityRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getAllActiveSessions(userId: string): Promise<UserDeviceModel[]> {
    const query = `
      SELECT "userId", "deviceId", "deviceTitle", "ipAddress", iat, exp
        FROM public.security
       WHERE "userId" = $1;
    `;
    try {
      const result = await this.dataSource.query(query, [userId]);
      return result;
    } catch (e) {
      return null;
    }
  }

  async getDeviseById(deviceId: string): Promise<UserDeviceModel | null> {
    const query = `
      SELECT "userId", "deviceId", "deviceTitle", "ipAddress", iat, exp
        FROM public.security
       WHERE "deviceId" = $1;
    `;
    const result = await this.dataSource.query(query, [deviceId]);

    return result[0];
  }
}
