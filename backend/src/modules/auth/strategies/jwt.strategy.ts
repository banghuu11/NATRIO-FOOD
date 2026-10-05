import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'nutrio_healthy_food_jwt_super_secret_key_2026'),
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(payload.sub) },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!user || !user.is_active || user.deleted_at) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    return {
      id: Number(user.id),
      email: user.email,
      fullName: user.full_name,
      roles: user.user_roles.map((ur) => ur.roles.code),
    };
  }
}
