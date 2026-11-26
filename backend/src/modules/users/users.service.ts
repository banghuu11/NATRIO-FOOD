import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { PricingService } from '../pricing/pricing.service';
import { AddressDto, UpdateProfileDto } from './dto/users.dto';

const addr = (a: any) => ({
  id: Number(a.id),
  label: a.label,
  recipientName: a.recipient_name,
  phone: a.phone,
  province: a.province,
  district: a.district,
  ward: a.ward,
  street: a.street,
  isDefault: a.is_default,
  fullAddress: [a.street, a.ward, a.district, a.province].join(', '),
});

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
    private pricing: PricingService,
  ) {}

  // ---------- Profile ----------
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const uid = BigInt(userId);
    if (dto.phone) {
      const other = await this.prisma.users.findFirst({ where: { phone: dto.phone, id: { not: uid } } });
      if (other) throw new BadRequestException('Số điện thoại đã được sử dụng bởi tài khoản khác');
    }
    if (dto.dateOfBirth && new Date(dto.dateOfBirth) >= new Date()) throw new BadRequestException('Ngày sinh phải trước ngày hôm nay');
    await this.prisma.users.update({
      where: { id: uid },
      data: {
        full_name: dto.fullName,
        phone: dto.phone,
        gender: dto.gender,
        date_of_birth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        avatar_url: dto.avatarUrl,
      },
    });
    // gender/age affect BMR – re-run the health-profile trigger
    if (dto.gender || dto.dateOfBirth) {
      await this.prisma.$executeRaw`UPDATE health_profiles SET updated_at = now() WHERE user_id = ${uid}`;
    }
    return { message: 'Cập nhật thông tin thành công' };
  }

  // ---------- Addresses ----------
  async addresses(userId: number) {
    const rows = await this.prisma.addresses.findMany({ where: { user_id: BigInt(userId) }, orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }] });
    return rows.map(addr);
  }

  async saveAddress(userId: number, dto: AddressDto, id?: number) {
    const uid = BigInt(userId);
    if (id) {
      const existing = await this.prisma.addresses.findFirst({ where: { id: BigInt(id), user_id: uid } });
      if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ');
    } else if ((await this.prisma.addresses.count({ where: { user_id: uid } })) >= 10) {
      throw new BadRequestException('Bạn chỉ có thể lưu tối đa 10 địa chỉ');
    }
    const isFirst = !id && (await this.prisma.addresses.count({ where: { user_id: uid } })) === 0;
    const data = {
      label: dto.label,
      recipient_name: dto.recipientName,
      phone: dto.phone,
      province: dto.province,
      district: dto.district,
      ward: dto.ward,
      street: dto.street,
      is_default: dto.isDefault || isFirst,
    };
    const saved = await this.prisma.$transaction(async (tx) => {
      if (data.is_default) await tx.addresses.updateMany({ where: { user_id: uid }, data: { is_default: false } });
      return id ? tx.addresses.update({ where: { id: BigInt(id) }, data }) : tx.addresses.create({ data: { ...data, user_id: uid } });
    });
    return addr(saved);
  }

  async deleteAddress(userId: number, id: number) {
    const a = await this.prisma.addresses.findFirst({ where: { id: BigInt(id), user_id: BigInt(userId) } });
    if (!a) throw new NotFoundException('Không tìm thấy địa chỉ');
    await this.prisma.addresses.delete({ where: { id: a.id } });
    if (a.is_default) {
      const next = await this.prisma.addresses.findFirst({ where: { user_id: a.user_id }, orderBy: { created_at: 'desc' } });
      if (next) await this.prisma.addresses.update({ where: { id: next.id }, data: { is_default: true } });
    }
    return { message: 'Đã xóa địa chỉ' };
  }

  // ---------- Wishlist (+ price-drop alert) ----------
  async wishlist(userId: number) {
    const rows = await this.prisma.wishlists.findMany({ where: { user_id: BigInt(userId) }, orderBy: { created_at: 'desc' } });
    const alerts = await this.prisma.product_alerts.findMany({ where: { user_id: BigInt(userId), alert_type: 'price_drop', is_active: true } });
    const cards = await this.products.cardsByIds(rows.map((r) => r.product_id));
    return cards.map((c) => {
      const alert = alerts.find((a) => Number(a.product_id) === c.id);
      return { ...c, priceAlert: !!alert, alertTargetPrice: alert?.target_price ? Number(alert.target_price) : null };
    });
  }

  async wishlistIds(userId: number) {
    const rows = await this.prisma.wishlists.findMany({ where: { user_id: BigInt(userId) }, select: { product_id: true } });
    return rows.map((r) => Number(r.product_id));
  }

  /** Adding to wishlist also subscribes to price-drop notifications for that product. */
  async addWishlist(userId: number, productId: number) {
    const p = await this.prisma.products.findFirst({ where: { id: BigInt(productId), status: 'active', deleted_at: null }, include: { product_variants: { where: { is_default: true }, take: 1 } } });
    if (!p) throw new NotFoundException('Sản phẩm không tồn tại');
    const uid = BigInt(userId);
    await this.prisma.wishlists.upsert({ where: { user_id_product_id: { user_id: uid, product_id: p.id } }, update: {}, create: { user_id: uid, product_id: p.id } });
    await this.prisma.product_alerts.upsert({
      where: { user_id_product_id_alert_type: { user_id: uid, product_id: p.id, alert_type: 'price_drop' } },
      update: { is_active: true, target_price: p.product_variants[0]?.price ?? null },
      create: { user_id: uid, product_id: p.id, alert_type: 'price_drop', target_price: p.product_variants[0]?.price ?? null },
    });
    return { message: 'Đã thêm vào danh sách yêu thích. Bạn sẽ được thông báo khi sản phẩm giảm giá.' };
  }

  async removeWishlist(userId: number, productId: number) {
    const uid = BigInt(userId);
    await this.prisma.wishlists.deleteMany({ where: { user_id: uid, product_id: BigInt(productId) } });
    await this.prisma.product_alerts.updateMany({ where: { user_id: uid, product_id: BigInt(productId), alert_type: 'price_drop' }, data: { is_active: false } });
    return { message: 'Đã xóa khỏi danh sách yêu thích' };
  }

  async togglePriceAlert(userId: number, productId: number, active: boolean) {
    const uid = BigInt(userId);
    const p = await this.prisma.products.findUnique({ where: { id: BigInt(productId) }, include: { product_variants: { where: { is_default: true }, take: 1 } } });
    if (!p) throw new NotFoundException('Sản phẩm không tồn tại');
    await this.prisma.product_alerts.upsert({
      where: { user_id_product_id_alert_type: { user_id: uid, product_id: p.id, alert_type: 'price_drop' } },
      update: { is_active: active, target_price: p.product_variants[0]?.price ?? null },
      create: { user_id: uid, product_id: p.id, alert_type: 'price_drop', is_active: active, target_price: p.product_variants[0]?.price ?? null },
    });
    return { message: active ? 'Đã bật thông báo giảm giá' : 'Đã tắt thông báo giảm giá' };
  }

  // ---------- Notifications ----------
  async notifications(userId: number, page = 1) {
    const where = { user_id: BigInt(userId) };
    const [rows, unread, total] = await Promise.all([
      this.prisma.notifications.findMany({ where, orderBy: { created_at: 'desc' }, take: 20, skip: (page - 1) * 20 }),
      this.prisma.notifications.count({ where: { ...where, is_read: false } }),
      this.prisma.notifications.count({ where }),
    ]);
    return {
      unread,
      total,
      data: rows.map((n) => ({ id: Number(n.id), type: n.type, title: n.title, body: n.body, data: n.data, isRead: n.is_read, createdAt: n.created_at })),
    };
  }

  async markNotificationsRead(userId: number, id?: number) {
    await this.prisma.notifications.updateMany({
      where: { user_id: BigInt(userId), is_read: false, ...(id ? { id: BigInt(id) } : {}) },
      data: { is_read: true, read_at: new Date() },
    });
    return { message: 'Đã đánh dấu đã đọc' };
  }

  // ---------- Loyalty & vouchers ----------
  async loyalty(userId: number) {
    const uid = BigInt(userId);
    const [account, tiers, txns, spent] = await Promise.all([
      this.prisma.loyalty_accounts.findUnique({ where: { user_id: uid }, include: { membership_tiers: true } }),
      this.prisma.membership_tiers.findMany({ orderBy: { min_points: 'asc' } }),
      this.prisma.loyalty_transactions.findMany({ where: { user_id: uid }, orderBy: { created_at: 'desc' }, take: 30, include: { orders: { select: { order_number: true } } } }),
      this.prisma.orders.aggregate({ where: { user_id: uid, status: { in: ['delivered', 'completed'] } }, _sum: { total_amount: true }, _count: true }),
    ]);
    const lifetime = account?.lifetime_points ?? 0;
    const next = tiers.find((t) => t.min_points > lifetime) ?? null;
    return {
      pointsBalance: account?.points_balance ?? 0,
      lifetimePoints: lifetime,
      pointValueVnd: 100,
      tier: account?.membership_tiers ? { code: account.membership_tiers.code, name: account.membership_tiers.name, discountPercent: Number(account.membership_tiers.discount_percent), multiplier: Number(account.membership_tiers.points_multiplier) } : null,
      nextTier: next ? { code: next.code, name: next.name, minPoints: next.min_points, pointsNeeded: next.min_points - lifetime } : null,
      tiers: tiers.map((t) => ({ code: t.code, name: t.name, minPoints: t.min_points, discountPercent: Number(t.discount_percent), multiplier: Number(t.points_multiplier), benefits: t.benefits })),
      totalSpent: Number(spent._sum.total_amount ?? 0),
      completedOrders: spent._count,
      transactions: txns.map((t) => ({ id: Number(t.id), type: t.txn_type, points: t.points, description: t.description, orderNumber: t.orders?.order_number ?? null, createdAt: t.created_at })),
    };
  }

  /** Coupons the customer can use right now, with a per-coupon eligibility reason. */
  async vouchers(userId: number) {
    const now = new Date();
    const coupons = await this.prisma.coupons.findMany({
      where: { is_active: true, starts_at: { lte: now }, OR: [{ ends_at: null }, { ends_at: { gt: now } }] },
      include: { membership_tiers: true },
      orderBy: { ends_at: 'asc' },
    });
    const result = [];
    for (const c of coupons) {
      if (c.usage_limit && c.used_count >= c.usage_limit) continue;
      const check = await this.pricing.checkCoupon(c.code, Number(c.min_order_amount), userId);
      result.push({
        code: c.code,
        description: c.description,
        discountType: c.discount_type,
        discountValue: Number(c.discount_value),
        maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
        minOrderAmount: Number(c.min_order_amount),
        endsAt: c.ends_at,
        minTier: c.membership_tiers?.name ?? null,
        usable: !('error' in check && check.error),
        reason: 'error' in check ? check.error : null,
      });
    }
    return result;
  }
}
