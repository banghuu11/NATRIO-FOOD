import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS, STAFF_ROLES, SUPER_ADMIN_ROLE } from '../../common/permissions';
import { ORDER_STATUS_LABEL } from '../orders/order-status';

/** Customer segment from spend, recency and tenure. */
function segment(spent: number, orders: number, lastOrder: Date | null, createdAt: Date) {
  const days = (d: Date) => (Date.now() - new Date(d).getTime()) / 864e5;
  if (spent >= 3_000_000) return { code: 'vip', label: 'VIP' };
  if (orders >= 3 && lastOrder && days(lastOrder) <= 60) return { code: 'loyal', label: 'Trung thành' };
  if (orders > 0 && lastOrder && days(lastOrder) > 90) return { code: 'dormant', label: 'Lâu chưa mua' };
  if (orders === 0) return { code: days(createdAt) <= 30 ? 'new' : 'prospect', label: days(createdAt) <= 30 ? 'Khách mới' : 'Chưa mua hàng' };
  return { code: 'regular', label: 'Thường xuyên' };
}

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  async list(@Query('q') q?: string, @Query('status') status?: string, @Query('tier') tier?: string, @Query('sort') sort = 'recent', @Query('page') pageStr?: string) {
    const page = Math.max(1, Number(pageStr) || 1);
    const limit = 20;
    const search = q?.trim() ? `%${q.trim()}%` : null;
    const order =
      sort === 'spent' ? Prisma.sql`spent DESC` : sort === 'orders' ? Prisma.sql`orders DESC` : Prisma.sql`u.created_at DESC`;
    const filters = Prisma.sql`
      u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.code = 'customer')
      ${search ? Prisma.sql`AND (u.full_name ILIKE ${search} OR u.email::text ILIKE ${search} OR u.phone ILIKE ${search})` : Prisma.empty}
      ${status === 'locked' ? Prisma.sql`AND NOT u.is_active` : status === 'active' ? Prisma.sql`AND u.is_active` : Prisma.empty}
      ${tier ? Prisma.sql`AND t.code = ${tier}` : Prisma.empty}`;
    const [rows, totalRow] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.is_active, u.created_at, u.last_login_at,
               t.name AS tier_name, t.code AS tier_code, la.points_balance,
               COUNT(o.id) FILTER (WHERE o.status IN ('delivered','completed'))::int AS orders,
               COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ('delivered','completed')),0)::float AS spent,
               MAX(o.placed_at) AS last_order_at
        FROM users u
        LEFT JOIN loyalty_accounts la ON la.user_id = u.id
        LEFT JOIN membership_tiers t ON t.id = la.tier_id
        LEFT JOIN orders o ON o.user_id = u.id
        WHERE ${filters}
        GROUP BY u.id, t.name, t.code, la.points_balance
        ORDER BY ${order}
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      this.prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM users u LEFT JOIN loyalty_accounts la ON la.user_id = u.id LEFT JOIN membership_tiers t ON t.id = la.tier_id WHERE ${filters}`,
    ]);
    const total = totalRow[0]?.n ?? 0;
    return {
      data: rows.map((r) => ({
        id: Number(r.id), fullName: r.full_name, email: r.email, phone: r.phone, avatarUrl: r.avatar_url, isActive: r.is_active,
        createdAt: r.created_at, lastLoginAt: r.last_login_at, tier: r.tier_name, tierCode: r.tier_code, points: r.points_balance ?? 0,
        orders: r.orders, spent: r.spent, lastOrderAt: r.last_order_at, segment: segment(r.spent, r.orders, r.last_order_at, r.created_at),
      })),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  async detail(@Param('id', ParseIntPipe) id: number) {
    const u = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
      include: {
        addresses: true,
        loyalty_accounts: { include: { membership_tiers: true } },
        health_profiles: true,
        user_allergens: { include: { allergens: true } },
        user_roles: { include: { roles: true } },
        orders: { orderBy: { placed_at: 'desc' }, take: 50 },
        reviews: { orderBy: { created_at: 'desc' }, take: 10, include: { products: { select: { name: true } } } },
      },
    });
    if (!u || u.deleted_at) throw new NotFoundException('Không tìm thấy khách hàng');
    const done = u.orders.filter((o) => ['delivered', 'completed'].includes(o.status));
    const spent = done.reduce((s, o) => s + Number(o.total_amount), 0);
    return {
      id: Number(u.id), fullName: u.full_name, email: u.email, phone: u.phone, avatarUrl: u.avatar_url, gender: u.gender, dateOfBirth: u.date_of_birth,
      isActive: u.is_active, createdAt: u.created_at, lastLoginAt: u.last_login_at, roles: u.user_roles.map((r) => r.roles.code),
      tier: u.loyalty_accounts?.membership_tiers?.name ?? null, points: u.loyalty_accounts?.points_balance ?? 0, lifetimePoints: u.loyalty_accounts?.lifetime_points ?? 0,
      stats: { totalOrders: u.orders.length, completedOrders: done.length, spent, averageOrder: done.length ? Math.round(spent / done.length) : 0 },
      segment: segment(spent, done.length, u.orders[0]?.placed_at ?? null, u.created_at),
      addresses: u.addresses.map((a) => ({ id: Number(a.id), label: a.label, recipientName: a.recipient_name, phone: a.phone, address: [a.street, a.ward, a.district, a.province].join(', '), isDefault: a.is_default })),
      health: u.health_profiles ? { heightCm: Number(u.health_profiles.height_cm), weightKg: Number(u.health_profiles.weight_kg), goal: u.health_profiles.goal, tdee: Number(u.health_profiles.tdee), bmi: Number(u.health_profiles.bmi) } : null,
      allergens: u.user_allergens.map((a) => a.allergens.name_vi),
      orders: u.orders.map((o) => ({ id: Number(o.id), orderNumber: o.order_number, total: Number(o.total_amount), status: o.status, statusLabel: ORDER_STATUS_LABEL[o.status], placedAt: o.placed_at })),
      reviews: u.reviews.map((r) => ({ id: Number(r.id), product: r.products.name, rating: r.rating, content: r.content, status: r.status, createdAt: r.created_at })),
    };
  }

  @Patch(':id/lock')
  @RequirePermissions(PERMISSIONS.CUSTOMER_MANAGE)
  async lock(@Param('id', ParseIntPipe) id: number, @Body('locked') locked: boolean, @CurrentUser() me: CurrentUserPayload) {
    if (id === me.id) throw new BadRequestException('Bạn không thể tự khóa tài khoản của mình');
    const u = await this.prisma.users.findUnique({ where: { id: BigInt(id) }, include: { user_roles: { include: { roles: true } } } });
    if (!u) throw new NotFoundException('Không tìm thấy tài khoản');
    const isStaff = u.user_roles.some((r) => STAFF_ROLES.includes(r.roles.code));
    if (isStaff && !me.roles.includes(SUPER_ADMIN_ROLE)) throw new ForbiddenException('Chỉ Super Admin mới có thể khóa tài khoản nhân viên');
    await this.prisma.users.update({ where: { id: u.id }, data: { is_active: !locked } });
    return { message: locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' };
  }
}
