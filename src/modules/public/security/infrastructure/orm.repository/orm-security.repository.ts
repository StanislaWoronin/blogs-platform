import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Not } from 'typeorm';
import { UserDeviceModel } from '../entity/userDevice.model';
import { Security } from '../entity/security';

@Injectable()
export class OrmSecurityRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createUserDevice(newDevice: UserDeviceModel): Promise<boolean> {
    try {
      await this.dataSource.getRepository(Security).save(newDevice);

      return true;
    } catch (e) {
      return false;
    }
  }

  async updateCurrentActiveSessions(
    deviceId: string,
    iat: string,
    exp: string,
  ): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Security)
      .set({
        iat,
        exp,
      })
      .where('deviceId = :id', { id: deviceId })
      .execute();

    if (result.affected != 1) {
      return false;
    }
    return true;
  }

  async deleteAllActiveSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const builder = this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Security)
      .where('userId = :id', { id: userId })
      .andWhere('deviceId != :id', { id: deviceId });
    const result = await builder.execute();

    return true;
  } // TODO trabl 4

  async deleteDeviceById(deviceId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Security)
      .where('deviceId = :id', { id: deviceId })
      .execute();


    if (result.affected != 1) {
      return false;
    }
    return true;
  }
}
