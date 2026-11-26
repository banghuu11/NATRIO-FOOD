import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { order_status, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../core/notifications.service';
import { MailService } from '../../core/mail.service';
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from './order-status';

type Tx = Prisma.TransactionClient;

/**
 * Single entry point for order status changes and their side effects:
 *  - cancelled : release reserved stock, refund redeemed points, give back coupon usage, refund paid payments
 *  - shipping  : deduct stock (reserved → shipped), create shipment
 *  - delivered : mark COD paid, add sold_count, award loyalty points
 *  - returned  : put stock back, refund payment, revoke earned points
 */
@Injectable()
export class OrderLifecycleService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private mail: MailService,
  ) {}

  async setActor(tx: Tx, userId?: number | null) {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId ? String(userId) : ''}, true)`;
  }

  async transition(orderId: number | bigint, to: order_status, opts: { actorId?: number; note?: string; reason?: string } = {}) {
    const order = await this.prisma.$transaction(
      async (tx) => {
        await this.setActor(tx, opts.actorId);
        const rows = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM orders WHERE id = ${BigInt(orderId)} FOR UPDATE`;
        if (!rows.length) throw new NotFoundException('Không tìm thấy đơn hàng');
        const order = await tx.orders.findUniqueOrThrow({ where: { id: BigInt(orderId) }, include: { order_items: { include: { order_allocations: true } }, payments: true } });
        if (order.status === to) return order;
        if (!ORDER_TRANSITIONS[order.status].includes(to)) {
          throw new BadRequestException(`Không thể chuyển đơn từ "${ORDER_STATUS_LABEL[order.status]}" sang "${ORDER_STATUS_LABEL[to]}"`);
        }

        const data: Prisma.ordersUpdateInput = { status: to };
        const allocations = order.order_items.flatMap((i) => i.order_allocations);

        if (to === 'cancelled') {
          for (const a of allocations.filter((x) => x.state === 'reserved')) {
            await tx.inventory.update({ where: { id: a.inventory_id }, data: { quantity_reserved: { decrement: a.quantity } } });
            await tx.order_allocations.update({ where: { id: a.id }, data: { state: 'released' } });
          }
          if (order.user_id && order.points_used > 0) {
            await tx.loyalty_transactions.create({
              data: { user_id: order.user_id, txn_type: 'refund', points: order.points_used, order_id: order.id, description: `Hoàn điểm do hủy đơn ${order.order_number}` },
            });
          }
          await tx.coupon_usages.deleteMany({ where: { order_id: order.id } });
          data.cancel_reason = opts.reason || opts.note || null;
          data.payment_status = order.payment_status === 'paid' ? 'refunded' : order.payment_status === 'pending' ? 'failed' : order.payment_status;
          await this.refundPayments(tx, order.payments, 'Hoàn tiền do hủy đơn');
        }

        if (to === 'shipping') {
          for (const a of allocations.filter((x) => x.state === 'reserved')) {
            await tx.inventory.update({
              where: { id: a.inventory_id },
              data: { quantity_on_hand: { decrement: a.quantity }, quantity_reserved: { decrement: a.quantity } },
            });
            await tx.order_allocations.update({ where: { id: a.id }, data: { state: 'shipped' } });
            await tx.stock_movements.create({
              data: { batch_id: a.batch_id, warehouse_id: a.warehouse_id, movement_type: 'sale_out', quantity: -a.quantity, reference_type: 'order', reference_id: order.id, note: `Xuất kho đơn ${order.order_number}`, created_by: opts.actorId ? BigInt(opts.actorId) : null },
            });
          }
          const tracking = `NTR${Date.now().toString().slice(-8)}${randomBytes(2).toString('hex').toUpperCase()}`;
          const shipment = await tx.shipments.create({
            data: {
              order_id: order.id,
              carrier: 'NUTRIO Express',
              tracking_number: tracking,
              status: 'in_transit',
              shipping_fee: order.shipping_fee,
              cod_amount: order.payment_method === 'cod' ? order.total_amount : 0,
              picked_up_at: new Date(),
              estimated_delivery_at: new Date(Date.now() + 2 * 864e5),
            },
          });
          await tx.shipment_events.createMany({
            data: [
              { shipment_id: shipment.id, status: 'picked_up', location: 'Kho NUTRIO TP.HCM', description: 'Đơn vị vận chuyển đã lấy hàng' },
              { shipment_id: shipment.id, status: 'in_transit', location: 'Trung tâm phân loại', description: 'Đơn hàng đang được vận chuyển' },
            ],
          });
        }

        if (to === 'delivered') {
          if (order.payment_method === 'cod' && order.payment_status !== 'paid') {
            data.payment_status = 'paid';
            await tx.payments.updateMany({ where: { order_id: order.id, status: { in: ['pending', 'unpaid'] } }, data: { status: 'paid', paid_at: new Date() } });
          }
          for (const item of order.order_items) {
            if (item.product_id) await tx.products.update({ where: { id: item.product_id }, data: { sold_count: { increment: item.quantity } } });
          }
          const shipments = await tx.shipments.findMany({ where: { order_id: order.id } });
          for (const s of shipments) {
            await tx.shipments.update({ where: { id: s.id }, data: { status: 'delivered', delivered_at: new Date() } });
            await tx.shipment_events.create({ data: { shipment_id: s.id, status: 'delivered', location: `${order.ship_district}, ${order.ship_province}`, description: 'Giao hàng thành công' } });
          }
          if (order.user_id && order.points_earned > 0) {
            await tx.loyalty_transactions.create({
              data: { user_id: order.user_id, txn_type: 'earn', points: order.points_earned, order_id: order.id, description: `Tích điểm đơn ${order.order_number}` },
            });
          }
        }

        if (to === 'returned') {
          for (const a of allocations.filter((x) => x.state === 'shipped')) {
            await tx.inventory.update({ where: { id: a.inventory_id }, data: { quantity_on_hand: { increment: a.quantity } } });
            await tx.order_allocations.update({ where: { id: a.id }, data: { state: 'returned' } });
            await tx.stock_movements.create({
              data: { batch_id: a.batch_id, warehouse_id: a.warehouse_id, movement_type: 'return_in', quantity: a.quantity, reference_type: 'order', reference_id: order.id, note: `Nhập lại hàng hoàn đơn ${order.order_number}`, created_by: opts.actorId ? BigInt(opts.actorId) : null },
            });
          }
          if (['delivered', 'completed'].includes(order.status)) {
            for (const item of order.order_items) {
              if (item.product_id) await tx.$executeRaw`UPDATE products SET sold_count = greatest(sold_count - ${item.quantity}, 0) WHERE id = ${item.product_id}`;
            }
            if (order.user_id && order.points_earned > 0) {
              const la = await tx.loyalty_accounts.findUnique({ where: { user_id: order.user_id } });
              const take = Math.min(order.points_earned, la?.points_balance ?? 0);
              if (take > 0) {
                await tx.loyalty_transactions.create({ data: { user_id: order.user_id, txn_type: 'adjust', points: -take, order_id: order.id, description: `Thu hồi điểm do hoàn trả đơn ${order.order_number}` } });
              }
            }
          }
          if (order.payment_status === 'paid') data.payment_status = 'refunded';
          await this.refundPayments(tx, order.payments, 'Hoàn tiền do hoàn trả đơn');
          data.cancel_reason = opts.reason || opts.note || order.cancel_reason;
        }

        const updated = await tx.orders.update({ where: { id: order.id }, data });
        if (opts.note) {
          const last = await tx.order_status_history.findFirst({ where: { order_id: order.id }, orderBy: { id: 'desc' } });
          if (last) await tx.order_status_history.update({ where: { id: last.id }, data: { note: opts.note } });
        }
        if (order.user_id) {
          await this.notifications.create(order.user_id, 'order', `Đơn ${order.order_number}: ${ORDER_STATUS_LABEL[to]}`, opts.note || undefined, { orderId: Number(order.id), status: to }, tx);
        }
        return updated;
      },
      { timeout: 20000 },
    );

    void this.emailStatus(order.id);
    return order;
  }

  private async refundPayments(tx: Tx, payments: { id: bigint; status: string; amount: Prisma.Decimal }[], note: string) {
    for (const p of payments.filter((x) => x.status === 'paid')) {
      await tx.payments.update({ where: { id: p.id }, data: { status: 'refunded' } });
      await tx.refunds.create({ data: { payment_id: p.id, amount: p.amount, status: 'processed', note, processed_at: new Date() } });
    }
  }

  async markPaid(orderId: bigint, opts: { providerTxnId?: string; gateway?: string; payload?: unknown; actorId?: number } = {}) {
    return this.prisma.$transaction(async (tx) => {
      await this.setActor(tx, opts.actorId);
      const order = await tx.orders.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true } });
      if (order.payment_status === 'paid') return order;
      if (['cancelled', 'returned'].includes(order.status)) throw new BadRequestException('Đơn hàng đã hủy, không thể xác nhận thanh toán');
      let payment = order.payments.find((p) => p.method === order.payment_method) ?? null;
      if (!payment) payment = await tx.payments.create({ data: { order_id: order.id, method: order.payment_method, amount: order.total_amount } });
      await tx.payments.update({ where: { id: payment.id }, data: { status: 'paid', paid_at: new Date(), provider_txn_id: opts.providerTxnId ?? payment.provider_txn_id } });
      if (opts.gateway) {
        await tx.payment_transactions.create({ data: { payment_id: payment.id, gateway: opts.gateway, txn_ref: opts.providerTxnId, status: 'success', response_payload: (opts.payload ?? {}) as Prisma.InputJsonValue } });
      }
      const updated = await tx.orders.update({ where: { id: order.id }, data: { payment_status: 'paid' } });
      if (order.user_id) await this.notifications.create(order.user_id, 'order', `Đơn ${order.order_number} đã được thanh toán`, undefined, { orderId: Number(order.id) }, tx);
      return updated;
    });
  }

  private async emailStatus(orderId: bigint) {
    const o = await this.prisma.orders.findUnique({ where: { id: orderId }, include: { users: true } });
    const to = o?.users?.email || o?.guest_email;
    if (!o || !to || !['confirmed', 'shipping', 'delivered', 'cancelled'].includes(o.status)) return;
    await this.mail.send(
      to,
      `Đơn hàng ${o.order_number}: ${ORDER_STATUS_LABEL[o.status]}`,
      this.mail.layout(`Đơn hàng ${o.order_number}`, `<p>Trạng thái mới: <b>${ORDER_STATUS_LABEL[o.status]}</b>.</p><p>Tổng tiền: ${Number(o.total_amount).toLocaleString('vi-VN')}đ</p>`),
    );
  }
}
