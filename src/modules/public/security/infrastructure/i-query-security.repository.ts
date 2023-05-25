import { UserDeviceModel } from './entity/userDevice.model';
import { ViewSecurityDeviseModel } from '../api/dto/viewSecurityDeviseModel';

export interface IQuerySecurityRepository {
  getAllActiveSessions(
    userId: string,
  ): Promise<ViewSecurityDeviseModel[] | null>;
  getDeviseById(deviceId: string): Promise<UserDeviceModel | null>;
}

export const IQuerySecurityRepository = 'IQuerySecurityRepository';
