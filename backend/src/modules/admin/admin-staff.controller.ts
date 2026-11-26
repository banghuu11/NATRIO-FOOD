import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS, STAFF_ROLES, SUPER_ADMIN_ROLE } from '../../common/permissions';
import { PASSWORD_MESSAGE, PASSWORD_RULE } from '../auth/dto/auth.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

class CreateStaffDto {
  @ApiProperty() @Transform(({ value }) => String(value ?? '').trim().toLowerCase()) @IsEmail({}, { message: 'Email không hợp lệ' }) email: string;
  @ApiProperty() @Transform(({ value }) => String(value ?? '').trim()) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập họ tên' }) @MaxLength(150) fullName: string;
  @ApiProperty() @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE }) password: string;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1, { message: 'Chọn ít nhất một vai trò' }) @IsString({ each: true }) roles: string[];
}

class RolesDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1, { message: 'Chọn ít nhất một vai trò' }) @IsString({ each: true }) roles: string[];
}

class PermissionsDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) permissions: string[];
}

const PERMISSION_LABEL: Record<string, string> = {
  'dashboard.view': 'Xem tổng quan',
  'product.read': 'Xem sản phẩm',
  'product.write': 'Thêm / sửa / xóa sản phẩm',
  'category.write': 'Quản lý danh mục',
  'order.read': 'Xem đơn hàng',
  'order.update': 'Cập nhật trạng thái đơn',
  'payment.confirm': 'Xác nhận thanh toán / hoàn tiền',
  'customer.read': 'Xem khách hàng & yêu cầu tư vấn',
  'customer.manage': 'Khóa / mở khóa khách hàng',
  'inventory.manage': 'Quản lý kho',
  'coupon.manage': 'Quản lý khuyến mãi',
  'content.manage': 'Quản lý nội dung',
  'review.moderate': 'Kiểm duyệt đánh giá',
  'report.view': 'Xem & xuất báo cáo',
  'user.manage': 'Quản lý nhân viên & phân quyền',
};

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@RequirePermissions(PERMISSIONS.USER_MANAGE)
@Controller('admin')
export class AdminStaffController {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
  ) {}

  @Get('staff')
  async staff() {
    const rows = await this.prisma.users.findMany({
      where: { deleted_at: null, user_roles: { some: { roles: { code: { in: STAFF_ROLES } } } } },
      include: { user_roles: { include: { roles: true } } },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((u) => ({ id: Number(u.id), email: u.email, fullName: u.full_name, isActive: u.is_active, lastLoginAt: u.last_login_at, roles: u.user_roles.map((r) => ({ code: r.roles.code, name: r.roles.name })) }));
  }

  @Post('staff')
  async createStaff(@Body() dto: CreateStaffDto, @CurrentUser() me: CurrentUserPayload) {
    this.assertRoles(dto.roles, me);
    if (await this.prisma.users.findUnique({ where: { email: dto.email } })) throw new ConflictException('Email đã được sử dụng');
    const roles = await this.prisma.roles.findMany({ where: { code: { in: dto.roles } } });
    await this.prisma.users.create({
      data: {
        email: dto.email, full_name: dto.fullName, password_hash: await bcrypt.hash(dto.password, 10), email_verified_at: new Date(),
        user_roles: { create: roles.map((r) => ({ role_id: r.id })) },
      },
    });
    return { message: 'Đã tạo tài khoản nhân viên' };
  }

  @Put('staff/:id/roles')
  async setRoles(@Param('id', ParseIntPipe) id: number, @Body() dto: RolesDto, @CurrentUser() me: CurrentUserPayload) {
    this.assertRoles(dto.roles, me);
    if (id === me.id && !dto.roles.includes(SUPER_ADMIN_ROLE) && me.roles.includes(SUPER_ADMIN_ROLE)) throw new BadRequestException('Bạn không thể tự gỡ quyền Super Admin của chính mình');
    const user = await this.prisma.users.findUnique({ where: { id: BigInt(id) } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    const roles = await this.prisma.roles.findMany({ where: { code: { in: dto.roles } } });
    await this.prisma.$transaction([
      this.prisma.user_roles.deleteMany({ where: { user_id: user.id } }),
      this.prisma.user_roles.createMany({ data: roles.map((r) => ({ user_id: user.id, role_id: r.id })) }),
    ]);
    return { message: 'Đã cập nhật vai trò' };
  }

  private assertRoles(codes: string[], me: CurrentUserPayload) {
    const invalid = codes.filter((c) => ![...STAFF_ROLES, 'customer'].includes(c));
    if (invalid.length) throw new BadRequestException(`Vai trò không hợp lệ: ${invalid.join(', ')}`);
    if (codes.includes(SUPER_ADMIN_ROLE) && !me.roles.includes(SUPER_ADMIN_ROLE)) throw new ForbiddenException('Chỉ Super Admin mới có thể cấp quyền Super Admin');
  }

  @Get('roles')
  async roles() {
    const [roles, perms] = await Promise.all([
      this.prisma.roles.findMany({ include: { role_permissions: { include: { permissions: true } }, _count: { select: { user_roles: true } } }, orderBy: { id: 'asc' } }),
      this.prisma.permissions.findMany({ orderBy: { id: 'asc' } }),
    ]);
    return {
      roles: roles.filter((r) => r.code !== 'customer').map((r) => ({ code: r.code, name: r.name, description: r.description, userCount: r._count.user_roles, editable: r.code !== SUPER_ADMIN_ROLE, permissions: r.role_permissions.map((rp) => rp.permissions.code) })),
      permissions: perms.map((p) => ({ code: p.code, label: PERMISSION_LABEL[p.code] ?? p.description ?? p.code })),
    };
  }

  @Put('roles/:code/permissions')
  async setPermissions(@Param('code') code: string, @Body() dto: PermissionsDto) {
    if (code === SUPER_ADMIN_ROLE) throw new BadRequestException('Super Admin luôn có toàn quyền');
    if (code === 'customer') throw new BadRequestException('Không thể cấp quyền quản trị cho vai trò khách hàng');
    const role = await this.prisma.roles.findUnique({ where: { code } });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    const perms = await this.prisma.permissions.findMany({ where: { code: { in: dto.permissions } } });
    await this.prisma.$transaction([
      this.prisma.role_permissions.deleteMany({ where: { role_id: role.id } }),
      this.prisma.role_permissions.createMany({ data: perms.map((p) => ({ role_id: role.id, permission_id: p.id })) }),
    ]);
    return { message: 'Đã cập nhật quyền cho vai trò' };
  }

  @Post('subscriptions/run')
  @HttpCode(200)
  runSubscriptions() {
    return this.subscriptions.processDue();
  }
}
