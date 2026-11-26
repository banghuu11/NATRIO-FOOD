import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';

/**
 * Registered globally. Every route needs a valid JWT unless marked @Public().
 * On @Public() routes a valid token is optional: the user is attached when present.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  private isPublic(context: ExecutionContext) {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
  }

  canActivate(context: ExecutionContext) {
    if (this.isPublic(context)) {
      const req = context.switchToHttp().getRequest();
      if (!req.headers?.authorization) return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, _info: any, context: ExecutionContext): TUser {
    if (this.isPublic(context)) return (user || undefined) as TUser;
    if (err || !user) {
      throw err instanceof UnauthorizedException ? err : new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
    }
    return user;
  }
}
