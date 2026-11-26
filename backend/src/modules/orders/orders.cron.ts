import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderLifecycleService } from './order-lifecycle.service';

@Injectable()
export class OrdersCron {
  private readonly logger = new Logger('OrdersCron');

  constructor(
    private prisma: PrismaService,
    private lifecycle: OrderLifecycleService,
  ) {}

  /** Online-payment orders not paid within 60 minutes are cancelled so their stock is released. */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cancelUnpaidOnlineOrders() {
    const stale = await this.prisma.orders.findMany({
      where: { status: 'pending', payment_method: { in: ['vnpay', 'momo'] }, payment_status: { in: ['pending', 'failed'] }, placed_at: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
      select: { id: true, order_number: true },
    });
    for (const o of stale) {
      try {
        await this.lifecycle.transition(o.id, 'cancelled', { reason: 'Quá hạn thanh toán online (60 phút)', note: 'Hệ thống tự hủy do chưa thanh toán' });
        this.logger.log(`Auto-cancelled unpaid order ${o.order_number}`);
      } catch (e) {
        this.logger.warn(`Không thể tự hủy ${o.order_number}: ${(e as Error).message}`);
      }
    }
  }
}
