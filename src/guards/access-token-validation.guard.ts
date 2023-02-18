import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-query-users.repository';
import { JwtService } from '../modules/public/auth/application/jwt.service';
import { IQueryUsersRepository } from "../modules/super-admin/infrastructure/i-query-users.repository";

@Injectable()
export class AccessTokenValidationGuard implements CanActivate {
  constructor(
    protected jwtService: JwtService,
    @Inject(IQueryUsersRepository) protected queryUsersRepository: IQueryUsersRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (req.headers.authorization) {
      const accessToken = req.headers.authorization.split(' ')[1];
      const tokenPayload = await this.jwtService.getTokenPayload(accessToken);

      if (tokenPayload) {
        const user = await this.queryUsersRepository.getUserById(
          tokenPayload.userId,
        );

        if (user) {
          req.user = user;
          req.token = tokenPayload;
        }
      }
    }

    return true;
  }
}
