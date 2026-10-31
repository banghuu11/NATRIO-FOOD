import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tổng hợp các chỉ số KPI doanh thu, đơn hàng, khách hàng & kho FEFO
   */
  async getStats() {
    const now = Date.now();

    const [
      allOrders,
      totalCustomers,
      allBatches,
      allVariants,
    ] = await Promise.all([
      this.prisma.orders.findMany({
        select: {
          id: true,
          status: true,
          total_amount: true,
          created_at: true,
        },
      }),
      this.prisma.users.count(),
      this.prisma.product_batches.findMany({
        select: {
          id: true,
          expires_on: true,
          inventory: {
            select: { quantity_on_hand: true },
          },
        },
      }),
      this.prisma.product_variants.findMany({
        select: {
          id: true,
          reorder_level: true,
          product_batches: {
            select: {
              inventory: { select: { quantity_on_hand: true } },
            },
          },
        },
      }),
    ]);

    // 1. Doanh thu & Đơn hàng
    let totalRevenue = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;

    allOrders.forEach((o) => {
      if (['confirmed', 'processing', 'shipping', 'delivered'].includes(o.status)) {
        totalRevenue += Number(o.total_amount);
      }
      if (o.status === 'pending') pendingOrders++;
      if (o.status === 'delivered') deliveredOrders++;
    });

    // 2. Chỉ số FEFO
    let criticalFefoCount = 0;
    let warningFefoCount = 0;

    allBatches.forEach((b) => {
      const totalStock = b.inventory.reduce((sum, inv) => sum + inv.quantity_on_hand, 0);
      if (totalStock > 0) {
        const daysLeft = Math.ceil((new Date(b.expires_on).getTime() - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 15) criticalFefoCount++;
        else if (daysLeft <= 30) warningFefoCount++;
      }
    });

    // 3. Cảnh báo sắp hết hàng (Low Stock)
    let lowStockCount = 0;
    allVariants.forEach((v) => {
      const stock = v.product_batches.reduce(
        (acc, b) => acc + b.inventory.reduce((sum, inv) => sum + inv.quantity_on_hand, 0),
        0,
      );
      if (stock <= v.reorder_level) {
        lowStockCount++;
      }
    });

    return {
      revenue: {
        total: totalRevenue,
        currency: 'VND',
        formatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue),
      },
      orders: {
        total: allOrders.length,
        pending: pendingOrders,
        delivered: deliveredOrders,
      },
      customers: {
        total: totalCustomers,
      },
      fefoAlerts: {
        critical: criticalFefoCount, // < 15 ngày
        warning: warningFefoCount,   // < 30 ngày
        totalExpiringSoon: criticalFefoCount + warningFefoCount,
      },
      inventory: {
        lowStockCount,
      },
    };
  }

  /**
   * Top 5 lô hàng cận date nguy cấp nhất cần ưu tiên xuất kho / flash sale
   */
  async getFefoAlerts(limit = 5) {
    const now = Date.now();
    const batches = await this.prisma.product_batches.findMany({
      include: {
        product_variants: {
          include: {
            products: {
              select: { name: true, slug: true, nutri_score_grade: true },
            },
          },
        },
        inventory: {
          include: { warehouses: true },
        },
      },
      orderBy: { expires_on: 'asc' },
    });

    const alerts = batches
      .map((b) => {
        const daysLeft = Math.ceil((new Date(b.expires_on).getTime() - now) / (1000 * 60 * 60 * 24));
        const totalOnHand = b.inventory.reduce((sum, inv) => sum + inv.quantity_on_hand, 0);
        return {
          id: Number(b.id),
          batchCode: b.batch_code,
          qrCode: b.qr_code,
          productName: b.product_variants.products.name,
          variantName: b.product_variants.name,
          nutriScore: b.product_variants.products.nutri_score_grade,
          expiryDate: b.expires_on,
          daysLeft,
          quantityOnHand: totalOnHand,
          warehouse: b.inventory[0]?.warehouses?.name || 'Kho chính',
          status: daysLeft <= 15 ? 'critical' : daysLeft <= 30 ? 'warning' : 'good',
        };
      })
      .filter((b) => b.quantityOnHand > 0 && b.daysLeft <= 45) // Chỉ lấy lô còn hàng và <= 45 ngày
      .slice(0, limit);

    return alerts;
  }

  /**
   * 10 Đơn hàng gần nhất
   */
  async getRecentOrders(limit = 10) {
    const orders = await this.prisma.orders.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { full_name: true, phone: true, email: true },
        },
        order_items: {
          select: {
            id: true,
            product_name: true,
            quantity: true,
            unit_price: true,
          },
        },
      },
    });

    return orders.map((o) => ({
      id: Number(o.id),
      orderCode: o.order_number,
      customerName: o.ship_recipient_name || o.users?.full_name || 'Khách vãng lai',
      phone: o.ship_phone || o.users?.phone,
      totalAmount: Number(o.total_amount),
      status: o.status,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
      itemsCount: o.order_items.length,
    }));
  }
}
