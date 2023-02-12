import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../modules/super-admin/application/users.service';
import { JwtService } from '../modules/public/auth/application/jwt.service';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg-query-users.repository';
import { log } from "util";

@Injectable()
export class RefreshTokenValidationGuard implements CanActivate {
  constructor(
    protected jwtService: JwtService,
    protected queryUsersRepository: PgQueryUsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (!req.cookies.refreshToken) {
      // console.log('Отсутствует токен в req.cookies.refreshToken')
      throw new UnauthorizedException();
    }

    const tokenInBlackList = await this.jwtService.checkTokenInBlackList(
      req.cookies.refreshToken,
    );

    if (tokenInBlackList) {
      // console.log('Токен в чернм списке')
      throw new UnauthorizedException();
    }

    const tokenPayload = await this.jwtService.getTokenPayload(
      req.cookies.refreshToken,
    );

    if (!tokenPayload) {
      // console.log('Токен не рассекретился')
      throw new UnauthorizedException();
    }

    const user = await this.queryUsersRepository.getUserById(
      tokenPayload.userId,
    );

    if (!user) {
      // console.log('Пользовотель не нашелся')
      throw new UnauthorizedException();
    }

    req.user = user;
    req.tokenPayload = tokenPayload;
    return true;
  }
}
