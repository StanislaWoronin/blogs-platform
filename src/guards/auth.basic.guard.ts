import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { settings } from '../settings';

@Injectable()
export class AuthBasicGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const base64 = Buffer.from(
      `${settings.basic.USER}:${settings.basic.PASS}`,
    ).toString('base64');
    const validAuthHeader = `Basic ${base64}`;

    if (authHeader !== validAuthHeader) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
