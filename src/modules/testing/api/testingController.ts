import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Put,
} from '@nestjs/common';
import { JwtService } from '../../public/auth/application/jwt.service';
import { ITestingRepository } from '../infrastructure/i-testing.repository';
import { TokenPayloadModel } from '../../../global-model/token-payload.model';
import {S3FileStorageAdapter} from "../../blogger/adapter/s3-file-storage.adapter";

@Controller('testing')
export class TestingController {
  constructor(
    @Inject(ITestingRepository) protected testingRepository: ITestingRepository,
    private jwtService: JwtService,
    private s3FileStorageAdapter: S3FileStorageAdapter,
  ) {}

  @Get('confirmation-code/:userId')
  async getConfirmationCode(@Param('userId') userId: string) {
    return await this.testingRepository.getConfirmationCode(userId);
  }

  @Get('is-confirmed/:userId')
  async checkUserConfirmed(@Param('userId') userId: string) {
    return await this.testingRepository.checkUserConfirmed(userId);
  }

  @Get('user-password/:userId')
  async getUserPassword(@Param('userId') userId: string) {
    return await this.testingRepository.getUserPassword(userId);
  }

  @Get('expired-token/:token')
  async getExpiredToken(
    @Param('token') token: string,
  ): Promise<{ expiredToken: string }> {
    const tokenPayload = await this.jwtService.getTokenPayload(token);

    return {
      expiredToken: await this.jwtService.createJWT(
        tokenPayload.userId,
        tokenPayload.deviceId,
        0,
      ),
    };
  }

  @Get('payload/:token')
  async getPayload(@Param('token') token: string): Promise<TokenPayloadModel> {
    return await this.jwtService.getTokenPayload(token);
  }

  @Put('set-expiration-date/:userId')
  @HttpCode(204)
  async makeExpired(@Param('userId') userId: string): Promise<boolean> {
    const expirationDate = new Date(Date.now() - 48 * 1000).toISOString();

    return await this.testingRepository.makeExpired(userId, expirationDate);
  }

  @Delete('all-data')
  @HttpCode(204)
  async deleteAll(): Promise<boolean> {
    await this.testingRepository.deleteAll();
    // await this.s3FileStorageAdapter.deleteImage('content');

    return
  }
}
