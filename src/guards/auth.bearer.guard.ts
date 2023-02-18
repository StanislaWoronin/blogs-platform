import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException, Inject
} from "@nestjs/common";
import { UsersService } from '../modules/super-admin/application/users.service';
import { JwtService } from '../modules/public/auth/application/jwt.service';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-query-users.repository';
import { IQueryUsersRepository } from "../modules/super-admin/infrastructure/i-query-users.repository";

@Injectable()
export class AuthBearerGuard implements CanActivate {
  constructor(
    protected jwtService: JwtService,
    @Inject(IQueryUsersRepository) protected queryUsersRepository: IQueryUsersRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }

    const accessToken = req.headers.authorization.split(' ')[1];
    const tokenPayload = await this.jwtService.getTokenPayload(accessToken);

    if (!tokenPayload) {
      throw new UnauthorizedException();
    }

    const user = await this.queryUsersRepository.getUserById(
      tokenPayload.userId,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    req.user = user;
    req.token = tokenPayload;
    return true;
  }
}
