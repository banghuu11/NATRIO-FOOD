import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitQuizAnswerDto } from './dto/quiz.dto';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async getQuestions() {
    const questions = await this.prisma.quiz_questions.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        quiz_options: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    return questions.map((q) => ({
      id: Number(q.id),
      questionText: q.question_text,
      isMultiple: q.is_multiple,
      sortOrder: q.sort_order,
      options: q.quiz_options.map((opt) => ({
        id: Number(opt.id),
        optionText: opt.option_text,
        icon: opt.icon,
        sortOrder: opt.sort_order,
      })),
    }));
  }

  async submitAnswers(dto: SubmitQuizAnswerDto, userId?: number) {
    // 1. Tạo session
    const session = await this.prisma.quiz_sessions.create({
      data: {
        user_id: userId ? BigInt(userId) : null,
        session_token: dto.sessionToken || `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        completed_at: new Date(),
      },
    });

    // 2. Lưu câu trả lời
    for (const optId of dto.optionIds) {
      const option = await this.prisma.quiz_options.findUnique({
        where: { id: BigInt(optId) },
      });
      if (option) {
        await this.prisma.quiz_answers.create({
          data: {
            session_id: session.id,
            question_id: option.question_id,
            option_id: option.id,
          },
        });
      }
    }

    // 3. Gọi hàm gợi ý fn_quiz_recommend trong PostgreSQL
    const recommended: any[] = await this.prisma.$queryRaw`
      SELECT * FROM fn_quiz_recommend(${session.id}::bigint, 6::int);
    `;

    const productIds = recommended.map((r) => r.product_id);

    // Lấy thông tin chi tiết các sản phẩm được đề xuất
    const products = await this.prisma.products.findMany({
      where: { id: { in: productIds } },
      include: {
        categories: true,
        product_variants: {
          where: { is_active: true },
          orderBy: { price: 'asc' },
        },
        product_images: {
          orderBy: { is_primary: 'desc' },
        },
        nutrition_facts: true,
        product_diets: {
          include: { diets: true },
        },
      },
    });

    const formattedProducts = products.map((p) => {
      const recItem = recommended.find((r) => BigInt(r.product_id) === p.id);
      return {
        id: Number(p.id),
        name: p.name,
        slug: p.slug,
        shortDescription: p.short_description,
        nutriScoreGrade: p.nutri_score_grade,
        matchScore: recItem ? Number(recItem.score) : 1,
        category: p.categories.name,
        price: p.product_variants[0] ? Number(p.product_variants[0].price) : 0,
        primaryImage: p.product_images[0]?.url || 'https://placehold.co/600x600?text=Nutrio',
        diets: p.product_diets.map((pd) => pd.diets.name_vi),
      };
    });

    // Sắp xếp theo matchScore giảm dần
    formattedProducts.sort((a, b) => b.matchScore - a.matchScore);

    return {
      sessionId: Number(session.id),
      sessionToken: session.session_token,
      recommendationCount: formattedProducts.length,
      recommendations: formattedProducts,
    };
  }
}
