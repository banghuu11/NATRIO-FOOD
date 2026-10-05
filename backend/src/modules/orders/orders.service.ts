import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: number, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng cần có ít nhất một sản phẩm');
    }

    // 1. Tính toán giá tiền các items
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of dto.items) {
      const variant = await this.prisma.product_variants.findUnique({
        where: { id: BigInt(item.variantId) },
        include: {
          products: {
            include: { nutrition_facts: true },
          },
        },
      });

      if (!variant || !variant.is_active) {
        throw new BadRequestException(`Sản phẩm (variant: ${item.variantId}) không tồn tại hoặc đã ngừng kinh doanh`);
      }

      const unitPrice = Number(variant.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      const caloriesPerUnit = variant.products.nutrition_facts
        ? (Number(variant.net_weight_g) / 100.0) * Number(variant.products.nutrition_facts.calories_kcal)
        : null;

      orderItemsData.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        product_name: variant.products.name,
        variant_name: variant.name,
        sku: variant.sku,
        unit_price: unitPrice,
        quantity: item.quantity,
        discount_amount: 0,
        line_total: lineTotal,
        calories_kcal: caloriesPerUnit,
      });
    }

    // 2. Tính phí vận chuyển
    let shippingFee = 25000;
    if (dto.shippingMethodId) {
      const sm = await this.prisma.shipping_methods.findUnique({
        where: { id: BigInt(dto.shippingMethodId) },
      });
      if (sm) {
        shippingFee = Number(sm.base_fee);
        if (sm.free_ship_threshold && subtotal >= Number(sm.free_ship_threshold)) {
          shippingFee = 0;
        }
      }
    } else if (subtotal >= 300000) {
      shippingFee = 0;
    }

    // 3. Tính coupon discount
    let couponId: bigint | null = null;
    let couponCode: string | null = null;
    let discountAmount = 0;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupons.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });

      if (coupon && coupon.is_active) {
        if (!coupon.ends_at || new Date(coupon.ends_at) >= new Date()) {
          couponId = coupon.id;
          couponCode = coupon.code;
          if (coupon.discount_type === 'percent') {
            discountAmount = (subtotal * Number(coupon.discount_value)) / 100.0;
            if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
              discountAmount = Number(coupon.max_discount_amount);
            }
          } else if (coupon.discount_type === 'fixed_amount') {
            discountAmount = Number(coupon.discount_value);
          } else if (coupon.discount_type === 'free_shipping') {
            shippingFee = 0;
          }
        }
      }
    }

    // 4. Tính điểm thưởng giảm giá (1 điểm = 100đ)
    let pointsUsed = 0;
    let pointsDiscount = 0;
    if (dto.pointsToUse && dto.pointsToUse > 0) {
      const loyalty = await this.prisma.loyalty_accounts.findUnique({
        where: { user_id: BigInt(userId) },
      });
      if (loyalty && loyalty.points_balance >= dto.pointsToUse) {
        pointsUsed = dto.pointsToUse;
        pointsDiscount = pointsUsed * 100;
        // Giới hạn không giảm quá 50% subtotal
        if (pointsDiscount > subtotal * 0.5) {
          pointsDiscount = subtotal * 0.5;
          pointsUsed = Math.floor(pointsDiscount / 100);
        }
      }
    }

    const totalAmount = subtotal - discountAmount - pointsDiscount + shippingFee;
    const pointsEarned = Math.floor(totalAmount / 1000); // 1,000đ = 1 điểm

    // 5. Lưu đơn hàng
    const order = await this.prisma.orders.create({
      data: {
        user_id: BigInt(userId),
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: dto.paymentMethod as any,
        shipping_method_id: dto.shippingMethodId ? BigInt(dto.shippingMethodId) : null,
        ship_recipient_name: dto.recipientName,
        ship_phone: dto.phone,
        ship_province: dto.province,
        ship_district: dto.district,
        ship_ward: dto.ward,
        ship_street: dto.street,
        ship_note: dto.note,
        subtotal,
        coupon_id: couponId,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        points_used: pointsUsed,
        points_discount: pointsDiscount,
        shipping_fee: shippingFee,
        tax_amount: 0,
        total_amount: totalAmount,
        points_earned: pointsEarned,
        order_items: {
          create: orderItemsData,
        },
      },
      include: {
        order_items: true,
      },
    });

    // 6. Trừ điểm nếu có sử dụng
    if (pointsUsed > 0) {
      await this.prisma.loyalty_transactions.create({
        data: {
          user_id: BigInt(userId),
          txn_type: 'redeem',
          points: -pointsUsed,
          order_id: order.id,
          description: `Sử dụng điểm cho đơn hàng #${order.order_number}`,
        },
      });
    }

    // 7. Tự động dọn giỏ hàng của user
    const cart = await this.prisma.carts.findFirst({
      where: { user_id: BigInt(userId) },
    });
    if (cart) {
      await this.prisma.cart_items.deleteMany({
        where: { cart_id: cart.id },
      });
    }

    return {
      message: 'Đặt hàng thành công!',
      order: {
        id: Number(order.id),
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discount_amount),
        pointsDiscount: Number(order.points_discount),
        shippingFee: Number(order.shipping_fee),
        totalAmount: Number(order.total_amount),
        pointsEarned: order.points_earned,
        placedAt: order.placed_at,
        itemCount: order.order_items.length,
      },
    };
  }

  async getMyOrders(userId: number) {
    const orders = await this.prisma.orders.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { placed_at: 'desc' },
      include: {
        order_items: true,
      },
    });

    return orders.map((o) => ({
      id: Number(o.id),
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      totalAmount: Number(o.total_amount),
      pointsEarned: o.points_earned,
      placedAt: o.placed_at,
      items: o.order_items.map((i) => ({
        id: Number(i.id),
        productName: i.product_name,
        variantName: i.variant_name,
        unitPrice: Number(i.unit_price),
        quantity: i.quantity,
        lineTotal: Number(i.line_total),
      })),
    }));
  }

  async getOrderDetail(userId: number, orderId: number) {
    const order = await this.prisma.orders.findFirst({
      where: { id: BigInt(orderId), user_id: BigInt(userId) },
      include: {
        order_items: true,
        order_status_history: {
          orderBy: { changed_at: 'asc' },
        },
        shipments: {
          include: {
            shipment_events: {
              orderBy: { occurred_at: 'asc' },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return {
      id: Number(order.id),
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      shippingAddress: {
        recipientName: order.ship_recipient_name,
        phone: order.ship_phone,
        province: order.ship_province,
        district: order.ship_district,
        ward: order.ship_ward,
        street: order.ship_street,
        note: order.ship_note,
      },
      pricing: {
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discount_amount),
        pointsDiscount: Number(order.points_discount),
        shippingFee: Number(order.shipping_fee),
        totalAmount: Number(order.total_amount),
        pointsEarned: order.points_earned,
      },
      placedAt: order.placed_at,
      items: order.order_items.map((i) => ({
        id: Number(i.id),
        productName: i.product_name,
        variantName: i.variant_name,
        sku: i.sku,
        unitPrice: Number(i.unit_price),
        quantity: i.quantity,
        lineTotal: Number(i.line_total),
        caloriesKcal: i.calories_kcal ? Number(i.calories_kcal) : null,
      })),
      history: order.order_status_history.map((h) => ({
        toStatus: h.to_status,
        note: h.note,
        changedAt: h.changed_at,
      })),
    };
  }
}
