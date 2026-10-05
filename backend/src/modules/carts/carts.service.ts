import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto, ApplyCouponDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartsService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId?: number, sessionToken?: string) {
    if (userId) {
      let cart = await this.prisma.carts.findFirst({
        where: { user_id: BigInt(userId) },
      });
      if (!cart) {
        cart = await this.prisma.carts.create({
          data: { user_id: BigInt(userId) },
        });
      }
      return cart;
    }

    if (sessionToken) {
      let cart = await this.prisma.carts.findFirst({
        where: { session_token: sessionToken },
      });
      if (!cart) {
        cart = await this.prisma.carts.create({
          data: { session_token: sessionToken },
        });
      }
      return cart;
    }

    throw new BadRequestException('Cần cung cấp tài khoản hoặc session token');
  }

  async getCart(userId?: number, sessionToken?: string) {
    const cart = await this.getOrCreateCart(userId, sessionToken);

    const items = await this.prisma.cart_items.findMany({
      where: { cart_id: cart.id },
      include: {
        product_variants: {
          include: {
            products: {
              include: {
                nutrition_facts: true,
                product_images: true,
              },
            },
          },
        },
        bundles: true,
      },
      orderBy: { added_at: 'desc' },
    });

    let subtotal = 0;
    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;
    let totalSugar = 0;
    let totalFiber = 0;

    const formattedItems = items.map((item) => {
      let price = 0;
      let name = '';
      let variantName = '';
      let imageUrl = 'https://placehold.co/600x600?text=Nutrio';
      let weightG = 0;
      let itemKcal = 0;

      if (item.product_variants) {
        const v = item.product_variants;
        const p = v.products;
        price = Number(v.price);
        name = p.name;
        variantName = v.name;
        imageUrl = p.product_images[0]?.url || imageUrl;
        weightG = Number(v.net_weight_g);

        if (p.nutrition_facts) {
          const ratio = (weightG * item.quantity) / 100.0;
          const kcal = Number(p.nutrition_facts.calories_kcal) * ratio;
          const protein = Number(p.nutrition_facts.protein_g) * ratio;
          const carb = Number(p.nutrition_facts.carbohydrate_g) * ratio;
          const fat = Number(p.nutrition_facts.fat_g) * ratio;
          const sugar = Number(p.nutrition_facts.sugar_g) * ratio;
          const fiber = Number(p.nutrition_facts.fiber_g) * ratio;

          itemKcal = kcal;
          totalKcal += kcal;
          totalProtein += protein;
          totalCarb += carb;
          totalFat += fat;
          totalSugar += sugar;
          totalFiber += fiber;
        }
      } else if (item.bundles) {
        price = Number(item.bundles.price);
        name = item.bundles.name;
        imageUrl = item.bundles.image_url || imageUrl;
      }

      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      return {
        id: Number(item.id),
        variantId: item.variant_id ? Number(item.variant_id) : null,
        bundleId: item.bundle_id ? Number(item.bundle_id) : null,
        name,
        variantName,
        imageUrl,
        unitPrice: price,
        quantity: item.quantity,
        lineTotal,
        caloriesKcal: Math.round(itemKcal * 10) / 10,
      };
    });

    // Tính coupon nếu có
    let discountAmount = 0;
    let appliedCoupon = null;

    if (cart.coupon_id) {
      const coupon = await this.prisma.coupons.findUnique({
        where: { id: cart.coupon_id },
      });
      if (coupon && coupon.is_active) {
        appliedCoupon = {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discount_type,
          discountValue: Number(coupon.discount_value),
        };
        if (coupon.discount_type === 'percent') {
          discountAmount = (subtotal * Number(coupon.discount_value)) / 100.0;
          if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
            discountAmount = Number(coupon.max_discount_amount);
          }
        } else if (coupon.discount_type === 'fixed_amount') {
          discountAmount = Number(coupon.discount_value);
        }
      }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount);

    return {
      cartId: Number(cart.id),
      items: formattedItems,
      itemCount: formattedItems.reduce((sum, i) => sum + i.quantity, 0),
      summary: {
        subtotal,
        discountAmount,
        finalTotal,
        appliedCoupon,
      },
      nutritionSummary: {
        totalKcal: Math.round(totalKcal * 10) / 10,
        totalProteinG: Math.round(totalProtein * 10) / 10,
        totalCarbG: Math.round(totalCarb * 10) / 10,
        totalFatG: Math.round(totalFat * 10) / 10,
        totalSugarG: Math.round(totalSugar * 10) / 10,
        totalFiberG: Math.round(totalFiber * 10) / 10,
      },
    };
  }

  async addItem(userId: number | undefined, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId, dto.sessionToken);

    if (dto.variantId) {
      const existing = await this.prisma.cart_items.findFirst({
        where: { cart_id: cart.id, variant_id: BigInt(dto.variantId) },
      });

      if (existing) {
        await this.prisma.cart_items.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + dto.quantity },
        });
      } else {
        await this.prisma.cart_items.create({
          data: {
            cart_id: cart.id,
            variant_id: BigInt(dto.variantId),
            quantity: dto.quantity,
          },
        });
      }
    } else if (dto.bundleId) {
      const existing = await this.prisma.cart_items.findFirst({
        where: { cart_id: cart.id, bundle_id: BigInt(dto.bundleId) },
      });

      if (existing) {
        await this.prisma.cart_items.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + dto.quantity },
        });
      } else {
        await this.prisma.cart_items.create({
          data: {
            cart_id: cart.id,
            bundle_id: BigInt(dto.bundleId),
            quantity: dto.quantity,
          },
        });
      }
    } else {
      throw new BadRequestException('Vui lòng chọn variantId hoặc bundleId');
    }

    return this.getCart(userId, dto.sessionToken);
  }

  async updateItemQuantity(itemId: number, dto: UpdateCartItemDto, userId?: number, sessionToken?: string) {
    const item = await this.prisma.cart_items.findUnique({
      where: { id: BigInt(itemId) },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    }

    await this.prisma.cart_items.update({
      where: { id: BigInt(itemId) },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId, sessionToken);
  }

  async removeItem(itemId: number, userId?: number, sessionToken?: string) {
    await this.prisma.cart_items.delete({
      where: { id: BigInt(itemId) },
    });

    return this.getCart(userId, sessionToken);
  }

  async applyCoupon(dto: ApplyCouponDto, userId?: number) {
    const cart = await this.getOrCreateCart(userId, dto.sessionToken);

    const coupon = await this.prisma.coupons.findUnique({
      where: { code: dto.couponCode.toUpperCase() },
    });

    if (!coupon || !coupon.is_active) {
      throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã hết hạn');
    }

    if (coupon.ends_at && new Date(coupon.ends_at) < new Date()) {
      throw new BadRequestException('Mã giảm giá đã hết thời gian sử dụng');
    }

    await this.prisma.carts.update({
      where: { id: cart.id },
      data: { coupon_id: coupon.id },
    });

    return this.getCart(userId, dto.sessionToken);
  }
}
