import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { PLACEHOLDER_IMG } from '../products/product.mapper';

const reviewInclude = {
  users: { select: { full_name: true, avatar_url: true } },
  review_media: true,
  order_items: { select: { variant_name: true } },
  products: { select: { name: true, slug: true, product_images: { take: 1, orderBy: [{ is_primary: 'desc' as const }] } } },
} satisfies Prisma.reviewsInclude;

/** "Nguyễn Thị Lan" → "Nguyễn T. Lan" – show reviewers without full personal names. */
const maskName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return [parts[0], ...parts.slice(1, -1).map((p) => `${p[0]}.`), parts[parts.length - 1]].join(' ');
};

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  format(r: Prisma.reviewsGetPayload<{ include: typeof reviewInclude }>, votedIds: Set<number> = new Set(), full = false) {
    return {
      id: Number(r.id),
      productId: Number(r.product_id),
      product: { name: r.products.name, slug: r.products.slug, image: r.products.product_images[0]?.url || PLACEHOLDER_IMG },
      rating: r.rating,
      title: r.title,
      content: r.content,
      author: full ? r.users.full_name : maskName(r.users.full_name),
      avatarUrl: r.users.avatar_url,
      variantName: r.order_items?.variant_name ?? null,
      isVerifiedPurchase: r.is_verified_purchase,
      helpfulCount: r.helpful_count,
      votedHelpful: votedIds.has(Number(r.id)),
      adminReply: r.admin_reply,
      repliedAt: r.replied_at,
      status: r.status,
      images: r.review_media.map((m) => m.url),
      createdAt: r.created_at,
    };
  }

  async forProduct(productId: number, opts: { page?: number; star?: number; withImages?: boolean; sort?: string }, userId?: number) {
    const page = Math.max(1, opts.page || 1);
    const where: Prisma.reviewsWhereInput = {
      product_id: BigInt(productId),
      status: 'approved',
      ...(opts.star ? { rating: opts.star } : {}),
      ...(opts.withImages ? { review_media: { some: {} } } : {}),
    };
    const orderBy: Prisma.reviewsOrderByWithRelationInput[] = opts.sort === 'helpful' ? [{ helpful_count: 'desc' }, { created_at: 'desc' }] : [{ created_at: 'desc' }];
    const [rows, total, withImages] = await Promise.all([
      this.prisma.reviews.findMany({ where, include: reviewInclude, orderBy, take: 5, skip: (page - 1) * 5 }),
      this.prisma.reviews.count({ where }),
      this.prisma.reviews.count({ where: { product_id: BigInt(productId), status: 'approved', review_media: { some: {} } } }),
    ]);
    const voted = userId
      ? new Set((await this.prisma.review_votes.findMany({ where: { user_id: BigInt(userId), review_id: { in: rows.map((r) => r.id) } } })).map((v) => Number(v.review_id)))
      : new Set<number>();
    return { data: rows.map((r) => this.format(r, voted)), meta: { page, limit: 5, total, totalPages: Math.max(1, Math.ceil(total / 5)) }, withImagesCount: withImages };
  }

  /** Highly-rated reviews for the home page testimonials. */
  async testimonials(limit = 6) {
    const rows = await this.prisma.reviews.findMany({
      where: { status: 'approved', rating: { gte: 4 }, content: { not: null } },
      include: reviewInclude,
      orderBy: [{ helpful_count: 'desc' }, { created_at: 'desc' }],
      take: limit,
    });
    return rows.map((r) => this.format(r));
  }

  /** Delivered order items the user has not reviewed yet. */
  async eligible(userId: number) {
    const items = await this.prisma.order_items.findMany({
      where: { product_id: { not: null }, orders: { user_id: BigInt(userId), status: { in: ['delivered', 'completed'] } }, reviews: { none: {} } },
      include: { orders: { select: { order_number: true, delivered_at: true } }, products: { select: { name: true, slug: true, product_images: { take: 1 } } } },
      orderBy: { id: 'desc' },
    });
    return items.map((i) => ({
      orderItemId: Number(i.id),
      orderNumber: i.orders.order_number,
      deliveredAt: i.orders.delivered_at,
      productId: Number(i.product_id),
      name: i.products?.name ?? i.product_name,
      slug: i.products?.slug,
      image: i.products?.product_images[0]?.url || PLACEHOLDER_IMG,
      variantName: i.variant_name,
    }));
  }

  async mine(userId: number) {
    const rows = await this.prisma.reviews.findMany({ where: { user_id: BigInt(userId) }, include: reviewInclude, orderBy: { created_at: 'desc' } });
    return rows.map((r) => this.format(r, new Set(), true));
  }

  async create(userId: number, dto: CreateReviewDto) {
    const item = await this.prisma.order_items.findUnique({ where: { id: BigInt(dto.orderItemId) }, include: { orders: true, reviews: true } });
    if (!item || Number(item.orders.user_id) !== userId) throw new ForbiddenException('Bạn chỉ có thể đánh giá sản phẩm đã mua');
    if (!['delivered', 'completed'].includes(item.orders.status)) throw new BadRequestException('Bạn có thể đánh giá sau khi nhận hàng thành công');
    if (!item.product_id) throw new BadRequestException('Không thể đánh giá combo, vui lòng đánh giá từng sản phẩm');
    if (item.reviews.length) throw new BadRequestException('Bạn đã đánh giá sản phẩm này cho đơn hàng này');
    if (!dto.content && !dto.title) throw new BadRequestException('Vui lòng viết vài dòng nhận xét');

    const review = await this.prisma.reviews.create({
      data: {
        product_id: item.product_id,
        user_id: BigInt(userId),
        order_item_id: item.id,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        is_verified_purchase: true,
        status: 'approved',
        review_media: dto.images?.length ? { create: dto.images.map((url) => ({ url, media_type: 'image' as const })) } : undefined,
      },
      include: reviewInclude,
    });
    return this.format(review, new Set(), true);
  }

  async update(userId: number, id: number, dto: UpdateReviewDto) {
    const r = await this.prisma.reviews.findUnique({ where: { id: BigInt(id) } });
    if (!r || Number(r.user_id) !== userId) throw new NotFoundException('Không tìm thấy đánh giá');
    if (r.status === 'rejected') throw new BadRequestException('Đánh giá đã bị ẩn do vi phạm, không thể chỉnh sửa');
    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.images) {
        await tx.review_media.deleteMany({ where: { review_id: r.id } });
        if (dto.images.length) await tx.review_media.createMany({ data: dto.images.map((url) => ({ review_id: r.id, url })) });
      }
      return tx.reviews.update({ where: { id: r.id }, data: { rating: dto.rating, title: dto.title, content: dto.content }, include: reviewInclude });
    });
    return this.format(updated, new Set(), true);
  }

  async remove(userId: number, id: number) {
    const r = await this.prisma.reviews.findUnique({ where: { id: BigInt(id) } });
    if (!r || Number(r.user_id) !== userId) throw new NotFoundException('Không tìm thấy đánh giá');
    await this.prisma.reviews.delete({ where: { id: r.id } });
    return { message: 'Đã xóa đánh giá' };
  }

  async toggleHelpful(userId: number, id: number) {
    const r = await this.prisma.reviews.findUnique({ where: { id: BigInt(id) } });
    if (!r || r.status !== 'approved') throw new NotFoundException('Không tìm thấy đánh giá');
    if (Number(r.user_id) === userId) throw new BadRequestException('Không thể bình chọn cho đánh giá của chính bạn');
    const key = { review_id_user_id: { review_id: r.id, user_id: BigInt(userId) } };
    const existing = await this.prisma.review_votes.findUnique({ where: key });
    if (existing) await this.prisma.review_votes.delete({ where: key });
    else await this.prisma.review_votes.create({ data: { review_id: r.id, user_id: BigInt(userId) } });
    const fresh = await this.prisma.reviews.findUnique({ where: { id: r.id } });
    return { voted: !existing, helpfulCount: fresh?.helpful_count ?? 0 };
  }
}
