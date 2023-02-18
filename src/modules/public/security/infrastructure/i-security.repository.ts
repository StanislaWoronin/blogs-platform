import { UserDeviceModel } from "./entity/userDevice.model";

export interface ISecurityRepository {
  createUserDevice(createDevice: UserDeviceModel): Promise<boolean>
  updateCurrentActiveSessions(
    deviceId: string,
    iat: string,
    exp: string,
  ): Promise<boolean>
  deleteAllActiveSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean>
  deleteDeviceById(deviceId: string): Promise<boolean>
}

export const ISecurityRepository = 'ISecurityRepository'