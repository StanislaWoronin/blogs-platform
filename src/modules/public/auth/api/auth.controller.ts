import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  NotFoundException,
  NotImplementedException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../application/auth.service';
import { SecurityService } from '../../security/application/security.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RegistrationConfirmationDTO } from './dto/registration-confirmation.dto';
import { EmailManager } from '../email-transfer/email.manager';
import { UsersService } from '../../../super-admin/application/users.service';
import { AuthBearerGuard } from '../../../../guards/auth.bearer.guard';
import { UserDBModel } from '../../../super-admin/infrastructure/entity/userDB.model';
import { User } from '../../../../decorator/user.decorator';
import { toAboutMeViewModel } from '../../../../data-mapper/to-about-me-view.model';
import { CheckCredentialGuard } from '../../../../guards/check-credential.guard';
import { RefreshTokenValidationGuard } from '../../../../guards/refresh-token-validation.guard';
import { PgQueryUsersRepository } from '../../../super-admin/infrastructure/pg-query-users.repository';
import { CreateUserUseCase } from '../../../super-admin/use-cases/create-user.use-case';
import { PgEmailConfirmationRepository } from '../../../super-admin/infrastructure/pg-email-confirmation.repository';
import { ResendingDto } from './dto/resending.dto';
import { AuthDto } from './dto/auth.dto';
import { EmailDto } from './dto/email.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { UserDto } from '../../../super-admin/api/dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    protected authService: AuthService,
    protected createUserUseCase: CreateUserUseCase,
    protected emailManager: EmailManager,
    protected emailConfirmationRepository: PgEmailConfirmationRepository,
    protected securityService: SecurityService,
    protected userService: UsersService,
    protected queryUsersRepository: PgQueryUsersRepository,
  ) {}

  @UseGuards(AuthBearerGuard)
  @Get('me')
  aboutMe(@User() user: UserDBModel) {
    return toAboutMeViewModel(user);
  }

  //@Throttle(5, 10)
  @UseGuards(/*ThrottlerGuard,*/ CheckCredentialGuard)
  @Post('login')
  async createUser(
    @Body() dto: AuthDto,
    @Ip() ipAddress: string,
    @User() user: UserDBModel,
    @Res() res: Response,
    @Headers('user-agent') title: string,
  ) {
    const token = await this.securityService.createUserDevice(
      user.id,
      title,
      ipAddress,
    );

    return res
      .status(200)
      .cookie('refreshToken', token.refreshToken, {
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .send({ accessToken: token.accessToken });
  }

  @Post('password-recovery')
  @HttpCode(204)
  async passwordRecovery(@Body() dto: EmailDto) {
    const user = await this.queryUsersRepository.getUserByLoginOrEmail(
      dto.email,
    );

    if (user) {
      const result = await this.authService.sendPasswordRecovery(
        user.id,
        dto.email,
      );

      if (!result) {
        throw new Error('Something went wrong.');
      }
    }

    return;
  }

  @Post('new-password')
  @HttpCode(204)
  async createNewPassword(@Body() dto: NewPasswordDto, @Req() req: Request) {
    const userId = req.emailConfirmation.userId;
    const user = await this.queryUsersRepository.getUserById(userId);

    if (!user) {
      throw new NotFoundException();
    }

    const result = await this.userService.updateUserPassword(
      userId,
      dto.newPassword,
    );

    if (!result) {
      throw new NotImplementedException();
    }

    return;
  }

  // @Throttle(5, 10)
  // @UseGuards(ThrottlerGuard)
  @Post('registration')
  @HttpCode(204)
  async registration(@Body() dto: UserDto) {
    await this.createUserUseCase.execute(dto);

    return;
  }

  // @Throttle(5, 10)
  // @UseGuards(ThrottlerGuard)
  @Post('registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(@Body() dto: RegistrationConfirmationDTO) {
    const result =
      await this.emailConfirmationRepository.updateConfirmationInfo(dto.code);

    if (!result) {
      throw new NotImplementedException();
    }

    return;
  }

  // @Throttle(5, 10)
  // @UseGuards(ThrottlerGuard)
  @Post('registration-email-resending')
  @HttpCode(204)
  async registrationEmailResending(
    @Body() email: ResendingDto,
    @Req() req: Request,
  ): Promise<void> {
    const newConfirmationCode = await this.authService.updateConfirmationCode(
      req.user.id,
    );

    if (!newConfirmationCode) {
      throw new NotImplementedException();
    }

    return await this.emailManager.sendConfirmationEmail(
      req.user.email,
      newConfirmationCode,
    );
  }

  @UseGuards(RefreshTokenValidationGuard)
  @Post('refresh-token')
  async createRefreshToken(@Req() req: Request, @Res() res: Response) {
    const token = await this.securityService.createNewRefreshToken(
      req.cookies.refreshToken,
      req.tokenPayload,
    );

    res
      .status(200)
      .cookie('refreshToken', token.refreshToken, {
        secure: true,
        httpOnly: true,
      })
      .send({ accessToken: token.accessToken });
  }

  @UseGuards(RefreshTokenValidationGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request) {
    await this.securityService.logoutFromCurrentSession(
      req.cookies.refreshToken,
    );

    return;
  }
}
