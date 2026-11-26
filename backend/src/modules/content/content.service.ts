import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { ReviewsService } from '../reviews/reviews.service';
import { RecipesService } from '../recipes/recipes.service';
import { PricingService } from '../pricing/pricing.service';
import { PLACEHOLDER_IMG } from '../products/product.mapper';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
    private categories: CategoriesService,
    private reviews: ReviewsService,
    private recipes: RecipesService,
    private pricing: PricingService,
  ) {}

  async banners(position = 'home_hero') {
    const now = new Date();
    const rows = await this.prisma.banners.findMany({
      where: { position, is_active: true, AND: [{ OR: [{ starts_at: null }, { starts_at: { lte: now } }] }, { OR: [{ ends_at: null }, { ends_at: { gt: now } }] }] },
      orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
    });
    return rows.map((b) => ({ id: Number(b.id), title: b.title, subtitle: b.subtitle, ctaLabel: b.cta_label, imageUrl: b.image_url, linkUrl: b.link_url }));
  }

  async home() {
    const [heroBanners, promoBanners, categories, collections, bundles, recipes, posts, testimonials, flashSale] = await Promise.all([
      this.banners('home_hero'),
      this.banners('home_promo'),
      this.categories.tree(),
      this.products.collections(8),
      this.bundles(),
      this.recipes.list({}),
      this.posts(1, 3),
      this.reviews.testimonials(6),
      this.flashSale(),
    ]);
    return { heroBanners, promoBanners, categories, ...collections, bundles: bundles.slice(0, 4), recipes: recipes.slice(0, 6), posts: posts.data, testimonials, flashSale };
  }

  async bundles() {
    const now = new Date();
    const rows = await this.prisma.bundles.findMany({
      where: { is_active: true, AND: [{ OR: [{ starts_at: null }, { starts_at: { lte: now } }] }, { OR: [{ ends_at: null }, { ends_at: { gt: now } }] }] },
      include: { bundle_items: { include: { product_variants: { include: { products: { select: { name: true, slug: true } } } } } } },
      orderBy: { id: 'asc' },
    });
    const lines = await this.pricing.priceLines(rows.map((b) => ({ bundleId: Number(b.id), quantity: 1 })));
    return rows.map((b, i) => {
      const retail = b.bundle_items.reduce((s, bi) => s + Number(bi.product_variants.price) * bi.quantity, 0);
      return {
        id: Number(b.id),
        name: b.name,
        slug: b.slug,
        description: b.description,
        image: b.image_url || PLACEHOLDER_IMG,
        price: Number(b.price),
        retailPrice: retail,
        savePercent: retail > 0 ? Math.round(((retail - Number(b.price)) / retail) * 100) : 0,
        availableStock: lines[i]?.availableStock ?? 0,
        nutrition: lines[i]?.nutrition ?? null,
        items: b.bundle_items.map((bi) => ({ name: bi.product_variants.products.name, slug: bi.product_variants.products.slug, variantName: bi.product_variants.name, quantity: bi.quantity })),
      };
    });
  }

  async bundle(slug: string) {
    const all = await this.bundles();
    const b = all.find((x) => x.slug === slug);
    if (!b) throw new NotFoundException('Không tìm thấy combo');
    return b;
  }

  async flashSale() {
    const now = new Date();
    const sales = await this.prisma.flash_sales.findMany({
      where: { is_active: true, starts_at: { lte: now }, ends_at: { gt: now } },
      include: { flash_sale_items: true },
      orderBy: { ends_at: 'desc' },
    });
    if (!sales.length) return null;
    // Merge all running campaigns; the countdown shows the longest-running one
    const fs = { ...sales[0], flash_sale_items: [...new Map(sales.flatMap((x) => x.flash_sale_items).map((i) => [String(i.variant_id), i])).values()] };
    const variantProducts = await this.prisma.product_variants.findMany({ where: { id: { in: fs.flash_sale_items.map((i) => i.variant_id) } }, select: { id: true, product_id: true } });
    const cards = await this.products.cardsByIds(variantProducts.map((v) => v.product_id));
    return {
      id: Number(fs.id),
      name: fs.name,
      endsAt: fs.ends_at,
      items: fs.flash_sale_items
        .map((it) => {
          const pid = variantProducts.find((v) => v.id === it.variant_id)?.product_id;
          const card = cards.find((c) => c.id === Number(pid));
          if (!card) return null;
          return { ...card, salePrice: Number(it.sale_price), quantityLimit: it.quantity_limit, soldCount: it.sold_count, variantId: Number(it.variant_id) };
        })
        .filter(Boolean),
    };
  }

  async coupons() {
    const now = new Date();
    const rows = await this.prisma.coupons.findMany({
      where: { is_active: true, starts_at: { lte: now }, OR: [{ ends_at: null }, { ends_at: { gt: now } }] },
      include: { membership_tiers: true },
      orderBy: { min_order_amount: 'asc' },
    });
    return rows
      .filter((c) => !c.usage_limit || c.used_count < c.usage_limit)
      .map((c) => ({
        code: c.code,
        description: c.description,
        discountType: c.discount_type,
        discountValue: Number(c.discount_value),
        maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
        minOrderAmount: Number(c.min_order_amount),
        firstOrderOnly: c.first_order_only,
        minTier: c.membership_tiers?.name ?? null,
        endsAt: c.ends_at,
      }));
  }

  async posts(page = 1, limit = 9, category?: string) {
    const where = { is_published: true, ...(category ? { blog_categories: { slug: category } } : {}) };
    const [rows, total, cats] = await Promise.all([
      this.prisma.blog_posts.findMany({ where, orderBy: { published_at: 'desc' }, skip: (page - 1) * limit, take: limit, include: { blog_categories: true, users: { select: { full_name: true } } } }),
      this.prisma.blog_posts.count({ where }),
      this.prisma.blog_categories.findMany({ orderBy: { id: 'asc' } }),
    ]);
    return {
      data: rows.map((p) => ({
        id: Number(p.id),
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        coverImage: p.cover_image_url || PLACEHOLDER_IMG,
        category: p.blog_categories ? { name: p.blog_categories.name, slug: p.blog_categories.slug } : null,
        author: p.users?.full_name ?? 'NUTRIO',
        expertReviewer: p.expert_reviewer,
        publishedAt: p.published_at,
        readMinutes: Math.max(2, Math.round(p.content.split(/\s+/).length / 200)),
      })),
      categories: cats.map((c) => ({ name: c.name, slug: c.slug })),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async post(slug: string) {
    const p = await this.prisma.blog_posts.findUnique({ where: { slug }, include: { blog_categories: true, users: { select: { full_name: true } } } });
    if (!p || !p.is_published) throw new NotFoundException('Không tìm thấy bài viết');
    await this.prisma.blog_posts.update({ where: { id: p.id }, data: { view_count: { increment: 1 } } });
    const related = await this.posts(1, 4, p.blog_categories?.slug);
    return {
      id: Number(p.id),
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      content: p.content,
      coverImage: p.cover_image_url || PLACEHOLDER_IMG,
      category: p.blog_categories ? { name: p.blog_categories.name, slug: p.blog_categories.slug } : null,
      author: p.users?.full_name ?? 'NUTRIO',
      expertReviewer: p.expert_reviewer,
      publishedAt: p.published_at,
      viewCount: p.view_count + 1,
      related: related.data.filter((r) => r.slug !== p.slug).slice(0, 3),
    };
  }

  async page(slug: string) {
    const p = await this.prisma.cms_pages.findUnique({ where: { slug } });
    if (!p || !p.is_published) throw new NotFoundException('Không tìm thấy trang');
    return { slug: p.slug, title: p.title, content: p.content, updatedAt: p.updated_at };
  }

  async pagesList() {
    const rows = await this.prisma.cms_pages.findMany({ where: { is_published: true }, orderBy: { id: 'asc' }, select: { slug: true, title: true } });
    return rows;
  }

  async subscribe(email: string) {
    await this.prisma.newsletter_subscribers.upsert({ where: { email }, update: {}, create: { email } });
    return { message: 'Đăng ký nhận tin thành công! Mã FREESHIP đang chờ bạn ở đơn tiếp theo.' };
  }

  async contact(dto: { name: string; email: string; subject?: string; message: string }, userId?: number) {
    if (!dto.message?.trim()) throw new BadRequestException('Vui lòng nhập nội dung');
    await this.prisma.contact_messages.create({
      data: { name: dto.name, email: dto.email, subject: dto.subject, message: dto.message, user_id: userId ? BigInt(userId) : null },
    });
    return { message: 'NUTRIO đã nhận yêu cầu tư vấn. Chuyên viên dinh dưỡng sẽ liên hệ bạn trong 24 giờ.' };
  }

  async settings() {
    const s = await this.prisma.settings.findUnique({ where: { key: 'store' } });
    return s?.value ?? {};
  }
}
