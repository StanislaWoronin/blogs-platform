import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { settings } from '../../../../settings';
import { PgJwtRepository } from '../infrastructure/pg.repository/pg-jwt.repository';
import { TokenPayloadModel } from '../../../../global-model/token-payload.model';
import {IJwtRepository} from "../infrastructure/i-jwt.repository";

@Injectable()
export class JwtService {
  constructor(
      @Inject(IJwtRepository) protected jwtRepository: IJwtRepository
  ) {}

  async getTokenPayload(token: string): Promise<TokenPayloadModel> {
    try {
      const result: any = await jwt.verify(token, settings.JWT_SECRET);

      return {
        userId: result.userId,
        deviceId: result.deviceId,
        iat: result.iat * 1000,
        exp: result.exp * 1000,
      };
    } catch (error) {
      return null;
    }
  }

  async checkTokenInBlackList(refreshToken: string): Promise<boolean> {
    const token = await this.jwtRepository.checkTokenInBlackList(refreshToken);
    if (!token) {
      return false;
    }
    return true;
  }

  async addTokenInBlackList(refreshToken: string): Promise<boolean> {
    return await this.jwtRepository.addTokenInBlackList(refreshToken);
  }

  async createJWT(
    userId: string,
    deviceId: string,
    timeToExpired: number,
  ): Promise<string> {
    try {
      return jwt.sign({ userId, deviceId }, settings.JWT_SECRET, {
        expiresIn: `${timeToExpired}s`,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async createToken(
    userId: string,
    deviceId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.createJWT(
      userId,
      deviceId,
      Number(settings.timeLife.ACCESS_TOKEN),
    );
    const refreshToken = await this.createJWT(
      userId,
      deviceId,
      Number(settings.timeLife.REFRESH_TOKEN),
    );

    return { accessToken, refreshToken };
  }
}
