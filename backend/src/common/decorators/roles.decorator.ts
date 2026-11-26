import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/** Require at least one of the given role codes. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
/** Require ALL given permission codes (Super Admin always passes). */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Route is reachable without a token. If a valid token is sent anyway,
 * `request.user` is still populated (used for guest-or-user endpoints).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
