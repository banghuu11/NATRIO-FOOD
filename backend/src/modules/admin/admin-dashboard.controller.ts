import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { ORDER_STATUS_LABEL } from '../orders/order-status';
import { sendExcel, VND } from './excel';

type Granularity = 'day' | 'month' | 'year';
const DONE = Prisma.sql`('delivered','completed')`;
const VALID = Prisma.sql`('cancelled','returned')`;

function range(from?: string, to?: string, defDays = 30) {
  const end = to ? new Date(`${to}T23:59:59`) : new Date();
  const start = from ? new Date(`${from}T00:00:00`) : new Date(end.getTime() - (defDays - 1) * 864e5);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminDashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Số liệu tổng quan, biểu đồ, cảnh báo tồn kho & hạn sử dụng' })
  async dashboard(@Query('granularity') g: Granularity = 'day', @Query('from') from?: string, @Query('to') to?: string) {
    const gran: Granularity = ['day', 'month', 'year'].includes(g) ? g : 'day';
    const { start, end } = range(from, to, gran === 'day' ? 30 : gran === 'month' ? 365 : 365 * 4);
    const [totals, customers, products, byStatus, series, best, lowStock, nearExpiry, recent] = await Promise.all([
      this.prisma.$queryRaw<{ revenue: number; orders: number }[]>`
        SELECT COALESCE(SUM(total_amount) FILTER (WHERE status IN ${DONE}), 0)::float AS revenue, COUNT(*)::int AS orders FROM orders`,
      this.prisma.users.count({ where: { deleted_at: null, user_roles: { some: { roles: { code: 'customer' } } } } }),
      this.prisma.products.count({ where: { deleted_at: null, status: 'active' } }),
      this.prisma.orders.groupBy({ by: ['status'], _count: true, _sum: { total_amount: true } }),
      this.prisma.$queryRaw<{ bucket: Date; revenue: number; orders: number }[]>`
        SELECT date_trunc(${gran}, placed_at) AS bucket,
               COALESCE(SUM(total_amount) FILTER (WHERE status IN ${DONE}), 0)::float AS revenue,
               COUNT(*) FILTER (WHERE status NOT IN ${VALID})::int AS orders
        FROM orders WHERE placed_at BETWEEN ${start} AND ${end}
        GROUP BY 1 ORDER BY 1`,
      this.prisma.$queryRaw<{ product_id: bigint; name: string; units: number; revenue: number }[]>`
        SELECT oi.product_id, MAX(oi.product_name) AS name, SUM(oi.quantity)::int AS units, SUM(oi.line_total)::float AS revenue
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.status NOT IN ${VALID} AND oi.product_id IS NOT NULL AND o.placed_at BETWEEN ${start} AND ${end}
        GROUP BY oi.product_id ORDER BY units DESC LIMIT 5`,
      this.prisma.$queryRaw<{ variant_id: bigint; sku: string; product_name: string; variant_name: string; available_qty: number; reorder_level: number }[]>`
        SELECT * FROM v_low_stock ORDER BY available_qty ASC LIMIT 10`,
      this.prisma.$queryRaw<{ batch_id: bigint; batch_code: string; product_name: string; variant_name: string; expires_on: Date; days_left: number; quantity_on_hand: number }[]>`
        SELECT batch_id, batch_code, product_name, variant_name, expires_on, days_left::int, quantity_on_hand::int FROM v_near_expiry LIMIT 10`,
      this.prisma.orders.findMany({ orderBy: { placed_at: 'desc' }, take: 8, select: { id: true, order_number: true, ship_recipient_name: true, total_amount: true, status: true, payment_status: true, placed_at: true } }),
    ]);

    // Fill empty buckets so charts have a continuous axis
    const buckets: { label: string; date: string; revenue: number; orders: number }[] = [];
    const cur = new Date(start);
    if (gran === 'month') cur.setDate(1);
    if (gran === 'year') cur.setMonth(0, 1);
    while (cur <= end) {
      const hit = series.find((s) => {
        const d = new Date(s.bucket);
        return gran === 'day' ? d.toDateString() === cur.toDateString() : gran === 'month' ? d.getFullYear() === cur.getFullYear() && d.getMonth() === cur.getMonth() : d.getFullYear() === cur.getFullYear();
      });
      const label = gran === 'day' ? `${cur.getDate()}/${cur.getMonth() + 1}` : gran === 'month' ? `T${cur.getMonth() + 1}/${cur.getFullYear()}` : `${cur.getFullYear()}`;
      buckets.push({ label, date: cur.toISOString().slice(0, 10), revenue: hit?.revenue ?? 0, orders: hit?.orders ?? 0 });
      if (gran === 'day') cur.setDate(cur.getDate() + 1);
      else if (gran === 'month') cur.setMonth(cur.getMonth() + 1);
      else cur.setFullYear(cur.getFullYear() + 1);
    }

    const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
    return {
      kpis: {
        revenue: totals[0]?.revenue ?? 0,
        orders: totals[0]?.orders ?? 0,
        customers,
        products,
        newOrders: count('pending'),
        processingOrders: count('confirmed') + count('processing') + count('shipping'),
      },
      revenueSeries: buckets,
      granularity: gran,
      statusBreakdown: Object.entries(ORDER_STATUS_LABEL).map(([status, label]) => ({ status, label, count: count(status), amount: Number(byStatus.find((b) => b.status === status)?._sum.total_amount ?? 0) })),
      bestSellers: best.map((b) => ({ productId: Number(b.product_id), name: b.name, units: b.units, revenue: b.revenue })),
      lowStock: lowStock.map((l) => ({ variantId: Number(l.variant_id), sku: l.sku, productName: l.product_name, variantName: l.variant_name, available: l.available_qty, reorderLevel: l.reorder_level })),
      nearExpiry: nearExpiry.map((n) => ({ batchId: Number(n.batch_id), batchCode: n.batch_code, productName: n.product_name, variantName: n.variant_name, expiresOn: n.expires_on, daysLeft: n.days_left, quantity: n.quantity_on_hand })),
      recentOrders: recent.map((o) => ({ id: Number(o.id), orderNumber: o.order_number, customer: o.ship_recipient_name, total: Number(o.total_amount), status: o.status, statusLabel: ORDER_STATUS_LABEL[o.status], paymentStatus: o.payment_status, placedAt: o.placed_at })),
    };
  }

  private async report(from?: string, to?: string) {
    const { start, end } = range(from, to, 30);
    const [summary, daily, topProducts, topCustomers, byMethod] = await Promise.all([
      this.prisma.$queryRaw<{ total: number; done: number; cancelled: number; returned: number; revenue: number; gross: number; discounts: number; shipping: number }[]>`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status IN ${DONE})::int AS done,
               COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
               COUNT(*) FILTER (WHERE status = 'returned')::int AS returned,
               COALESCE(SUM(total_amount) FILTER (WHERE status IN ${DONE}),0)::float AS revenue,
               COALESCE(SUM(subtotal) FILTER (WHERE status IN ${DONE}),0)::float AS gross,
               COALESCE(SUM(discount_amount + points_discount) FILTER (WHERE status IN ${DONE}),0)::float AS discounts,
               COALESCE(SUM(shipping_fee) FILTER (WHERE status IN ${DONE}),0)::float AS shipping
        FROM orders WHERE placed_at BETWEEN ${start} AND ${end}`,
      this.prisma.$queryRaw<{ day: Date; orders: number; revenue: number }[]>`
        SELECT placed_at::date AS day, COUNT(*)::int AS orders, COALESCE(SUM(total_amount) FILTER (WHERE status IN ${DONE}),0)::float AS revenue
        FROM orders WHERE placed_at BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY 1`,
      this.prisma.$queryRaw<{ name: string; sku: string; units: number; revenue: number }[]>`
        SELECT MAX(oi.product_name) AS name, MAX(oi.sku) AS sku, SUM(oi.quantity)::int AS units, SUM(oi.line_total)::float AS revenue
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.status NOT IN ${VALID} AND o.placed_at BETWEEN ${start} AND ${end}
        GROUP BY COALESCE(oi.variant_id, -oi.bundle_id) ORDER BY units DESC LIMIT 10`,
      this.prisma.$queryRaw<{ user_id: bigint; full_name: string; email: string; orders: number; spent: number }[]>`
        SELECT u.id AS user_id, u.full_name, u.email, COUNT(o.id)::int AS orders, SUM(o.total_amount)::float AS spent
        FROM orders o JOIN users u ON u.id = o.user_id
        WHERE o.status IN ${DONE} AND o.placed_at BETWEEN ${start} AND ${end}
        GROUP BY u.id ORDER BY spent DESC LIMIT 10`,
      this.prisma.$queryRaw<{ method: string; orders: number; amount: number }[]>`
        SELECT payment_method::text AS method, COUNT(*)::int AS orders, COALESCE(SUM(total_amount),0)::float AS amount
        FROM orders WHERE placed_at BETWEEN ${start} AND ${end} AND status NOT IN ${VALID} GROUP BY 1 ORDER BY 2 DESC`,
    ]);
    const s = summary[0];
    return {
      range: { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) },
      summary: {
        totalOrders: s.total,
        completedOrders: s.done,
        cancelledOrders: s.cancelled,
        returnedOrders: s.returned,
        revenue: s.revenue,
        grossSales: s.gross,
        discounts: s.discounts,
        shippingCollected: s.shipping,
        averageOrderValue: s.done ? Math.round(s.revenue / s.done) : 0,
        successRate: s.total ? Math.round((s.done / s.total) * 1000) / 10 : 0,
      },
      daily: daily.map((d) => ({ day: d.day, orders: d.orders, revenue: d.revenue })),
      topProducts,
      topCustomers: topCustomers.map((c) => ({ userId: Number(c.user_id), name: c.full_name, email: c.email, orders: c.orders, spent: c.spent })),
      paymentMethods: byMethod,
    };
  }

  @Get('reports')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Báo cáo: doanh thu, số đơn, AOV, tỷ lệ thành công, top sản phẩm/khách hàng' })
  reports(@Query('from') from?: string, @Query('to') to?: string) {
    return this.report(from, to);
  }

  @Get('reports/export')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Xuất báo cáo Excel' })
  async exportReport(@Res() res: Response, @Query('from') from?: string, @Query('to') to?: string) {
    const r = await this.report(from, to);
    await sendExcel(res, `bao-cao-nutrio-${r.range.from}_${r.range.to}.xlsx`, [
      {
        name: 'Tổng quan',
        columns: [{ header: 'Chỉ số', key: 'k', width: 32 }, { header: 'Giá trị', key: 'v', width: 22 }],
        rows: [
          { k: 'Khoảng thời gian', v: `${r.range.from} → ${r.range.to}` },
          { k: 'Tổng số đơn', v: r.summary.totalOrders },
          { k: 'Đơn thành công', v: r.summary.completedOrders },
          { k: 'Đơn hủy', v: r.summary.cancelledOrders },
          { k: 'Đơn hoàn trả', v: r.summary.returnedOrders },
          { k: 'Tỷ lệ thành công (%)', v: r.summary.successRate },
          { k: 'Doanh thu (đ)', v: r.summary.revenue },
          { k: 'Giá trị đơn trung bình (đ)', v: r.summary.averageOrderValue },
          { k: 'Tổng giảm giá (đ)', v: r.summary.discounts },
        ],
      },
      { name: 'Theo ngày', columns: [{ header: 'Ngày', key: 'day', width: 14 }, { header: 'Số đơn', key: 'orders' }, { header: 'Doanh thu', key: 'revenue', numFmt: VND }], rows: r.daily.map((d) => ({ ...d, day: new Date(d.day).toLocaleDateString('vi-VN') })) },
      { name: 'Top sản phẩm', columns: [{ header: 'Sản phẩm', key: 'name', width: 40 }, { header: 'SKU', key: 'sku' }, { header: 'Số lượng', key: 'units' }, { header: 'Doanh thu', key: 'revenue', numFmt: VND }], rows: r.topProducts },
      { name: 'Top khách hàng', columns: [{ header: 'Khách hàng', key: 'name', width: 30 }, { header: 'Email', key: 'email', width: 30 }, { header: 'Số đơn', key: 'orders' }, { header: 'Chi tiêu', key: 'spent', numFmt: VND }], rows: r.topCustomers },
    ]);
  }
}
