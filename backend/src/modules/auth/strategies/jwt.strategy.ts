import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Re-reads the user on every request so locking an account or changing roles applies immediately. */
  async validate(payload: { sub: number }): Promise<CurrentUserPayload> {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(payload.sub) },
      include: { user_roles: { include: { roles: { include: { role_permissions: { include: { permissions: true } } } } } } },
    });
    if (!user || !user.is_active || user.deleted_at) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }
    return {
      id: Number(user.id),
      email: user.email,
      fullName: user.full_name,
      roles: user.user_roles.map((ur) => ur.roles.code),
      permissions: [...new Set(user.user_roles.flatMap((ur) => ur.roles.role_permissions.map((rp) => rp.permissions.code)))],
    };
  }
}
