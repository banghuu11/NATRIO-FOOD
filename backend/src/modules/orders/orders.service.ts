import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LineInput, PricingService } from '../pricing/pricing.service';
import { CartOwner, CartsService } from '../carts/carts.service';
import { PaymentsService } from '../payments/payments.service';
import { MailService } from '../../core/mail.service';
import { NotificationsService } from '../../core/notifications.service';
import { OrderLifecycleService } from './order-lifecycle.service';
import { CreateOrderDto, QuoteDto } from './dto/order.dto';
import { CUSTOMER_CANCELLABLE, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from './order-status';

const orderDetailInclude = {
  order_items: { include: { products: { select: { slug: true, product_images: { take: 1, orderBy: [{ is_primary: 'desc' as const }] } } }, reviews: { select: { id: true } } } },
  order_status_history: { orderBy: { changed_at: 'asc' as const } },
  shipments: { include: { shipment_events: { orderBy: { occurred_at: 'asc' as const } } } },
  shipping_methods: true,
  payments: true,
} satisfies Prisma.ordersInclude;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger('Orders');

  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    private carts: CartsService,
    private payments: PaymentsService,
    private lifecycle: OrderLifecycleService,
    private mail: MailService,
    private notifications: NotificationsService,
  ) {}

  async quote(owner: CartOwner, dto: QuoteDto) {
    const { items } = await this.carts.itemsForCheckout(owner, dto.cartItemIds);
    const lines = await this.pricing.priceLines(items.map((i) => ({ cartItemId: Number(i.id), variantId: i.variant_id ? Number(i.variant_id) : null, bundleId: i.bundle_id ? Number(i.bundle_id) : null, quantity: i.quantity })));
    const summary = await this.pricing.quote(lines, { userId: owner.userId, couponCode: dto.couponCode, shippingMethodId: dto.shippingMethodId, pointsToUse: dto.pointsToUse });
    return { items: lines, summary, paymentMethods: this.payments.methods() };
  }

  async create(owner: CartOwner, dto: CreateOrderDto, ip: string) {
    if (!owner.userId && !dto.email) throw new BadRequestException('Vui lòng nhập email để nhận thông tin đơn hàng');
    if (!this.payments.isEnabled(dto.paymentMethod)) throw new BadRequestException('Phương thức thanh toán này hiện chưa khả dụng');

    // Idempotency: the same checkout submit returns the same order.
    const existing = await this.prisma.orders.findUnique({ where: { idempotency_key: dto.idempotencyKey } });
    if (existing) {
      if (existing.user_id && Number(existing.user_id) !== owner.userId) throw new ForbiddenException();
      return this.createdResponse(existing, ip);
    }

    const { cart, items } = await this.carts.itemsForCheckout(owner, dto.cartItemIds);
    const order = await this.placeOrder({
      owner,
      dto,
      lines: items.map((i) => ({ cartItemId: Number(i.id), variantId: i.variant_id ? Number(i.variant_id) : null, bundleId: i.bundle_id ? Number(i.bundle_id) : null, quantity: i.quantity })),
      afterCreate: async (tx, usedCoupon) => {
        await tx.cart_items.deleteMany({ where: { id: { in: items.map((i) => i.id) } } });
        if (usedCoupon) await tx.carts.update({ where: { id: cart.id }, data: { coupon_id: null } });
      },
    });

    void this.sendConfirmation(order.id);
    return this.createdResponse(order, ip);
  }

  /**
   * Creates an order in ONE transaction: re-prices on the server, locks the coupon row,
   * reserves stock per batch (FEFO), records coupon usage, redeems points and creates the payment record.
   * Used by checkout and by recurring subscription deliveries.
   */
  async placeOrder(p: {
    owner: CartOwner;
    dto: Omit<CreateOrderDto, 'cartItemIds'> & { cartItemIds?: number[] };
    lines: LineInput[];
    extraDiscountPercent?: number;
    subscriptionId?: bigint;
    afterCreate?: (tx: Prisma.TransactionClient, usedCoupon: boolean) => Promise<void>;
  }) {
    const { owner, dto } = p;
    return this.prisma.$transaction(
      async (tx) => {
        await this.lifecycle.setActor(tx, owner.userId);
        if (dto.couponCode) await tx.$queryRaw`SELECT id FROM coupons WHERE code = ${dto.couponCode.trim()}::citext FOR UPDATE`;

        const lines = await this.pricing.priceLines(p.lines, tx);
        const outOfStock = lines.filter((l) => !l.stockOk);
        if (outOfStock.length) {
          throw new BadRequestException(`Không đủ hàng: ${outOfStock.map((l) => `${l.name} (còn ${l.availableStock})`).join(', ')}`);
        }
        const q = await this.pricing.quote(lines, { userId: owner.userId, couponCode: dto.couponCode, shippingMethodId: dto.shippingMethodId, pointsToUse: dto.pointsToUse, strict: true }, tx);
        if (p.extraDiscountPercent) {
          const extra = Math.min(Math.floor((q.subtotal * p.extraDiscountPercent) / 100), q.subtotal - q.discountAmount - q.pointsDiscount);
          q.discountAmount += extra;
          q.totalAmount -= extra;
          q.pointsEarned = Math.floor(q.totalAmount / 1000);
        }

        let addressId: bigint | null = null;
        if (owner.userId && dto.saveAddress) {
          const uid = BigInt(owner.userId);
          const count = await tx.addresses.count({ where: { user_id: uid } });
          const addr = await tx.addresses.create({
            data: { user_id: uid, recipient_name: dto.recipientName, phone: dto.phone, province: dto.province, district: dto.district, ward: dto.ward, street: dto.street, is_default: count === 0, label: 'Địa chỉ giao hàng' },
          });
          addressId = addr.id;
        }

        const created = await tx.orders.create({
          data: {
            idempotency_key: dto.idempotencyKey,
            subscription_id: p.subscriptionId ?? null,
            user_id: owner.userId ? BigInt(owner.userId) : null,
            guest_email: owner.userId ? null : dto.email,
            guest_phone: owner.userId ? null : dto.phone,
            status: 'pending',
            payment_status: ['vnpay', 'momo'].includes(dto.paymentMethod) ? 'pending' : 'unpaid',
            payment_method: dto.paymentMethod,
            shipping_method_id: q.shippingMethod ? BigInt(q.shippingMethod.id) : null,
            address_id: addressId,
            ship_recipient_name: dto.recipientName,
            ship_phone: dto.phone,
            ship_province: dto.province,
            ship_district: dto.district,
            ship_ward: dto.ward,
            ship_street: dto.street,
            ship_note: dto.note,
            subtotal: q.subtotal,
            coupon_id: q.coupon ? BigInt(q.coupon.id) : null,
            coupon_code: q.coupon?.code ?? null,
            discount_amount: q.discountAmount,
            points_used: q.pointsUsed,
            points_discount: q.pointsDiscount,
            shipping_fee: q.shippingFee,
            tax_amount: 0,
            total_amount: q.totalAmount,
            points_earned: owner.userId ? q.pointsEarned : 0,
          },
        });

        for (const line of lines) {
          const item = await tx.order_items.create({
            data: {
              order_id: created.id,
              product_id: line.productId ? BigInt(line.productId) : null,
              variant_id: line.variantId ? BigInt(line.variantId) : null,
              bundle_id: line.bundleId ? BigInt(line.bundleId) : null,
              product_name: line.name,
              variant_name: line.variantName,
              sku: line.sku,
              unit_price: line.unitPrice,
              quantity: line.quantity,
              discount_amount: 0,
              line_total: line.lineTotal,
              calories_kcal: Math.round(line.nutrition.kcal * 10) / 10,
            },
          });
          // Reserve stock batch by batch, earliest expiry first (FEFO)
          let firstBatch: bigint | null = null;
          for (const comp of line.components) {
            const allocs = await tx.$queryRaw<{ inventory_id: bigint; batch_id: bigint; warehouse_id: bigint; allocated_qty: number }[]>`
              SELECT * FROM fn_allocate_stock_fefo(${BigInt(comp.variantId)}::bigint, ${comp.quantity * line.quantity}::int)`;
            for (const a of allocs) {
              firstBatch ??= a.batch_id;
              await tx.order_allocations.create({
                data: { order_item_id: item.id, inventory_id: a.inventory_id, batch_id: a.batch_id, warehouse_id: a.warehouse_id, quantity: a.allocated_qty },
              });
            }
          }
          if (firstBatch && line.variantId) await tx.order_items.update({ where: { id: item.id }, data: { batch_id: firstBatch } });
          if (line.flashSaleItemId) {
            const n = await tx.$executeRaw`UPDATE flash_sale_items SET sold_count = sold_count + ${line.quantity}
              WHERE id = ${BigInt(line.flashSaleItemId)} AND sold_count + ${line.quantity} <= quantity_limit`;
            if (!n) throw new BadRequestException(`Suất flash sale của "${line.name}" vừa hết, vui lòng thử lại`);
          }
        }

        if (q.coupon) {
          await tx.coupon_usages.create({ data: { coupon_id: BigInt(q.coupon.id), user_id: owner.userId ? BigInt(owner.userId) : null, order_id: created.id, discount_amount: q.couponDiscount } });
        }
        if (owner.userId && q.pointsUsed > 0) {
          await tx.loyalty_transactions.create({
            data: { user_id: BigInt(owner.userId), txn_type: 'redeem', points: -q.pointsUsed, order_id: created.id, description: `Dùng điểm cho đơn ${created.order_number}` },
          });
        }
        await tx.payments.create({ data: { order_id: created.id, method: dto.paymentMethod, status: 'pending', amount: q.totalAmount } });

        if (p.afterCreate) await p.afterCreate(tx, !!q.coupon);
        if (owner.userId) {
          await this.notifications.create(owner.userId, 'order', `Đặt hàng thành công – ${created.order_number}`, `Tổng thanh toán ${q.totalAmount.toLocaleString('vi-VN')}đ. NUTRIO sẽ xác nhận đơn sớm nhất.`, { orderId: Number(created.id) }, tx);
        }
        return created;
      },
      { timeout: 30000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private async createdResponse(order: { id: bigint; order_number: string; total_amount: Prisma.Decimal; payment_method: string; payment_status: string; status: string }, ip: string) {
    let redirectUrl: string | null = null;
    if (order.payment_status !== 'paid' && order.status === 'pending' && ['vnpay', 'momo'].includes(order.payment_method)) {
      try {
        redirectUrl = await this.payments.createPaymentUrl(order, ip);
      } catch (e) {
        this.logger.warn(`Không tạo được link thanh toán: ${(e as Error).message}`);
      }
    }
    return {
      message: 'Đặt hàng thành công',
      order: { id: Number(order.id), orderNumber: order.order_number, totalAmount: Number(order.total_amount), paymentMethod: order.payment_method, paymentStatus: order.payment_status, status: order.status },
      payment: {
        redirectUrl,
        bankTransfer: order.payment_method === 'bank_transfer' ? this.payments.bankTransferInfo(order.order_number, Number(order.total_amount)) : null,
      },
    };
  }

  async sendConfirmation(orderId: bigint) {
    const o = await this.prisma.orders.findUnique({ where: { id: orderId }, include: { order_items: true, users: true } });
    const to = o?.users?.email || o?.guest_email;
    if (!o || !to) return;
    const rows = o.order_items.map((i) => `<tr><td>${i.product_name} – ${i.variant_name ?? ''}</td><td align="center">${i.quantity}</td><td align="right">${Number(i.line_total).toLocaleString('vi-VN')}đ</td></tr>`).join('');
    await this.mail.send(
      to,
      `Xác nhận đơn hàng ${o.order_number}`,
      this.mail.layout(
        `Cảm ơn bạn đã đặt hàng!`,
        `<p>Mã đơn: <b>${o.order_number}</b></p><table width="100%" cellpadding="6" style="border-collapse:collapse">${rows}</table>
         <p>Phí vận chuyển: ${Number(o.shipping_fee).toLocaleString('vi-VN')}đ<br/>Giảm giá: ${(Number(o.discount_amount) + Number(o.points_discount)).toLocaleString('vi-VN')}đ<br/>
         <b>Tổng thanh toán: ${Number(o.total_amount).toLocaleString('vi-VN')}đ</b></p><p>Phương thức: ${PAYMENT_METHOD_LABEL[o.payment_method]}</p>`,
      ),
    );
  }

  // ---------------- Customer views ----------------
  formatOrder(o: Prisma.ordersGetPayload<{ include: typeof orderDetailInclude }>) {
    return {
      id: Number(o.id),
      orderNumber: o.order_number,
      status: o.status,
      statusLabel: ORDER_STATUS_LABEL[o.status],
      paymentStatus: o.payment_status,
      paymentStatusLabel: PAYMENT_STATUS_LABEL[o.payment_status],
      paymentMethod: o.payment_method,
      paymentMethodLabel: PAYMENT_METHOD_LABEL[o.payment_method],
      canCancel: CUSTOMER_CANCELLABLE.includes(o.status),
      canRetryPayment: o.status === 'pending' && ['vnpay', 'momo'].includes(o.payment_method) && o.payment_status !== 'paid',
      placedAt: o.placed_at,
      deliveredAt: o.delivered_at,
      cancelReason: o.cancel_reason,
      note: o.ship_note,
      shipping: {
        recipientName: o.ship_recipient_name,
        phone: o.ship_phone,
        address: [o.ship_street, o.ship_ward, o.ship_district, o.ship_province].join(', '),
        method: o.shipping_methods?.name ?? null,
      },
      pricing: {
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discount_amount),
        couponCode: o.coupon_code,
        pointsUsed: o.points_used,
        pointsDiscount: Number(o.points_discount),
        shippingFee: Number(o.shipping_fee),
        totalAmount: Number(o.total_amount),
        pointsEarned: o.points_earned,
      },
      items: o.order_items.map((i) => ({
        id: Number(i.id),
        productId: i.product_id ? Number(i.product_id) : null,
        variantId: i.variant_id ? Number(i.variant_id) : null,
        bundleId: i.bundle_id ? Number(i.bundle_id) : null,
        slug: i.products?.slug ?? null,
        image: i.products?.product_images[0]?.url ?? null,
        name: i.product_name,
        variantName: i.variant_name,
        unitPrice: Number(i.unit_price),
        quantity: i.quantity,
        lineTotal: Number(i.line_total),
        reviewed: i.reviews.length > 0,
        canReview: !!i.product_id && ['delivered', 'completed'].includes(o.status) && i.reviews.length === 0,
      })),
      history: o.order_status_history.map((h) => ({ status: h.to_status, label: ORDER_STATUS_LABEL[h.to_status], note: h.note, at: h.changed_at })),
      shipments: o.shipments.map((s) => ({
        carrier: s.carrier,
        trackingNumber: s.tracking_number,
        status: s.status,
        estimatedDeliveryAt: s.estimated_delivery_at,
        events: s.shipment_events.map((e) => ({ status: e.status, location: e.location, description: e.description, at: e.occurred_at })),
      })),
    };
  }

  async myOrders(userId: number, status?: string, page = 1, limit = 10) {
    const where: Prisma.ordersWhereInput = { user_id: BigInt(userId), ...(status && status !== 'all' ? { status: status as any } : {}) };
    const [rows, total, counts] = await Promise.all([
      this.prisma.orders.findMany({ where, orderBy: { placed_at: 'desc' }, skip: (page - 1) * limit, take: limit, include: orderDetailInclude }),
      this.prisma.orders.count({ where }),
      this.prisma.orders.groupBy({ by: ['status'], where: { user_id: BigInt(userId) }, _count: true }),
    ]);
    return {
      data: rows.map((o) => this.formatOrder(o)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    };
  }

  async detail(userId: number, id: number) {
    const o = await this.prisma.orders.findFirst({ where: { id: BigInt(id), user_id: BigInt(userId) }, include: orderDetailInclude });
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng');
    return {
      ...this.formatOrder(o),
      bankTransfer: o.payment_method === 'bank_transfer' && o.payment_status !== 'paid' && o.status !== 'cancelled' ? this.payments.bankTransferInfo(o.order_number, Number(o.total_amount)) : null,
    };
  }

  /** Guest order lookup: order number + phone must match. */
  async track(orderNumber: string, phone: string) {
    const o = await this.prisma.orders.findUnique({ where: { order_number: orderNumber.toUpperCase() }, include: orderDetailInclude });
    if (!o || (o.ship_phone !== phone && o.guest_phone !== phone)) throw new NotFoundException('Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại');
    const f = this.formatOrder(o);
    return { ...f, canCancel: false, bankTransfer: o.payment_method === 'bank_transfer' && o.payment_status !== 'paid' && o.status !== 'cancelled' ? this.payments.bankTransferInfo(o.order_number, Number(o.total_amount)) : null };
  }

  async cancel(userId: number, id: number, reason: string) {
    const o = await this.prisma.orders.findFirst({ where: { id: BigInt(id), user_id: BigInt(userId) } });
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (!CUSTOMER_CANCELLABLE.includes(o.status)) {
      throw new BadRequestException('Đơn hàng đang được chuẩn bị hoặc vận chuyển nên không thể hủy. Vui lòng liên hệ CSKH.');
    }
    await this.lifecycle.transition(o.id, 'cancelled', { actorId: userId, reason, note: `Khách hủy: ${reason}` });
    return this.detail(userId, id);
  }

  /** Puts the items of a past order back in the cart (current prices, stock-checked). */
  async reorder(userId: number, id: number) {
    const o = await this.prisma.orders.findFirst({ where: { id: BigInt(id), user_id: BigInt(userId) }, include: { order_items: true } });
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng');
    const items = o.order_items
      .filter((i) => i.variant_id || i.bundle_id)
      .map((i) => ({ variantId: i.variant_id ? Number(i.variant_id) : undefined, bundleId: i.bundle_id ? Number(i.bundle_id) : undefined, quantity: i.quantity }));
    return this.carts.addMany({ userId }, items);
  }
}
