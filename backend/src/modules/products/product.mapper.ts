import { Prisma } from '@prisma/client';

/** Relations needed to render a product card anywhere in the app. */
export const productCardInclude = {
  categories: { select: { id: true, name: true, slug: true } },
  product_variants: { where: { is_active: true }, orderBy: [{ is_default: 'desc' }, { price: 'asc' }] },
  product_images: { orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }], take: 2 },
  nutrition_facts: true,
  product_diets: { include: { diets: true } },
  product_allergens: { include: { allergens: true } },
} satisfies Prisma.productsInclude;

export type ProductCardRow = Prisma.productsGetPayload<{ include: typeof productCardInclude }>;

export const PLACEHOLDER_IMG = '/images/placeholder-product.svg';

const n = (v: Prisma.Decimal | null | undefined) => (v === null || v === undefined ? 0 : Number(v));

export function nutritionPer100g(nf: ProductCardRow['nutrition_facts']) {
  if (!nf) return null;
  return {
    servingSizeG: nf.serving_size_g ? Number(nf.serving_size_g) : null,
    caloriesKcal: n(nf.calories_kcal),
    proteinG: n(nf.protein_g),
    carbG: n(nf.carbohydrate_g),
    fatG: n(nf.fat_g),
    sugarG: n(nf.sugar_g),
    fiberG: n(nf.fiber_g),
    saturatedFatG: n(nf.saturated_fat_g),
    sodiumMg: n(nf.sodium_mg),
  };
}

export function toVariant(v: ProductCardRow['product_variants'][number], stock?: number) {
  const price = Number(v.price);
  const compare = v.compare_at_price ? Number(v.compare_at_price) : null;
  return {
    id: Number(v.id),
    sku: v.sku,
    name: v.name,
    netWeightG: Number(v.net_weight_g),
    unitLabel: v.unit_label,
    price,
    compareAtPrice: compare,
    discountPercent: compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0,
    isDefault: v.is_default,
    availableStock: stock ?? null,
  };
}

export function toProductCard(p: ProductCardRow, stock?: Map<number, number>) {
  const variants = p.product_variants.map((v) => toVariant(v, stock?.get(Number(v.id))));
  const dv = variants[0] || null;
  return {
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    shortDescription: p.short_description,
    category: { id: Number(p.categories.id), name: p.categories.name, slug: p.categories.slug },
    nutriScoreGrade: p.nutri_score_grade,
    avgRating: Number(p.avg_rating),
    reviewCount: p.review_count,
    soldCount: p.sold_count,
    isFeatured: p.is_featured,
    createdAt: p.created_at,
    image: p.product_images[0]?.url || PLACEHOLDER_IMG,
    hoverImage: p.product_images[1]?.url || null,
    defaultVariant: dv,
    variantCount: variants.length,
    inStock: stock ? variants.some((v) => (v.availableStock ?? 0) > 0) : null,
    nutrition: nutritionPer100g(p.nutrition_facts),
    diets: p.product_diets.map((d) => ({ code: d.diets.code, name: d.diets.name_vi })),
    allergens: p.product_allergens.map((a) => ({ code: a.allergens.code, name: a.allergens.name_vi, relation: a.relation })),
  };
}

export type ProductCard = ReturnType<typeof toProductCard>;
