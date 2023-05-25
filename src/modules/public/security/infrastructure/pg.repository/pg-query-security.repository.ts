import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserDeviceModel } from '../entity/userDevice.model';
import { Security } from '../entity/security';
import { ViewSecurityDeviseModel } from '../../api/dto/viewSecurityDeviseModel';

@Injectable()
export class PgQuerySecurityRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getAllActiveSessions(
    userId: string,
  ): Promise<ViewSecurityDeviseModel[] | null> {
    const query = `
      SELECT "deviceId", "deviceTitle" AS title, "ipAddress" AS ip, iat AS "lastActiveDate"
        FROM public.security
       WHERE "userId" = $1;
    `;
    try {
      return await this.dataSource.query(query, [userId]);
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
