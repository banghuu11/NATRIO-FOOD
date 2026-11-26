import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { SUPER_ADMIN_ROLE } from '../permissions';

/** Registered globally after JwtAuthGuard. Enforces @Roles() and @RequirePermissions(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets) || [];
    const requiredPerms = this.reflector.getAllAndMerge<string[]>(PERMISSIONS_KEY, targets) || [];
    if (requiredRoles.length === 0 && requiredPerms.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    if (!user) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    if (user.roles.includes(SUPER_ADMIN_ROLE)) return true;

    if (requiredRoles.length && !requiredRoles.some((r) => user.roles.includes(r))) {
      throw new ForbiddenException('Tài khoản của bạn không có quyền truy cập chức năng này');
    }
    const missing = requiredPerms.filter((p) => !user.permissions.includes(p));
    if (missing.length) {
      throw new ForbiddenException(`Bạn không có quyền: ${missing.join(', ')}`);
    }
    return true;
  }
}
