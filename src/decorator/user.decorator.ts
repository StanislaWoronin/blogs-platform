import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    // const request = ctx.switchToHttp().getRequest();
    // const user = request.user;
    //
    // return data ? user?.[data] : user;
    const request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      throw new Error('AuthBearerGuard must be used');
    }

    return request.user;
  },
);
