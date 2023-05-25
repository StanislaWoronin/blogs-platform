import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UserDBModel } from '../modules/super-admin/infrastructure/entity/userDB.model';
import { PgQueryUsersRepository } from '../modules/super-admin/infrastructure/pg.repository/pg-query-users.repository';
import { IBanInfoRepository } from '../modules/super-admin/infrastructure/i-ban-info.repository';
import { IQueryUsersRepository } from '../modules/super-admin/infrastructure/i-query-users.repository';

@Injectable()
export class CheckCredentialGuard implements CanActivate {
  constructor(
    @Inject(IBanInfoRepository) protected banInfoRepository: IBanInfoRepository,
    @Inject(IQueryUsersRepository)
    protected queryUsersRepository: IQueryUsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const user: UserDBModel | null =
      await this.queryUsersRepository.getUserByLoginOrEmail(
        req.body.loginOrEmail,
      );

    if (!user) {
      throw new UnauthorizedException();
    }

    const banInfo = await this.banInfoRepository.getBanInfo(user.id);

    if (banInfo.isBanned) {
      throw new UnauthorizedException();
    }

    const passwordEqual = await bcrypt.compare(
      req.body.password,
      user.passwordHash,
    );

    if (!passwordEqual) {
      throw new UnauthorizedException();
    }

    req.user = user;
    return true;
  }
}
