import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email này đã được sử dụng');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    let referredById: bigint | null = null;
    if (dto.referralCode) {
      const referrer = await this.prisma.users.findUnique({
        where: { referral_code: dto.referralCode.toUpperCase() },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Role mặc định customer
    const customerRole = await this.prisma.roles.findUnique({
      where: { code: 'customer' },
    });

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        full_name: dto.fullName,
        phone: dto.phone,
        password_hash: passwordHash,
        referred_by: referredById,
        user_roles: customerRole
          ? {
              create: {
                role_id: customerRole.id,
              },
            }
          : undefined,
      },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    // Tạo bản ghi tích điểm và thiết lập nếu trigger DB chưa bắt
    const defaultTier = await this.prisma.membership_tiers.findFirst({
      orderBy: { min_points: 'asc' },
    });

    if (defaultTier) {
      await this.prisma.loyalty_accounts.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          tier_id: defaultTier.id,
          points_balance: 0,
          lifetime_points: 0,
        },
      });
    }

    const token = this.generateToken(Number(user.id), user.email);

    return {
      message: 'Đăng ký tài khoản thành công',
      accessToken: token,
      user: {
        id: Number(user.id),
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        referralCode: user.referral_code,
        roles: user.user_roles.map((ur) => ur.roles.code),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (!user.is_active || user.deleted_at) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động');
    }

    // Cập nhật last login
    await this.prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const token = this.generateToken(Number(user.id), user.email);

    return {
      message: 'Đăng nhập thành công',
      accessToken: token,
      user: {
        id: Number(user.id),
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        roles: user.user_roles.map((ur) => ur.roles.code),
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
        loyalty_accounts: {
          include: {
            membership_tiers: true,
          },
        },
        health_profiles: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
    }

    return {
      id: Number(user.id),
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      gender: user.gender,
      dateOfBirth: user.date_of_birth,
      referralCode: user.referral_code,
      roles: user.user_roles.map((ur) => ur.roles.code),
      loyalty: user.loyalty_accounts
        ? {
            pointsBalance: user.loyalty_accounts.points_balance,
            lifetimePoints: user.loyalty_accounts.lifetime_points,
            tier: user.loyalty_accounts.membership_tiers?.name,
            discountPercent: Number(user.loyalty_accounts.membership_tiers?.discount_percent || 0),
          }
        : null,
      healthProfile: user.health_profiles
        ? {
            heightCm: Number(user.health_profiles.height_cm),
            weightKg: Number(user.health_profiles.weight_kg),
            targetWeightKg: user.health_profiles.target_weight_kg ? Number(user.health_profiles.target_weight_kg) : null,
            activityLevel: user.health_profiles.activity_level,
            goal: user.health_profiles.goal,
            bmi: user.health_profiles.bmi ? Number(user.health_profiles.bmi) : null,
            bmr: user.health_profiles.bmr ? Number(user.health_profiles.bmr) : null,
            tdee: user.health_profiles.tdee ? Number(user.health_profiles.tdee) : null,
            dailyCalorieTarget: user.health_profiles.daily_calorie_target ? Number(user.health_profiles.daily_calorie_target) : null,
          }
        : null,
    };
  }

  private generateToken(userId: number, email: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }
}
