import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

/** Injects the authenticated user (or `undefined` on public routes without a token). */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload | undefined;
    return data && user ? user[data] : user;
  },
);
