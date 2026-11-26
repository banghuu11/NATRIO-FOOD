import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subscription_freq } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PricingService } from '../pricing/pricing.service';
import { NotificationsService } from '../../core/notifications.service';
import { PaymentMethodEnum } from '../orders/dto/order.dto';

const FREQ_DAYS: Record<subscription_freq, number> = { weekly: 7, biweekly: 14, monthly: 30 };
const STATUS_LABEL = { active: 'Đang hoạt động', paused: 'Tạm dừng', cancelled: 'Đã hủy', expired: 'Hết hạn' };
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);
const today = () => new Date(new Date().toISOString().slice(0, 10));

/**
 * Recurring delivery ("Giao hàng định kỳ").
 * A daily job creates a normal COD order for every active subscription that is due,
 * applying the plan discount, then moves next_delivery_date forward.
 */
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger('Subscriptions');

  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
    private pricing: PricingService,
    private notifications: NotificationsService,
  ) {}

  async plans() {
    const rows = await this.prisma.subscription_plans.findMany({ where: { is_active: true }, orderBy: { id: 'asc' } });
    return rows.map((p) => ({ id: Number(p.id), name: p.name, frequency: p.frequency, everyDays: FREQ_DAYS[p.frequency], discountPercent: Number(p.discount_percent), description: p.description }));
  }

  async mine(userId: number) {
    const rows = await this.prisma.subscriptions.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
      include: { subscription_plans: true, addresses: true, subscription_items: true, orders: { orderBy: { placed_at: 'desc' }, take: 5, select: { id: true, order_number: true, status: true, placed_at: true, total_amount: true } } },
    });
    const result = [];
    for (const s of rows) {
      const lines = await this.pricing.priceLines(s.subscription_items.map((i) => ({ variantId: Number(i.variant_id), quantity: i.quantity })));
      const subtotal = lines.reduce((x, l) => x + l.lineTotal, 0);
      result.push({
        id: Number(s.id),
        status: s.status,
        statusLabel: STATUS_LABEL[s.status],
        plan: { id: Number(s.plan_id), name: s.subscription_plans.name, frequency: s.subscription_plans.frequency, discountPercent: Number(s.subscription_plans.discount_percent) },
        nextDeliveryDate: s.next_delivery_date,
        lastDeliveryDate: s.last_delivery_date,
        pausedUntil: s.paused_until,
        address: s.addresses ? [s.addresses.street, s.addresses.ward, s.addresses.district, s.addresses.province].join(', ') : null,
        items: lines.map((l) => ({ variantId: l.variantId, name: l.name, variantName: l.variantName, image: l.image, quantity: l.quantity, unitPrice: l.unitPrice, inStock: l.stockOk })),
        estimatedTotal: Math.round(subtotal * (1 - Number(s.subscription_plans.discount_percent) / 100)),
        recentOrders: s.orders.map((o) => ({ id: Number(o.id), orderNumber: o.order_number, status: o.status, placedAt: o.placed_at, total: Number(o.total_amount) })),
      });
    }
    return result;
  }

  async create(userId: number, dto: { planId: number; addressId: number; items: { variantId: number; quantity: number }[]; startDate?: string }) {
    const uid = BigInt(userId);
    const [plan, address] = await Promise.all([
      this.prisma.subscription_plans.findFirst({ where: { id: BigInt(dto.planId), is_active: true } }),
      this.prisma.addresses.findFirst({ where: { id: BigInt(dto.addressId), user_id: uid } }),
    ]);
    if (!plan) throw new BadRequestException('Gói giao định kỳ không hợp lệ');
    if (!address) throw new BadRequestException('Vui lòng chọn địa chỉ giao hàng trong sổ địa chỉ');
    const lines = await this.pricing.priceLines(dto.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
    if (lines.some((l) => l.availableStock <= 0)) throw new BadRequestException('Có sản phẩm đang hết hàng, vui lòng chọn sản phẩm khác');
    const start = dto.startDate ? new Date(dto.startDate) : addDays(today(), 1);
    if (start < today()) throw new BadRequestException('Ngày giao đầu tiên phải từ hôm nay trở đi');

    const sub = await this.prisma.subscriptions.create({
      data: {
        user_id: uid,
        plan_id: plan.id,
        address_id: address.id,
        payment_method: 'cod',
        next_delivery_date: start,
        subscription_items: { create: dto.items.map((i) => ({ variant_id: BigInt(i.variantId), quantity: i.quantity })) },
      },
    });
    await this.notifications.create(uid, 'system', 'Đã đăng ký giao hàng định kỳ', `${plan.name} – lần giao đầu tiên ${start.toLocaleDateString('vi-VN')}`);
    return { id: Number(sub.id), message: 'Đăng ký giao hàng định kỳ thành công' };
  }

  async update(userId: number, id: number, action: 'pause' | 'resume' | 'cancel' | 'skip', opts: { pausedUntil?: string; reason?: string } = {}) {
    const s = await this.prisma.subscriptions.findFirst({ where: { id: BigInt(id), user_id: BigInt(userId) }, include: { subscription_plans: true } });
    if (!s) throw new NotFoundException('Không tìm thấy gói giao định kỳ');
    if (s.status === 'cancelled') throw new BadRequestException('Gói đã bị hủy');
    const every = FREQ_DAYS[s.subscription_plans.frequency];
    if (action === 'pause') {
      const until = opts.pausedUntil ? new Date(opts.pausedUntil) : addDays(today(), 14);
      await this.prisma.subscriptions.update({ where: { id: s.id }, data: { status: 'paused', paused_until: until } });
    } else if (action === 'resume') {
      const next = s.next_delivery_date < today() ? addDays(today(), 1) : s.next_delivery_date;
      await this.prisma.subscriptions.update({ where: { id: s.id }, data: { status: 'active', paused_until: null, next_delivery_date: next } });
    } else if (action === 'skip') {
      await this.prisma.subscription_skips.create({ data: { subscription_id: s.id, skip_date: s.next_delivery_date, reason: opts.reason } });
      await this.prisma.subscriptions.update({ where: { id: s.id }, data: { next_delivery_date: addDays(s.next_delivery_date, every) } });
    } else {
      await this.prisma.subscriptions.update({ where: { id: s.id }, data: { status: 'cancelled', cancelled_at: new Date(), cancel_reason: opts.reason } });
    }
    return this.mine(userId);
  }

  /** Runs every day at 07:00 – also callable manually from admin for the demo. */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async processDue() {
    // Paused subscriptions whose pause ended become active again
    await this.prisma.subscriptions.updateMany({ where: { status: 'paused', paused_until: { lte: today() } }, data: { status: 'active', paused_until: null } });
    const due = await this.prisma.subscriptions.findMany({
      where: { status: 'active', next_delivery_date: { lte: today() } },
      include: { subscription_items: true, subscription_plans: true, addresses: true, users: true },
    });
    const results: { id: number; ok: boolean; message: string }[] = [];
    for (const s of due) {
      const every = FREQ_DAYS[s.subscription_plans.frequency];
      try {
        if (!s.addresses) throw new Error('Thiếu địa chỉ giao hàng');
        const order = await this.orders.placeOrder({
          owner: { userId: Number(s.user_id) },
          subscriptionId: s.id,
          extraDiscountPercent: Number(s.subscription_plans.discount_percent),
          lines: s.subscription_items.map((i) => ({ variantId: Number(i.variant_id), quantity: i.quantity })),
          dto: {
            recipientName: s.addresses.recipient_name,
            phone: s.addresses.phone,
            province: s.addresses.province,
            district: s.addresses.district,
            ward: s.addresses.ward,
            street: s.addresses.street,
            note: `Đơn giao định kỳ (${s.subscription_plans.name})`,
            paymentMethod: PaymentMethodEnum.COD,
            idempotencyKey: `sub-${s.id}-${s.next_delivery_date.toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`,
          },
        });
        await this.prisma.subscriptions.update({ where: { id: s.id }, data: { last_delivery_date: s.next_delivery_date, next_delivery_date: addDays(s.next_delivery_date, every) } });
        void this.orders.sendConfirmation(order.id);
        results.push({ id: Number(s.id), ok: true, message: order.order_number });
      } catch (e) {
        const msg = (e as Error).message;
        await this.prisma.subscriptions.update({ where: { id: s.id }, data: { next_delivery_date: addDays(s.next_delivery_date, every) } });
        await this.notifications.create(s.user_id, 'reminder', 'Chưa thể tạo đơn giao định kỳ', `Kỳ giao ${s.next_delivery_date.toLocaleDateString('vi-VN')} bị bỏ qua: ${msg}`);
        this.logger.warn(`Subscription ${s.id}: ${msg}`);
        results.push({ id: Number(s.id), ok: false, message: msg });
      }
    }
    return { processed: results.length, results };
  }
}
