import { Injectable } from '@nestjs/common';
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
