import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { PLACEHOLDER_IMG } from '../products/product.mapper';
import { SubmitQuizDto } from './dto/quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
  ) {}

  async questions() {
    const qs = await this.prisma.quiz_questions.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: { quiz_options: { orderBy: { sort_order: 'asc' } } },
    });
    return qs.map((q) => ({
      id: Number(q.id),
      question: q.question_text,
      isMultiple: q.is_multiple,
      options: q.quiz_options.map((o) => ({ id: Number(o.id), text: o.option_text, icon: o.icon, exclusive: !!(o.meta as any)?.exclusive })),
    }));
  }

  async submit(dto: SubmitQuizDto, userId?: number) {
    const optionIds = [...new Set(dto.answers.flatMap((a) => a.optionIds))].map((i) => BigInt(i));
    if (!optionIds.length) throw new BadRequestException('Vui lòng trả lời các câu hỏi');
    const options = await this.prisma.quiz_options.findMany({
      where: { id: { in: optionIds }, quiz_questions: { is_active: true } },
      include: { quiz_option_effects: { include: { diets: true, allergens: true, categories: true } }, quiz_questions: true },
    });
    if (!options.length) throw new BadRequestException('Câu trả lời không hợp lệ');

    const dietBoost = new Map<string, number>();
    const categoryBoost = new Map<number, number>();
    const excluded = new Set<string>();
    let maxPrice: number | null = null;
    for (const o of options) {
      const meta = (o.meta || {}) as { maxPrice?: number };
      if (meta.maxPrice) maxPrice = maxPrice === null ? meta.maxPrice : Math.min(maxPrice, meta.maxPrice);
      for (const e of o.quiz_option_effects) {
        if (e.effect_type === 'boost_diet' && e.diets) dietBoost.set(e.diets.code, (dietBoost.get(e.diets.code) ?? 0) + e.weight);
        if (e.effect_type === 'boost_category' && e.category_id) categoryBoost.set(Number(e.category_id), (categoryBoost.get(Number(e.category_id)) ?? 0) + e.weight);
        if (e.effect_type === 'exclude_allergen' && e.allergens) excluded.add(e.allergens.code);
      }
    }

    // Candidate products: active, in stock, free from excluded allergens
    const pool = await this.products.findAll({ page: 1, limit: 60, inStock: true, excludeAllergens: [...excluded] } as any);
    const parents = await this.prisma.categories.findMany({ select: { id: true, parent_id: true } });
    const parentOf = new Map(parents.map((c) => [Number(c.id), c.parent_id ? Number(c.parent_id) : null]));
    const scored = pool.data
      .filter((p) => maxPrice === null || (p.defaultVariant?.price ?? 0) <= maxPrice)
      .map((p) => {
        let score = 0;
        const reasons: string[] = [];
        for (const d of p.diets) {
          const w = dietBoost.get(d.code);
          if (w) {
            score += w;
            reasons.push(d.name);
          }
        }
        const cw = (categoryBoost.get(p.category.id) ?? 0) + (categoryBoost.get(parentOf.get(p.category.id) ?? -1) ?? 0);
        if (cw) {
          score += cw;
          reasons.push(p.category.name);
        }
        score += p.nutriScoreGrade === 'A' ? 1 : 0;
        return { product: p, score, reasons: [...new Set(reasons)] };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.product.avgRating - a.product.avgRating)
      .slice(0, 8);

    // Combos whose items are all allergen-safe and that fit the budget (×1.5 since a combo replaces several purchases)
    const bundles = await this.prisma.bundles.findMany({
      where: { is_active: true },
      include: { bundle_items: { include: { product_variants: { include: { products: { include: { product_allergens: { include: { allergens: true } }, product_diets: { include: { diets: true } } } } } } } } },
    });
    const combos = bundles
      .filter((b) => maxPrice === null || Number(b.price) <= maxPrice * 1.5)
      .filter((b) => b.bundle_items.every((bi) => bi.product_variants.products.product_allergens.every((pa) => !excluded.has(pa.allergens.code))))
      .map((b) => ({
        b,
        score: b.bundle_items.reduce((s, bi) => s + bi.product_variants.products.product_diets.reduce((x, d) => x + (dietBoost.get(d.diets.code) ?? 0), 0), 0),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ b }) => ({
        id: Number(b.id),
        name: b.name,
        slug: b.slug,
        description: b.description,
        image: b.image_url || PLACEHOLDER_IMG,
        price: Number(b.price),
        retailPrice: b.bundle_items.reduce((s, bi) => s + Number(bi.product_variants.price) * bi.quantity, 0),
        items: b.bundle_items.map((bi) => `${bi.product_variants.products.name} (${bi.product_variants.name})`),
      }));

    // Persist the session for analytics / history
    const session = await this.prisma.quiz_sessions.create({
      data: {
        user_id: userId ? BigInt(userId) : null,
        completed_at: new Date(),
        quiz_answers: { create: options.map((o) => ({ question_id: o.question_id, option_id: o.id })) },
        quiz_recommendations: { create: scored.map((s, i) => ({ product_id: BigInt(s.product.id), score: s.score, rank: i + 1 })) },
      },
    });

    const topDiets = [...dietBoost.entries()].sort((a, b) => b[1] - a[1]).map(([code]) => code);
    return {
      sessionId: Number(session.id),
      summary: {
        focus: topDiets.slice(0, 3),
        excludedAllergens: [...excluded],
        maxPrice,
      },
      products: scored.map((s) => ({ ...s.product, matchScore: s.score, reasons: s.reasons })),
      combos,
    };
  }
}
