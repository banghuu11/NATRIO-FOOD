import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async getActiveCoupons() {
    const coupons = await this.prisma.coupons.findMany({
      where: {
        is_active: true,
        OR: [{ ends_at: null }, { ends_at: { gte: new Date() } }],
      },
      orderBy: { created_at: 'desc' },
    });

    return coupons.map((c) => ({
      id: Number(c.id),
      code: c.code,
      description: c.description,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      minOrderAmount: Number(c.min_order_amount),
      maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
      endsAt: c.ends_at,
    }));
  }

  async findAllCouponsForAdmin() {
    const coupons = await this.prisma.coupons.findMany({
      orderBy: { created_at: 'desc' },
    });

    return coupons.map((c) => ({
      id: Number(c.id),
      code: c.code,
      description: c.description,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      minOrderAmount: Number(c.min_order_amount),
      maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
      usageLimit: c.usage_limit,
      usageLimitPerUser: c.usage_limit_per_user,
      usedCount: c.used_count,
      firstOrderOnly: c.first_order_only,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));
  }

  async createCoupon(data: {
    code: string;
    description?: string;
    discountType: 'percent' | 'fixed_amount' | 'free_shipping';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    firstOrderOnly?: boolean;
    endsAt?: string;
  }) {
    const existing = await this.prisma.coupons.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`Mã giảm giá '${data.code}' đã tồn tại.`);
    }

    const coupon = await this.prisma.coupons.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discountType,
        discount_value: data.discountValue || 0,
        min_order_amount: data.minOrderAmount || 0,
        max_discount_amount: data.maxDiscountAmount || null,
        usage_limit: data.usageLimit || null,
        first_order_only: data.firstOrderOnly || false,
        ends_at: data.endsAt ? new Date(data.endsAt) : null,
        is_active: true,
      },
    });

    return {
      message: 'Tạo mã giảm giá thành công',
      coupon: {
        id: Number(coupon.id),
        code: coupon.code,
      },
    };
  }

  async updateCoupon(id: number, data: {
    code?: string;
    description?: string;
    discountType?: 'percent' | 'fixed_amount' | 'free_shipping';
    discountValue?: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    firstOrderOnly?: boolean;
    endsAt?: string;
    isActive?: boolean;
  }) {
    const coupon = await this.prisma.coupons.findUnique({
      where: { id: BigInt(id) },
    });
    if (!coupon) {
      throw new NotFoundException(`Không tìm thấy mã giảm giá ID: ${id}`);
    }

    const updateData: any = { updated_at: new Date() };
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discountType !== undefined) updateData.discount_type = data.discountType;
    if (data.discountValue !== undefined) updateData.discount_value = data.discountValue;
    if (data.minOrderAmount !== undefined) updateData.min_order_amount = data.minOrderAmount;
    if (data.maxDiscountAmount !== undefined) updateData.max_discount_amount = data.maxDiscountAmount;
    if (data.usageLimit !== undefined) updateData.usage_limit = data.usageLimit;
    if (data.firstOrderOnly !== undefined) updateData.first_order_only = data.firstOrderOnly;
    if (data.endsAt !== undefined) updateData.ends_at = data.endsAt ? new Date(data.endsAt) : null;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    await this.prisma.coupons.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return { message: 'Cập nhật mã giảm giá thành công' };
  }

  async deleteCoupon(id: number) {
    const coupon = await this.prisma.coupons.findUnique({
      where: { id: BigInt(id) },
    });
    if (!coupon) {
      throw new NotFoundException(`Không tìm thấy mã giảm giá ID: ${id}`);
    }

    await this.prisma.coupons.delete({
      where: { id: BigInt(id) },
    });

    return { message: 'Đã xóa mã giảm giá thành công' };
  }

  async findAllFlashSalesForAdmin() {
    const flashSales = await this.prisma.flash_sales.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        flash_sale_items: {
          include: {
            product_variants: {
              include: {
                products: {
                  include: { product_images: true },
                },
              },
            },
          },
        },
      },
    });

    return flashSales.map((fs) => ({
      id: Number(fs.id),
      name: fs.name,
      startsAt: fs.starts_at,
      endsAt: fs.ends_at,
      isActive: fs.is_active,
      createdAt: fs.created_at,
      items: fs.flash_sale_items.map((item) => {
        const v = item.product_variants;
        const p = v.products;
        return {
          id: Number(item.id),
          variantId: Number(v.id),
          productName: p.name,
          variantName: v.name,
          originalPrice: Number(v.price),
          salePrice: Number(item.sale_price),
          discountPercent: Math.round(((Number(v.price) - Number(item.sale_price)) / Number(v.price)) * 100),
          quantityLimit: item.quantity_limit,
          soldCount: item.sold_count,
          imageUrl: p.product_images[0]?.url || 'https://placehold.co/600x600?text=Nutrio',
        };
      }),
    }));
  }

  async createFlashSale(data: {
    name: string;
    startsAt: string;
    endsAt: string;
    items?: { variantId: number; salePrice: number; quantityLimit?: number }[];
  }) {
    const fs = await this.prisma.flash_sales.create({
      data: {
        name: data.name,
        starts_at: new Date(data.startsAt),
        ends_at: new Date(data.endsAt),
        is_active: true,
        flash_sale_items: data.items && data.items.length > 0
          ? {
              create: data.items.map((item) => ({
                variant_id: BigInt(item.variantId),
                sale_price: item.salePrice,
                quantity_limit: item.quantityLimit || 50,
                sold_count: 0,
              })),
            }
          : undefined,
      },
    });

    return {
      message: 'Tạo chiến dịch Flash Sale thành công',
      id: Number(fs.id),
    };
  }

  async toggleFlashSale(id: number, isActive: boolean) {
    const fs = await this.prisma.flash_sales.findUnique({
      where: { id: BigInt(id) },
    });
    if (!fs) {
      throw new NotFoundException(`Không tìm thấy Flash Sale ID: ${id}`);
    }

    await this.prisma.flash_sales.update({
      where: { id: BigInt(id) },
      data: { is_active: isActive },
    });

    return { message: 'Cập nhật trạng thái Flash Sale thành công' };
  }

  async getFlashSales() {
    const flashSales = await this.prisma.flash_sales.findMany({
      where: {
        is_active: true,
        ends_at: { gte: new Date() },
      },
      include: {
        flash_sale_items: {
          include: {
            product_variants: {
              include: {
                products: {
                  include: { product_images: true },
                },
              },
            },
          },
        },
      },
    });

    return flashSales.map((fs) => ({
      id: Number(fs.id),
      name: fs.name,
      startsAt: fs.starts_at,
      endsAt: fs.ends_at,
      items: fs.flash_sale_items.map((item) => {
        const v = item.product_variants;
        const p = v.products;
        return {
          id: Number(item.id),
          variantId: Number(v.id),
          productName: p.name,
          variantName: v.name,
          originalPrice: Number(v.price),
          salePrice: Number(item.sale_price),
          discountPercent: Math.round(((Number(v.price) - Number(item.sale_price)) / Number(v.price)) * 100),
          quantityLimit: item.quantity_limit,
          soldCount: item.sold_count,
          imageUrl: p.product_images[0]?.url || 'https://placehold.co/600x600?text=Nutrio',
        };
      }),
    }));
  }

  async getBundles() {
    const bundles = await this.prisma.bundles.findMany({
      where: { is_active: true },
      include: {
        bundle_items: {
          include: {
            product_variants: {
              include: {
                products: true,
              },
            },
          },
        },
      },
    });

    return bundles.map((b) => ({
      id: Number(b.id),
      name: b.name,
      slug: b.slug,
      description: b.description,
      price: Number(b.price),
      imageUrl: b.image_url,
      items: b.bundle_items.map((bi) => ({
        productName: bi.product_variants.products.name,
        variantName: bi.product_variants.name,
        quantity: bi.quantity,
      })),
    }));
  }
}
