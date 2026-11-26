import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../core/mail.service';
import { ChangePasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { STAFF_ROLES } from '../../common/permissions';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  /** Loads role & permission codes for a user. */
  async loadAccess(userId: bigint) {
    const roles = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: { include: { role_permissions: { include: { permissions: true } } } } },
    });
    const roleCodes = roles.map((r) => r.roles.code);
    const permissions = [...new Set(roles.flatMap((r) => r.roles.role_permissions.map((rp) => rp.permissions.code)))];
    return { roles: roleCodes, permissions, isStaff: roleCodes.some((r) => STAFF_ROLES.includes(r)) };
  }

  private async session(user: { id: bigint; email: string; full_name: string; avatar_url: string | null; phone: string | null }) {
    const access = await this.loadAccess(user.id);
    return {
      accessToken: this.jwtService.sign({ sub: Number(user.id), email: user.email }),
      user: {
        id: Number(user.id),
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        ...access,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.users.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email này đã được sử dụng');
    if (dto.phone && (await this.prisma.users.findUnique({ where: { phone: dto.phone } }))) {
      throw new BadRequestException('Số điện thoại này đã được sử dụng');
    }

    const referrer = dto.referralCode
      ? await this.prisma.users.findUnique({ where: { referral_code: dto.referralCode.toUpperCase() } })
      : null;
    const customerRole = await this.prisma.roles.findUnique({ where: { code: 'customer' } });

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.users.create({
        data: {
          email: dto.email,
          full_name: dto.fullName,
          phone: dto.phone || null,
          password_hash: await bcrypt.hash(dto.password, 10),
          referred_by: referrer?.id ?? null,
          user_roles: customerRole ? { create: { role_id: customerRole.id } } : undefined,
        },
      });
      if (referrer) await tx.referrals.create({ data: { referrer_id: referrer.id, referee_id: u.id } });
      // loyalty account + notification preferences are created by DB trigger trg_user_bootstrap
      await tx.notifications.create({
        data: { user_id: u.id, type: 'system', title: 'Chào mừng bạn đến với NUTRIO!', body: 'Dùng mã WELCOME10 để được giảm 10% cho đơn hàng đầu tiên.' },
      });
      return u;
    });

    return { message: 'Đăng ký tài khoản thành công', ...(await this.session(user)) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({ where: { email: dto.email } });
    const ok = user?.password_hash ? await bcrypt.compare(dto.password, user.password_hash) : false;
    if (!user || !ok) throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    if (!user.is_active || user.deleted_at) throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ CSKH.');

    await this.prisma.users.update({ where: { id: user.id }, data: { last_login_at: new Date() } });
    return { message: 'Đăng nhập thành công', ...(await this.session(user)) };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
      include: { loyalty_accounts: { include: { membership_tiers: true } }, health_profiles: true },
    });
    if (!user) throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
    const access = await this.loadAccess(user.id);
    const tier = user.loyalty_accounts?.membership_tiers;

    return {
      id: Number(user.id),
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      gender: user.gender,
      dateOfBirth: user.date_of_birth,
      referralCode: user.referral_code,
      createdAt: user.created_at,
      ...access,
      loyalty: user.loyalty_accounts
        ? {
            pointsBalance: user.loyalty_accounts.points_balance,
            lifetimePoints: user.loyalty_accounts.lifetime_points,
            tierCode: tier?.code ?? null,
            tier: tier?.name ?? null,
            discountPercent: Number(tier?.discount_percent || 0),
          }
        : null,
      hasHealthProfile: !!user.health_profiles,
    };
  }

  async forgotPassword(email: string) {
    const generic = { message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' };
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user || !user.is_active) return generic;

    const token = randomBytes(32).toString('hex');
    await this.prisma.verification_tokens.updateMany({
      where: { user_id: user.id, purpose: 'reset_password', used_at: null },
      data: { used_at: new Date() },
    });
    await this.prisma.verification_tokens.create({
      data: { user_id: user.id, token_hash: sha256(token), purpose: 'reset_password', expires_at: new Date(Date.now() + 30 * 60 * 1000) },
    });

    const link = `${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${token}`;
    const sent = await this.mail.send(
      user.email,
      'Đặt lại mật khẩu NUTRIO',
      this.mail.layout('Đặt lại mật khẩu', `<p>Xin chào ${user.full_name},</p><p>Nhấn vào liên kết dưới đây để đặt lại mật khẩu (hiệu lực 30 phút):</p><p><a href="${link}">${link}</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`),
    );

    // Demo mode: no SMTP and not production → return the link so the flow can be tested.
    if (!sent && this.config.get('NODE_ENV') !== 'production') {
      this.logger.warn(`Reset link (demo, SMTP chưa cấu hình): ${link}`);
      return { ...generic, demoResetLink: link };
    }
    return generic;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const rec = await this.prisma.verification_tokens.findUnique({ where: { token_hash: sha256(dto.token) } });
    if (!rec || rec.purpose !== 'reset_password' || rec.used_at || rec.expires_at < new Date()) {
      throw new BadRequestException('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }
    await this.prisma.$transaction([
      this.prisma.users.update({ where: { id: rec.user_id }, data: { password_hash: await bcrypt.hash(dto.password, 10) } }),
      this.prisma.verification_tokens.update({ where: { id: rec.id }, data: { used_at: new Date() } }),
    ]);
    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { id: BigInt(userId) } });
    if (!user?.password_hash || !(await bcrypt.compare(dto.currentPassword, user.password_hash))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    if (dto.currentPassword === dto.newPassword) throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    await this.prisma.users.update({ where: { id: user.id }, data: { password_hash: await bcrypt.hash(dto.newPassword, 10) } });
    return { message: 'Đổi mật khẩu thành công' };
  }
}
