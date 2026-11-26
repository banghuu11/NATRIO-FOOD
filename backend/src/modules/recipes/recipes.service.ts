import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { meal_type, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { PLACEHOLDER_IMG } from '../products/product.mapper';

const recipeInclude = {
  recipe_diets: { include: { diets: true } },
  recipe_ingredients: {
    orderBy: { sort_order: 'asc' as const },
    include: { products: { include: { product_allergens: { include: { allergens: true } } } }, product_variants: true },
  },
  recipe_steps: { orderBy: { step_number: 'asc' as const } },
} satisfies Prisma.recipesInclude;
type RecipeRow = Prisma.recipesGetPayload<{ include: typeof recipeInclude }>;

/** Allergens of ingredients that are not sold in the shop, detected by name. */
const NAME_ALLERGENS: [RegExp, string][] = [
  [/trứng/i, 'egg'],
  [/sữa(?! hạt| óc chó| hạnh nhân| dừa| yến mạch)|phô mai|bơ lạt|sữa chua|whey/i, 'milk'],
  [/tôm|cua|ghẹ|mực/i, 'shellfish'],
  [/cá /i, 'fish'],
  [/đậu phộng|lạc/i, 'peanut'],
  [/\bmè\b|vừng/i, 'sesame'],
  [/đậu nành|đậu hũ|tàu hũ|nước tương/i, 'soy'],
  [/bánh mì|lúa mì|mì ống|pasta|bột mì/i, 'gluten'],
  [/hạnh nhân|óc chó|hạt điều|macca|hồ đào|hạt dẻ/i, 'tree_nut'],
];

export const MEAL_LABEL: Record<meal_type, string> = { breakfast: 'Bữa sáng', lunch: 'Bữa trưa', dinner: 'Bữa tối', snack: 'Bữa phụ' };
const MEAL_SPLIT: Record<meal_type, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };
const MEALS: meal_type[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface PlanMeal {
  mealType: meal_type;
  mealLabel: string;
  recipeId: number;
  slug: string;
  title: string;
  image: string;
  servings: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  prepMinutes: number;
}

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
  ) {}

  allergensOf(r: RecipeRow) {
    const codes = new Set<string>();
    for (const ing of r.recipe_ingredients) {
      ing.products?.product_allergens.filter((pa) => pa.relation === 'contains').forEach((pa) => codes.add(pa.allergens.code));
      if (!ing.product_id) for (const [re, code] of NAME_ALLERGENS) if (re.test(ing.ingredient_name)) codes.add(code);
    }
    return [...codes];
  }

  card(r: RecipeRow) {
    return {
      id: Number(r.id),
      title: r.title,
      slug: r.slug,
      description: r.description,
      image: r.image_url || PLACEHOLDER_IMG,
      prepMinutes: (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0),
      servings: r.servings,
      difficulty: r.difficulty,
      caloriesPerServing: Number(r.calories_per_serving ?? 0),
      proteinG: Number(r.protein_g ?? 0),
      carbG: Number(r.carbohydrate_g ?? 0),
      fatG: Number(r.fat_g ?? 0),
      mealTypes: r.meal_types,
      diets: r.recipe_diets.map((d) => ({ code: d.diets.code, name: d.diets.name_vi })),
      allergens: this.allergensOf(r),
      shopIngredientCount: r.recipe_ingredients.filter((i) => i.variant_id).length,
    };
  }

  async list(q: { diet?: string; mealType?: meal_type; maxCalories?: number; search?: string; excludeAllergens?: string[] }) {
    const where: Prisma.recipesWhereInput = { is_published: true };
    if (q.diet) where.recipe_diets = { some: { diets: { code: q.diet } } };
    if (q.mealType) where.meal_types = { has: q.mealType };
    if (q.maxCalories) where.calories_per_serving = { lte: q.maxCalories };
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    const rows = await this.prisma.recipes.findMany({ where, include: recipeInclude, orderBy: [{ view_count: 'desc' }, { id: 'asc' }] });
    const ex = new Set(q.excludeAllergens || []);
    return rows.map((r) => this.card(r)).filter((r) => !r.allergens.some((a) => ex.has(a)));
  }

  async detail(slug: string) {
    const r = await this.prisma.recipes.findUnique({ where: { slug }, include: recipeInclude });
    if (!r || !r.is_published) throw new NotFoundException('Không tìm thấy công thức');
    await this.prisma.recipes.update({ where: { id: r.id }, data: { view_count: { increment: 1 } } });
    const productIds = r.recipe_ingredients.filter((i) => i.product_id).map((i) => i.product_id!);
    const cards = await this.products.cardsByIds(productIds);
    return {
      ...this.card(r),
      videoUrl: r.video_url,
      ingredients: r.recipe_ingredients.map((i) => ({
        name: i.ingredient_name,
        quantity: i.quantity ? Number(i.quantity) : null,
        unit: i.unit,
        note: i.note,
        product: i.product_id ? cards.find((c) => c.id === Number(i.product_id)) ?? null : null,
        variantId: i.variant_id ? Number(i.variant_id) : null,
      })),
      steps: r.recipe_steps.map((s) => ({ step: s.step_number, instruction: s.instruction, image: s.image_url })),
      cartItems: r.recipe_ingredients.filter((i) => i.variant_id).map((i) => ({ variantId: Number(i.variant_id), quantity: 1 })),
    };
  }

  // ------------------------------------------------------------------
  // Smart Meal Plan
  // ------------------------------------------------------------------
  private toMeal(r: ReturnType<RecipesService['card']>, mealType: meal_type, slotKcal: number): PlanMeal {
    const base = r.caloriesPerServing || 1;
    const servings = Math.min(2, Math.max(0.5, Math.round((slotKcal / base) * 2) / 2));
    return {
      mealType,
      mealLabel: MEAL_LABEL[mealType],
      recipeId: r.id,
      slug: r.slug,
      title: r.title,
      image: r.image,
      servings,
      kcal: Math.round(base * servings),
      proteinG: Math.round(r.proteinG * servings * 10) / 10,
      carbG: Math.round(r.carbG * servings * 10) / 10,
      fatG: Math.round(r.fatG * servings * 10) / 10,
      prepMinutes: r.prepMinutes,
    };
  }

  private dayTotals(meals: PlanMeal[]) {
    return {
      kcal: meals.reduce((s, m) => s + m.kcal, 0),
      proteinG: Math.round(meals.reduce((s, m) => s + m.proteinG, 0) * 10) / 10,
      carbG: Math.round(meals.reduce((s, m) => s + m.carbG, 0) * 10) / 10,
      fatG: Math.round(meals.reduce((s, m) => s + m.fatG, 0) * 10) / 10,
    };
  }

  /** Picks, for each meal of each day, the recipe closest to that meal's calorie budget while avoiding repeats. */
  async generate(opts: { targetCalories: number; days?: number; excludeAllergens?: string[]; diet?: string }) {
    const target = Math.round(opts.targetCalories);
    if (target < 1000 || target > 5000) throw new BadRequestException('Mục tiêu calo cần trong khoảng 1.000 – 5.000 kcal');
    const days = Math.min(7, Math.max(1, opts.days || 7));
    const pool = await this.list({ excludeAllergens: opts.excludeAllergens, diet: opts.diet });
    const used = new Map<number, number>();
    const plan: { day: number; meals: PlanMeal[]; totals: ReturnType<RecipesService['dayTotals']> }[] = [];

    for (let d = 1; d <= days; d++) {
      const meals: PlanMeal[] = [];
      for (const mt of MEALS) {
        const slot = target * MEAL_SPLIT[mt];
        const candidates = pool.filter((r) => r.mealTypes.includes(mt) && !meals.some((m) => m.recipeId === r.id));
        if (!candidates.length) continue;
        const best = candidates
          .map((r) => {
            const servings = Math.min(2, Math.max(0.5, Math.round((slot / (r.caloriesPerServing || 1)) * 2) / 2));
            const miss = Math.abs(r.caloriesPerServing * servings - slot) / slot;
            const lastUsed = used.get(r.id);
            const repeatPenalty = lastUsed === undefined ? 0 : lastUsed >= d - 1 ? 1 : 0.35;
            return { r, cost: miss + repeatPenalty + ((r.id * 7 + d * 13) % 10) / 100 };
          })
          .sort((a, b) => a.cost - b.cost)[0].r;
        used.set(best.id, d);
        meals.push(this.toMeal(best, mt, slot));
      }
      plan.push({ day: d, meals, totals: this.dayTotals(meals) });
    }
    return {
      targetCalories: target,
      excludeAllergens: opts.excludeAllergens || [],
      days: plan,
      weekAverageKcal: plan.length ? Math.round(plan.reduce((s, d) => s + d.totals.kcal, 0) / plan.length) : 0,
      note: 'Thực đơn tham khảo dựa trên mục tiêu calo, không thay thế tư vấn của chuyên gia dinh dưỡng.',
    };
  }

  /** Alternative recipe for one meal slot. */
  async swap(opts: { mealType: meal_type; targetKcal: number; excludeRecipeIds?: number[]; excludeAllergens?: string[] }) {
    const pool = (await this.list({ excludeAllergens: opts.excludeAllergens, mealType: opts.mealType })).filter((r) => !(opts.excludeRecipeIds || []).includes(r.id));
    if (!pool.length) throw new BadRequestException('Không còn món thay thế phù hợp cho bữa này');
    const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 4))];
    const sorted = pool.sort((a, b) => Math.abs(a.caloriesPerServing - opts.targetKcal) - Math.abs(b.caloriesPerServing - opts.targetKcal));
    const choice = Math.random() < 0.6 ? sorted[0] : pick;
    return this.toMeal(choice, opts.mealType, opts.targetKcal);
  }

  /** Converts the plan's recipes into shop products (packs needed for the whole plan). */
  async planCartItems(meals: { recipeId: number; servings: number }[]) {
    const recipes = await this.prisma.recipes.findMany({ where: { id: { in: meals.map((m) => BigInt(m.recipeId)) } }, include: recipeInclude });
    const need = new Map<number, { grams: number; packG: number; name: string }>();
    const missing = new Set<string>();
    for (const m of meals) {
      const r = recipes.find((x) => Number(x.id) === m.recipeId);
      if (!r) continue;
      for (const ing of r.recipe_ingredients) {
        if (!ing.variant_id || !ing.product_variants) {
          missing.add(ing.ingredient_name);
          continue;
        }
        const grams = (ing.unit === 'g' || ing.unit === 'ml' ? Number(ing.quantity ?? 0) : Number(ing.product_variants.net_weight_g) * 0.25) * (m.servings / r.servings);
        const cur = need.get(Number(ing.variant_id)) ?? { grams: 0, packG: Number(ing.product_variants.net_weight_g), name: ing.ingredient_name };
        cur.grams += grams;
        need.set(Number(ing.variant_id), cur);
      }
    }
    return {
      items: [...need.entries()].map(([variantId, v]) => ({ variantId, quantity: Math.max(1, Math.ceil(v.grams / v.packG)), name: v.name, gramsNeeded: Math.round(v.grams) })),
      notSold: [...missing].slice(0, 30),
    };
  }

  async savePlan(userId: number, body: { name?: string; targetCalories: number; days: { day: number; meals: { mealType: meal_type; recipeId: number; servings: number }[] }[] }) {
    const uid = BigInt(userId);
    const plan = await this.prisma.$transaction(async (tx) => {
      await tx.user_meal_plans.updateMany({ where: { user_id: uid, is_active: true }, data: { is_active: false } });
      const mp = await tx.meal_plans.create({
        data: {
          owner_user_id: uid,
          name: body.name || `Thực đơn ${body.targetCalories} kcal`,
          duration_days: body.days.length,
          target_calories: body.targetCalories,
          is_template: false,
          is_published: false,
          meal_plan_items: {
            create: body.days.flatMap((d) => d.meals.map((m) => ({ day_number: d.day, meal_type: m.mealType, recipe_id: BigInt(m.recipeId), quantity: m.servings }))),
          },
        },
      });
      await tx.user_meal_plans.create({ data: { user_id: uid, meal_plan_id: mp.id } });
      return mp;
    });
    return { id: Number(plan.id), message: 'Đã lưu thực đơn của bạn' };
  }

  async myPlan(userId: number) {
    const ump = await this.prisma.user_meal_plans.findFirst({
      where: { user_id: BigInt(userId), is_active: true },
      orderBy: { created_at: 'desc' },
      include: { meal_plans: { include: { meal_plan_items: { include: { recipes: { include: recipeInclude } }, orderBy: [{ day_number: 'asc' }] } } } },
    });
    if (!ump) return null;
    const mp = ump.meal_plans;
    const days = [...new Set(mp.meal_plan_items.map((i) => i.day_number))].map((day) => {
      const meals = mp.meal_plan_items
        .filter((i) => i.day_number === day && i.recipes)
        .sort((a, b) => MEALS.indexOf(a.meal_type) - MEALS.indexOf(b.meal_type))
        .map((i) => {
          const card = this.card(i.recipes!);
          return this.toMeal(card, i.meal_type, card.caloriesPerServing * Number(i.quantity));
        });
      return { day, meals, totals: this.dayTotals(meals) };
    });
    return { id: Number(mp.id), name: mp.name, targetCalories: Number(mp.target_calories), startDate: ump.start_date, days };
  }
}
