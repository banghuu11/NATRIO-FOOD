import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { order_status, Prisma } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS, SUPER_ADMIN_ROLE } from '../../common/permissions';
import { OrderLifecycleService } from '../orders/order-lifecycle.service';
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from '../orders/order-status';
import { pageMeta } from '../../common/utils/serialize';
import { sendExcel, VND } from './excel';
import { PaymentsService } from '../payments/payments.service';

class UpdateStatusDto {
  @ApiProperty({ enum: Object.keys(ORDER_STATUS_LABEL) }) @IsEnum(Object.keys(ORDER_STATUS_LABEL) as any) status: order_status;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

function buildWhere(q: { status?: string; paymentStatus?: string; paymentMethod?: string; q?: string; from?: string; to?: string }): Prisma.ordersWhereInput {
  const where: Prisma.ordersWhereInput = {};
  if (q.status && q.status !== 'all') where.status = q.status as order_status;
  if (q.paymentStatus) where.payment_status = q.paymentStatus as any;
  if (q.paymentMethod) where.payment_method = q.paymentMethod as any;
  if (q.from || q.to) where.placed_at = { gte: q.from ? new Date(`${q.from}T00:00:00`) : undefined, lte: q.to ? new Date(`${q.to}T23:59:59`) : undefined };
  if (q.q) {
    const s = q.q.trim();
    where.OR = [
      { order_number: { contains: s, mode: 'insensitive' } },
      { ship_recipient_name: { contains: s, mode: 'insensitive' } },
      { ship_phone: { contains: s } },
      { guest_email: { contains: s, mode: 'insensitive' } },
      { users: { email: { contains: s, mode: 'insensitive' } } },
    ];
  }
  return where;
}

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private prisma: PrismaService,
    private lifecycle: OrderLifecycleService,
    private payments: PaymentsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ORDER_READ)
  async list(@Query() q: Record<string, string>) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = 20;
    const where = buildWhere(q);
    const [rows, total, counts] = await Promise.all([
      this.prisma.orders.findMany({ where, orderBy: { placed_at: 'desc' }, skip: (page - 1) * limit, take: limit, include: { users: { select: { email: true } }, _count: { select: { order_items: true } } } }),
      this.prisma.orders.count({ where }),
      this.prisma.orders.groupBy({ by: ['status'], _count: true }),
    ]);
    return {
      data: rows.map((o) => ({
        id: Number(o.id),
        orderNumber: o.order_number,
        customer: o.ship_recipient_name,
        phone: o.ship_phone,
        email: o.users?.email ?? o.guest_email,
        isGuest: !o.user_id,
        itemCount: o._count.order_items,
        total: Number(o.total_amount),
        status: o.status,
        statusLabel: ORDER_STATUS_LABEL[o.status],
        paymentMethod: o.payment_method,
        paymentMethodLabel: PAYMENT_METHOD_LABEL[o.payment_method],
        paymentStatus: o.payment_status,
        paymentStatusLabel: PAYMENT_STATUS_LABEL[o.payment_status],
        placedAt: o.placed_at,
        isSubscription: !!o.subscription_id,
      })),
      meta: pageMeta(page, limit, total),
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    };
  }

  @Get('export')
  @RequirePermissions(PERMISSIONS.ORDER_READ)
  async export(@Res() res: Response, @Query() q: Record<string, string>) {
    const rows = await this.prisma.orders.findMany({ where: buildWhere(q), orderBy: { placed_at: 'desc' }, take: 5000, include: { users: { select: { email: true } }, order_items: true } });
    await sendExcel(res, `don-hang-nutrio-${new Date().toISOString().slice(0, 10)}.xlsx`, [
      {
        name: 'Đơn hàng',
        columns: [
          { header: 'Mã đơn', key: 'code', width: 18 }, { header: 'Ngày đặt', key: 'date', width: 18 }, { header: 'Khách hàng', key: 'name', width: 24 },
          { header: 'SĐT', key: 'phone', width: 14 }, { header: 'Email', key: 'email', width: 26 }, { header: 'Địa chỉ', key: 'address', width: 50 },
          { header: 'Sản phẩm', key: 'items', width: 60 }, { header: 'Tạm tính', key: 'subtotal', numFmt: VND }, { header: 'Giảm giá', key: 'discount', numFmt: VND },
          { header: 'Phí ship', key: 'ship', numFmt: VND }, { header: 'Tổng tiền', key: 'total', numFmt: VND }, { header: 'Thanh toán', key: 'pm', width: 26 },
          { header: 'TT thanh toán', key: 'ps', width: 18 }, { header: 'Trạng thái', key: 'status', width: 20 },
        ],
        rows: rows.map((o) => ({
          code: o.order_number,
          date: o.placed_at.toLocaleString('vi-VN'),
          name: o.ship_recipient_name,
          phone: o.ship_phone,
          email: o.users?.email ?? o.guest_email,
          address: [o.ship_street, o.ship_ward, o.ship_district, o.ship_province].join(', '),
          items: o.order_items.map((i) => `${i.product_name} (${i.variant_name}) x${i.quantity}`).join('; '),
          subtotal: Number(o.subtotal),
          discount: Number(o.discount_amount) + Number(o.points_discount),
          ship: Number(o.shipping_fee),
          total: Number(o.total_amount),
          pm: PAYMENT_METHOD_LABEL[o.payment_method],
          ps: PAYMENT_STATUS_LABEL[o.payment_status],
          status: ORDER_STATUS_LABEL[o.status],
        })),
      },
    ]);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ORDER_READ)
  async detail(@Param('id', ParseIntPipe) id: number) {
    const o = await this.prisma.orders.findUnique({
      where: { id: BigInt(id) },
      include: {
        users: { select: { id: true, full_name: true, email: true, phone: true } },
        order_items: { include: { order_allocations: { include: { product_batches: true, warehouses: true } } } },
        order_status_history: { orderBy: { changed_at: 'asc' }, include: { users: { select: { full_name: true } } } },
        payments: { include: { payment_transactions: true } },
        shipments: { include: { shipment_events: { orderBy: { occurred_at: 'asc' } } } },
        shipping_methods: true,
      },
    });
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng');
    return {
      id: Number(o.id),
      orderNumber: o.order_number,
      status: o.status,
      statusLabel: ORDER_STATUS_LABEL[o.status],
      nextStatuses: ORDER_TRANSITIONS[o.status].map((s) => ({ status: s, label: ORDER_STATUS_LABEL[s] })),
      paymentMethod: o.payment_method,
      paymentMethodLabel: PAYMENT_METHOD_LABEL[o.payment_method],
      paymentStatus: o.payment_status,
      paymentStatusLabel: PAYMENT_STATUS_LABEL[o.payment_status],
      canConfirmPayment: o.payment_status !== 'paid' && !['cancelled', 'returned'].includes(o.status) && o.payment_method !== 'cod',
      placedAt: o.placed_at,
      cancelReason: o.cancel_reason,
      customer: o.users ? { id: Number(o.users.id), name: o.users.full_name, email: o.users.email, phone: o.users.phone } : { id: null, name: o.ship_recipient_name, email: o.guest_email, phone: o.guest_phone, guest: true },
      shipping: { recipientName: o.ship_recipient_name, phone: o.ship_phone, address: [o.ship_street, o.ship_ward, o.ship_district, o.ship_province].join(', '), note: o.ship_note, method: o.shipping_methods?.name },
      pricing: { subtotal: Number(o.subtotal), discountAmount: Number(o.discount_amount), couponCode: o.coupon_code, pointsUsed: o.points_used, pointsDiscount: Number(o.points_discount), shippingFee: Number(o.shipping_fee), totalAmount: Number(o.total_amount), pointsEarned: o.points_earned },
      items: o.order_items.map((i) => ({
        id: Number(i.id), name: i.product_name, variantName: i.variant_name, sku: i.sku, unitPrice: Number(i.unit_price), quantity: i.quantity, lineTotal: Number(i.line_total),
        allocations: i.order_allocations.map((a) => ({ batchCode: a.product_batches.batch_code, expiresOn: a.product_batches.expires_on, warehouse: a.warehouses.name, quantity: a.quantity, state: a.state })),
      })),
      history: o.order_status_history.map((h) => ({ status: h.to_status, label: ORDER_STATUS_LABEL[h.to_status], note: h.note, by: h.users?.full_name ?? (h.changed_by ? `#${h.changed_by}` : 'Hệ thống / Khách'), at: h.changed_at })),
      payments: o.payments.map((p) => ({ method: p.method, status: p.status, amount: Number(p.amount), paidAt: p.paid_at, providerTxnId: p.provider_txn_id })),
      shipments: o.shipments.map((s) => ({ carrier: s.carrier, trackingNumber: s.tracking_number, status: s.status, events: s.shipment_events.map((e) => ({ status: e.status, description: e.description, location: e.location, at: e.occurred_at })) })),
      bankTransfer: o.payment_method === 'bank_transfer' ? this.payments.bankTransferInfo(o.order_number, Number(o.total_amount)) : null,
    };
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.ORDER_UPDATE)
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto, @CurrentUser() user: CurrentUserPayload) {
    if (dto.status === 'cancelled' && !dto.note) throw new BadRequestException('Vui lòng nhập lý do hủy đơn');
    if (dto.status === 'returned' && !user.roles.includes(SUPER_ADMIN_ROLE) && !user.permissions.includes(PERMISSIONS.PAYMENT_CONFIRM)) {
      throw new ForbiddenException('Bạn không có quyền xử lý hoàn trả / hoàn tiền');
    }
    await this.lifecycle.transition(id, dto.status, { actorId: user.id, note: dto.note, reason: dto.note });
    return this.detail(id);
  }

  @Post(':id/confirm-payment')
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.PAYMENT_CONFIRM)
  async confirmPayment(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    await this.lifecycle.markPaid(BigInt(id), { actorId: user.id, gateway: 'manual', providerTxnId: `MANUAL-${user.id}-${Date.now()}` });
    return this.detail(id);
  }
}
