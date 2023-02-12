import { Injectable } from '@nestjs/common';
import { JwtService } from '../../auth/application/jwt.service';
import { ViewSecurityDeviseModel } from '../api/dto/viewSecurityDeviseModel';
import { UserDeviceModel } from '../infrastructure/entity/userDevice.model';
import { toActiveSessionsViewModel } from '../../../../data-mapper/to-active-session-view.model';
import { PgSecurityRepository } from '../infrastructure/pg-security.repository';
import { PgQuerySecurityRepository } from '../infrastructure/pg-query-security.repository';
import { v4 as uuidv4 } from 'uuid';
import {TokenPayloadModel} from "../../../../global-model/token-payload.model";

@Injectable()
export class SecurityService {
  constructor(
    protected jwtService: JwtService,
    protected securityRepository: PgSecurityRepository,
    protected querySecurityRepository: PgQuerySecurityRepository,
  ) {}

  async getAllActiveSessions(
    userId: string,
  ): Promise<ViewSecurityDeviseModel[] | null> {
    const activeSessions =
      await this.querySecurityRepository.getAllActiveSessions(userId);

    if (!activeSessions) {
      return null;
    }

    return activeSessions.map((a) => toActiveSessionsViewModel(a));
  }

  async getDeviceById(deviceId: string): Promise<UserDeviceModel | null> {
    const device = await this.querySecurityRepository.getDeviseById(deviceId);

    if(!device) {
      return  null
    }

    return device
  }

  async createUserDevice(
    userId: string,
    title: string,
    ipAddress: string,
  ): Promise<{ refreshToken: string; accessToken: string }> {
    const deviceId = uuidv4();
    const token = await this.jwtService.createToken(userId, deviceId);
    const tokenPayload = await this.jwtService.getTokenPayload(
      token.refreshToken,
    );

    const userDevice = new UserDeviceModel(
      tokenPayload.userId,
      tokenPayload.deviceId,
      title,
      ipAddress,
      tokenPayload.iat,
      tokenPayload.exp,
    );

    await this.securityRepository.createUserDevice(userDevice);
    return token;
  }

  async createNewRefreshToken(refreshToken: string, tokenPayload: TokenPayloadModel) {
    await this.jwtService.addTokenInBlackList(refreshToken);
    const token = await this.jwtService.createToken(
      tokenPayload.userId,
      tokenPayload.deviceId,
    );
    const newTokenPayload = await this.jwtService.getTokenPayload(
      token.refreshToken,
    );
    const iat = new Date(newTokenPayload.iat).toISOString()
    const exp = new Date(newTokenPayload.exp).toISOString()
    console.log(exp)
    await this.securityRepository.updateCurrentActiveSessions(
      newTokenPayload.deviceId,
      iat,
      exp,
    );

    return token;
  }

  async logoutFromCurrentSession(refreshToken: string) {
    await this.jwtService.addTokenInBlackList(refreshToken);
    const tokenPayload = await this.jwtService.getTokenPayload(refreshToken);
    await this.securityRepository.deleteDeviceById(tokenPayload.deviceId);

    return;
  }

  async deleteAllActiveSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    return await this.securityRepository.deleteAllActiveSessions(
      userId,
      deviceId,
    );
  }

  async deleteDeviceById(deviceId: string): Promise<boolean> {
    return await this.securityRepository.deleteDeviceById(deviceId);
  }
}
