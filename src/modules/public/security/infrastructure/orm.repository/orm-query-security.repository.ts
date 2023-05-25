import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserDeviceModel } from '../entity/userDevice.model';
import { Security } from '../entity/security';
import { ViewSecurityDeviseModel } from '../../api/dto/viewSecurityDeviseModel';

@Injectable()
export class OrmQuerySecurityRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getAllActiveSessions(
    userId: string,
  ): Promise<ViewSecurityDeviseModel[]> {
    const builder = this.dataSource
      .createQueryBuilder()
      .addSelect('s.deviceId', 'deviceId')
      .addSelect('s.deviceTitle', 'title')
      .addSelect('s.ipAddress', 'ip')
      .addSelect('s.iat', 'lastActiveDate')
      .from(Security, 's')
      .where('s.userId = :id', { id: userId });

    return await builder.getRawMany();
  }

  async getDeviseById(deviceId: string): Promise<UserDeviceModel | null> {
    const builder = this.dataSource
      .createQueryBuilder()
      .select('s.userId', 'userId')
      .addSelect('s.deviceId', 'deviceId')
      .addSelect('s.deviceTitle', 'deviceTitle')
      .addSelect('s.ipAddress', 'ipAddress')
      .addSelect('s.iat', 'iat')
      .addSelect('s.exp', 'exp')
      .from(Security, 's')
      .where('s.deviceId = :id', { id: deviceId });

    return await builder.getRawOne();
  }
}
