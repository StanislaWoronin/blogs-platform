import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SecurityService } from '../application/security.service';
import { RefreshTokenValidationGuard } from '../../../../guards/refresh-token-validation.guard';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { User } from '../../../../decorator/user.decorator';
import { ViewSecurityDeviseModel } from './dto/viewSecurityDeviseModel';
import { IQuerySecurityRepository } from '../infrastructure/i-query-security.repository';

@Controller('security/devices')
export class SecurityController {
  constructor(
    protected securityService: SecurityService,
    @Inject(IQuerySecurityRepository)
    protected querySecurityRepository: IQuerySecurityRepository,
  ) {}

  @UseGuards(RefreshTokenValidationGuard)
  @Get()
  async getAllActiveSessions(
    @User() user: UserDBModel,
  ): Promise<ViewSecurityDeviseModel[]> {
    return await this.querySecurityRepository.getAllActiveSessions(user.id);
  }

  @UseGuards(RefreshTokenValidationGuard)
  @Delete()
  @HttpCode(204)
  async deleteActiveSessions(@Req() req: Request) {
    const result = await this.securityService.deleteAllActiveSessions(
      req.user.id,
      req.tokenPayload.deviceId,
    );

    if (!result) {
      throw new NotFoundException();
    }

    return;
  }

  @UseGuards(RefreshTokenValidationGuard)
  @Delete(':id')
  @HttpCode(204)
  async deleteActiveSessionsById(
    @Param('id') deviceId: string,
    @User() user: UserDBModel,
  ) {
    const userDevice = await this.querySecurityRepository.getDeviseById(
      deviceId,
    );

    if (!userDevice) {
      throw new NotFoundException();
    }

    if (userDevice.userId !== user.id) {
      throw new ForbiddenException(); // 403
    }

    const isDeleted = await this.securityService.deleteDeviceById(deviceId);

    if (!isDeleted) {
      throw new NotFoundException();
    }

    return;
  }
}
