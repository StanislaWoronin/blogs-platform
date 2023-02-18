import { UserDeviceModel } from "./entity/userDevice.model";

export interface IQuerySecurityRepository {
  getAllActiveSessions(userId: string): Promise<UserDeviceModel[]>
  getDeviseById(deviceId: string): Promise<UserDeviceModel | null>

}

export const IQuerySecurityRepository = 'IQuerySecurityRepository'