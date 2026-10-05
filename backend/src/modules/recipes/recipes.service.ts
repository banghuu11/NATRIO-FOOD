import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async findAllRecipes() {
    const recipes = await this.prisma.recipes.findMany({
      where: { is_published: true },
      orderBy: { created_at: 'desc' },
      include: {
        recipe_diets: {
          include: { diets: true },
        },
      },
    });

    return recipes.map((r) => ({
      id: Number(r.id),
      title: r.title,
      slug: r.slug,
      description: r.description,
      imageUrl: r.image_url || 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800',
      prepMinutes: r.prep_minutes,
      cookMinutes: r.cook_minutes,
      servings: r.servings,
      difficulty: r.difficulty,
      caloriesPerServing: r.calories_per_serving ? Number(r.calories_per_serving) : null,
      proteinG: r.protein_g ? Number(r.protein_g) : null,
      carbG: r.carbohydrate_g ? Number(r.carbohydrate_g) : null,
      fatG: r.fat_g ? Number(r.fat_g) : null,
      diets: r.recipe_diets.map((rd) => rd.diets.name_vi),
    }));
  }

  async findRecipeBySlug(slug: string) {
    const recipe = await this.prisma.recipes.findUnique({
      where: { slug },
      include: {
        recipe_ingredients: {
          orderBy: { sort_order: 'asc' },
          include: {
            products: {
              include: {
                product_variants: {
                  where: { is_active: true, is_default: true },
                },
                product_images: true,
              },
            },
          },
        },
        recipe_steps: {
          orderBy: { step_number: 'asc' },
        },
        recipe_diets: {
          include: { diets: true },
        },
      },
    });

    if (!recipe || !recipe.is_published) {
      throw new NotFoundException(`Không tìm thấy công thức món ăn: ${slug}`);
    }

    return {
      id: Number(recipe.id),
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      imageUrl: recipe.image_url || 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800',
      videoUrl: recipe.video_url,
      prepMinutes: recipe.prep_minutes,
      cookMinutes: recipe.cook_minutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      macros: {
        caloriesPerServing: recipe.calories_per_serving ? Number(recipe.calories_per_serving) : null,
        proteinG: recipe.protein_g ? Number(recipe.protein_g) : null,
        carbG: recipe.carbohydrate_g ? Number(recipe.carbohydrate_g) : null,
        fatG: recipe.fat_g ? Number(recipe.fat_g) : null,
      },
      ingredients: recipe.recipe_ingredients.map((ri) => ({
        name: ri.ingredient_name,
        quantity: ri.quantity ? Number(ri.quantity) : null,
        unit: ri.unit,
        note: ri.note,
        shopTheProduct: ri.products
          ? {
              productId: Number(ri.products.id),
              name: ri.products.name,
              slug: ri.products.slug,
              variantId: ri.products.product_variants[0] ? Number(ri.products.product_variants[0].id) : null,
              price: ri.products.product_variants[0] ? Number(ri.products.product_variants[0].price) : null,
              image: ri.products.product_images[0]?.url || null,
            }
          : null,
      })),
      steps: recipe.recipe_steps.map((st) => ({
        stepNumber: st.step_number,
        instruction: st.instruction,
        imageUrl: st.image_url,
      })),
      diets: recipe.recipe_diets.map((rd) => rd.diets.name_vi),
    };
  }

  async findAllMealPlans() {
    const plans = await this.prisma.meal_plans.findMany({
      where: { is_published: true },
      include: {
        meal_plan_items: {
          include: {
            recipes: true,
            products: true,
          },
        },
      },
    });

    return plans.map((p) => ({
      id: Number(p.id),
      name: p.name,
      slug: p.slug,
      description: p.description,
      goal: p.goal,
      durationDays: p.duration_days,
      targetCalories: p.target_calories ? Number(p.target_calories) : null,
      imageUrl: p.image_url,
      itemCount: p.meal_plan_items.length,
    }));
  }

  async findMealPlanBySlug(slug: string) {
    const plan = await this.prisma.meal_plans.findUnique({
      where: { slug },
      include: {
        meal_plan_items: {
          orderBy: [{ day_number: 'asc' }, { meal_type: 'asc' }],
          include: {
            recipes: true,
            products: {
              include: {
                product_variants: { where: { is_default: true } },
              },
            },
          },
        },
      },
    });

    if (!plan || !plan.is_published) {
      throw new NotFoundException(`Không tìm thấy thực đơn: ${slug}`);
    }

    return {
      id: Number(plan.id),
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      goal: plan.goal,
      durationDays: plan.duration_days,
      targetCalories: plan.target_calories ? Number(plan.target_calories) : null,
      days: plan.meal_plan_items.reduce((acc: any, item) => {
        const day = item.day_number;
        if (!acc[day]) acc[day] = [];
        acc[day].push({
          mealType: item.meal_type,
          recipe: item.recipes ? { id: Number(item.recipes.id), title: item.recipes.title, slug: item.recipes.slug } : null,
          product: item.products ? { id: Number(item.products.id), name: item.products.name, slug: item.products.slug } : null,
          note: item.note,
        });
        return acc;
      }, {}),
    };
  }
}
