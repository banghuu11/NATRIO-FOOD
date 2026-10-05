import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getReviewsByProduct(productId: number) {
    const reviews = await this.prisma.reviews.findMany({
      where: {
        product_id: BigInt(productId),
        status: 'approved',
      },
      orderBy: { created_at: 'desc' },
      include: {
        users: true,
        review_media: true,
      },
    });

    return reviews.map((r) => ({
      id: Number(r.id),
      rating: r.rating,
      title: r.title,
      content: r.content,
      isVerifiedPurchase: r.is_verified_purchase,
      helpfulCount: r.helpful_count,
      adminReply: r.admin_reply,
      createdAt: r.created_at,
      author: {
        fullName: r.users.full_name,
        avatarUrl: r.users.avatar_url,
      },
      media: r.review_media.map((m) => ({
        type: m.media_type,
        url: m.url,
      })),
    }));
  }

  async createReview(userId: number, dto: CreateReviewDto) {
    const product = await this.prisma.products.findUnique({
      where: { id: BigInt(dto.productId) },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const review = await this.prisma.reviews.create({
      data: {
        product_id: BigInt(dto.productId),
        user_id: BigInt(userId),
        order_item_id: dto.orderItemId ? BigInt(dto.orderItemId) : null,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        is_verified_purchase: Boolean(dto.orderItemId),
        status: 'approved', // Auto approve cho demo, hoặc pending trong thực tế
      },
    });

    return {
      message: 'Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp ý kiến.',
      review: {
        id: Number(review.id),
        rating: review.rating,
        content: review.content,
        createdAt: review.created_at,
      },
    };
  }
}
