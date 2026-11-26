import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsQueryDto, SortBy } from './dto/products-query.dto';
import { nutritionPer100g, productCardInclude, toProductCard, toVariant, PLACEHOLDER_IMG } from './product.mapper';
import { StockService } from './stock.service';
import { pageMeta } from '../../common/utils/serialize';

/** Natural-language "need" keywords → diet codes, so users can search "đồ ăn giàu đạm cho người tập gym". */
const NEED_KEYWORDS: { re: RegExp; diets: string[]; label: string }[] = [
  { re: /(giau dam|protein|tap gym|gym|tang co|the hinh)/, diets: ['high_protein'], label: 'Giàu đạm / Tập gym' },
  { re: /keto|low ?carb|it tinh bot/, diets: ['keto', 'low_carb'], label: 'Keto / Ít tinh bột' },
  { re: /(it calo|giam can|an kieng|low ?cal)/, diets: ['low_calorie', 'low_carb'], label: 'Ít calo / Giảm cân' },
  { re: /(an chay|thuan chay|vegan|chay)/, diets: ['vegan', 'vegetarian'], label: 'Thuần chay' },
  { re: /(khong duong|tieu duong|duong huyet|sugar)/, diets: ['sugar_free', 'diabetic_friendly'], label: 'Không đường / Ổn định đường huyết' },
  { re: /(eat ?clean|an sach|healthy)/, diets: ['eat_clean'], label: 'Eat Clean' },
  { re: /(gluten)/, diets: ['gluten_free'], label: 'Không gluten' },
];

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

const ORDER_SQL: Record<SortBy, Prisma.Sql> = {
  [SortBy.NEWEST]: Prisma.sql`p.created_at DESC, p.id DESC`,
  [SortBy.PRICE_ASC]: Prisma.sql`dv.price ASC NULLS LAST, p.id`,
  [SortBy.PRICE_DESC]: Prisma.sql`dv.price DESC NULLS LAST, p.id`,
  [SortBy.BEST_SELLING]: Prisma.sql`p.sold_count DESC, p.id`,
  [SortBy.RATING]: Prisma.sql`p.avg_rating DESC, p.review_count DESC, p.id`,
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private stock: StockService,
  ) {}

  detectNeeds(q: string) {
    const nq = normalize(q);
    return NEED_KEYWORDS.filter((k) => k.re.test(nq));
  }

  private async textSearchIds(q: string): Promise<bigint[]> {
    const rows = await this.prisma.$queryRaw<{ id: bigint }[]>`
      SELECT p.id FROM products p
      WHERE p.status = 'active' AND p.deleted_at IS NULL AND (
        p.search_vector @@ plainto_tsquery('simple', f_unaccent(${q}))
        OR f_unaccent(lower(p.name)) LIKE '%' || f_unaccent(lower(${q})) || '%'
        OR EXISTS (SELECT 1 FROM categories c WHERE c.id = p.category_id AND f_unaccent(lower(c.name)) LIKE '%' || f_unaccent(lower(${q})) || '%')
      )`;
    return rows.map((r) => r.id);
  }

  private async categoryIdsWithChildren(slug: string): Promise<bigint[]> {
    const rows = await this.prisma.$queryRaw<{ id: bigint }[]>`
      WITH RECURSIVE tree AS (
        SELECT id FROM categories WHERE slug = ${slug}
        UNION ALL SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
      ) SELECT id FROM tree`;
    return rows.map((r) => r.id);
  }

  async findAll(query: ProductsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const where: Prisma.productsWhereInput = { status: 'active', deleted_at: null };
    const and: Prisma.productsWhereInput[] = [];
    let needs: ReturnType<ProductsService['detectNeeds']> = [];

    if (query.q?.trim()) {
      const q = query.q.trim();
      needs = this.detectNeeds(q);
      const ids = await this.textSearchIds(q);
      const or: Prisma.productsWhereInput[] = [{ id: { in: ids } }];
      if (needs.length) or.push({ product_diets: { some: { diets: { code: { in: needs.flatMap((n) => n.diets) } } } } });
      and.push({ OR: or });
    }
    if (query.category) {
      const catIds = await this.categoryIdsWithChildren(query.category);
      and.push({ category_id: { in: catIds } });
    }
    if (query.diets?.length) {
      for (const code of query.diets) and.push({ product_diets: { some: { diets: { code } } } });
    }
    if (query.excludeAllergens?.length) {
      and.push({ product_allergens: { none: { allergens: { code: { in: query.excludeAllergens } } } } });
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      and.push({ product_variants: { some: { is_active: true, price: { gte: query.minPrice, lte: query.maxPrice } } } });
    }
    if (query.minRating) and.push({ avg_rating: { gte: query.minRating } });
    if (query.nutriScore?.length) and.push({ nutri_score_grade: { in: query.nutriScore.map((g) => g.toUpperCase()) } });
    if (query.featured) and.push({ is_featured: true });
    if (query.onSale) and.push({ product_variants: { some: { is_active: true, compare_at_price: { not: null } } } });
    if (and.length) where.AND = and;

    const matched = await this.prisma.products.findMany({
      where,
      select: { id: true, product_variants: { where: { is_active: true }, select: { id: true } } },
    });
    let ids = matched.map((m) => m.id);
    if (query.inStock) {
      const stock = await this.stock.availableByVariant(matched.flatMap((m) => m.product_variants.map((v) => v.id)));
      ids = matched.filter((m) => m.product_variants.some((v) => (stock.get(Number(v.id)) ?? 0) > 0)).map((m) => m.id);
    }

    const total = ids.length;
    const pageIds = total
      ? (
          await this.prisma.$queryRaw<{ id: bigint }[]>`
            SELECT p.id FROM products p
            LEFT JOIN LATERAL (
              SELECT v.price FROM product_variants v WHERE v.product_id = p.id AND v.is_active
              ORDER BY v.is_default DESC, v.price LIMIT 1) dv ON true
            WHERE p.id = ANY(${ids}::bigint[])
            ORDER BY ${ORDER_SQL[query.sort || SortBy.NEWEST]}
            LIMIT ${limit} OFFSET ${(page - 1) * limit}`
        ).map((r) => r.id)
      : [];

    const data = await this.cardsByIds(pageIds);
    return {
      data,
      meta: pageMeta(page, limit, total),
      detectedNeeds: needs.map((n) => ({ label: n.label, diets: n.diets })),
    };
  }

  /** Product cards in the same order as `ids`, with live stock. */
  async cardsByIds(ids: (bigint | number)[], { onlyActive = true } = {}) {
    if (!ids.length) return [];
    const big = ids.map((i) => BigInt(i));
    const rows = await this.prisma.products.findMany({
      where: { id: { in: big }, ...(onlyActive ? { status: 'active', deleted_at: null } : {}) },
      include: productCardInclude,
    });
    const stock = await this.stock.availableByVariant(rows.flatMap((r) => r.product_variants.map((v) => v.id)));
    const byId = new Map(rows.map((r) => [Number(r.id), toProductCard(r, stock)]));
    return big.map((id) => byId.get(Number(id))).filter((x): x is NonNullable<typeof x> => !!x);
  }

  async collections(limit = 8) {
    const base = { status: 'active' as const, deleted_at: null };
    const pick = async (orderBy: Prisma.productsOrderByWithRelationInput, extra: Prisma.productsWhereInput = {}) =>
      this.cardsByIds((await this.prisma.products.findMany({ where: { ...base, ...extra }, orderBy, take: limit, select: { id: true } })).map((r) => r.id));
    const [featured, bestSellers, newest] = await Promise.all([
      pick({ sold_count: 'desc' }, { is_featured: true }),
      pick({ sold_count: 'desc' }),
      pick({ created_at: 'desc' }),
    ]);
    return { featured, bestSellers, newest };
  }

  async suggest(q: string) {
    const term = (q || '').trim();
    if (term.length < 1) return { products: [], categories: [], needs: [] };
    const ids = (await this.textSearchIds(term)).slice(0, 6);
    const [cards, categories] = await Promise.all([
      this.cardsByIds(ids),
      this.prisma.$queryRaw<{ name: string; slug: string }[]>`
        SELECT name, slug FROM categories WHERE is_active AND f_unaccent(lower(name)) LIKE '%' || f_unaccent(lower(${term})) || '%' LIMIT 4`,
    ]);
    return {
      products: cards.map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image, price: c.defaultVariant?.price ?? null, category: c.category.name })),
      categories,
      needs: this.detectNeeds(term).map((n) => ({ label: n.label, diets: n.diets })),
    };
  }

  async logSearch(q: string, resultCount: number, userId?: number) {
    const term = q.trim().slice(0, 300);
    if (!term) return;
    await this.prisma.search_logs.create({ data: { query: term, result_count: resultCount, user_id: userId ? BigInt(userId) : null } });
  }

  async popularSearches() {
    const rows = await this.prisma.$queryRaw<{ query: string }[]>`
      SELECT lower(query) AS query FROM search_logs WHERE created_at > now() - interval '60 days' AND result_count > 0
      GROUP BY lower(query) ORDER BY count(*) DESC LIMIT 8`;
    return rows.map((r) => r.query);
  }

  async findBySlug(slug: string, userId?: number) {
    const product = await this.prisma.products.findUnique({
      where: { slug },
      include: {
        ...productCardInclude,
        product_images: { orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }] },
        brands: true,
        farms: true,
        product_ingredients: { include: { ingredients: true }, orderBy: { sort_order: 'asc' } },
        product_certifications: { include: { certifications: true } },
        product_substitutes_product_substitutes_product_idToproducts: { orderBy: { priority: 'asc' }, select: { substitute_id: true, reason: true } },
      },
    });
    if (!product || product.deleted_at || product.status !== 'active') throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');

    const variantIds = product.product_variants.map((v) => v.id);
    const [stock, expiry, ratingDist, wish] = await Promise.all([
      this.stock.availableByVariant(variantIds),
      this.stock.nearestExpiry(variantIds),
      this.prisma.reviews.groupBy({ by: ['rating'], where: { product_id: product.id, status: 'approved' }, _count: true }),
      userId ? this.prisma.wishlists.findUnique({ where: { user_id_product_id: { user_id: BigInt(userId), product_id: product.id } } }) : null,
      this.prisma.products.update({ where: { id: product.id }, data: { view_count: { increment: 1 } } }),
      this.prisma.product_views.create({ data: { product_id: product.id, user_id: userId ? BigInt(userId) : null } }),
    ]);

    const subs = await this.cardsByIds(product.product_substitutes_product_substitutes_product_idToproducts.map((s) => s.substitute_id));
    const card = toProductCard(product, stock);

    return {
      ...card,
      description: product.description,
      originCountry: product.origin_country,
      storageInstruction: product.storage_instruction,
      usageInstruction: product.usage_instruction,
      shelfLifeDays: product.shelf_life_days,
      nutriScorePoints: product.nutri_score_points,
      metaTitle: product.meta_title,
      metaDescription: product.meta_description,
      images: product.product_images.map((i) => ({ id: Number(i.id), url: i.url, altText: i.alt_text })),
      variants: product.product_variants.map((v) => ({
        ...toVariant(v, stock.get(Number(v.id))),
        nearestExpiry: expiry.get(Number(v.id)) ?? null,
      })),
      nutritionFacts: nutritionPer100g(product.nutrition_facts),
      ingredients: product.product_ingredients.map((pi) => ({ name: pi.ingredients.name, percentage: pi.percentage ? Number(pi.percentage) : null })),
      certifications: product.product_certifications.map((pc) => ({
        code: pc.certifications.code,
        name: pc.certifications.name,
        issuer: pc.certifications.issuer,
        certificateNumber: pc.certificate_number,
      })),
      brand: product.brands ? { name: product.brands.name, country: product.brands.country } : null,
      farm: product.farms ? { name: product.farms.name, province: product.farms.province, description: product.farms.description } : null,
      ratingDistribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: ratingDist.find((r) => r.rating === star)?._count ?? 0 })),
      isWishlisted: !!wish,
      healthierAlternatives: subs.map((s) => ({ ...s, reason: product.product_substitutes_product_substitutes_product_idToproducts.find((x) => Number(x.substitute_id) === s.id)?.reason })),
    };
  }

  async related(productId: number, limit = 8) {
    const p = await this.prisma.products.findUnique({ where: { id: BigInt(productId) }, include: { product_diets: true } });
    if (!p) return [];
    const ids = await this.prisma.products.findMany({
      where: {
        id: { not: p.id },
        status: 'active',
        deleted_at: null,
        OR: [{ category_id: p.category_id }, { product_diets: { some: { diet_id: { in: p.product_diets.map((d) => d.diet_id) } } } }],
      },
      orderBy: [{ sold_count: 'desc' }],
      take: limit,
      select: { id: true },
    });
    return this.cardsByIds(ids.map((i) => i.id));
  }

  /** "Thường mua cùng": co-purchase statistics from real orders, topped up with same-category best sellers. */
  async frequentlyBoughtTogether(productId: number, limit = 3) {
    const pid = BigInt(productId);
    const rows = await this.prisma.$queryRaw<{ pid: bigint }[]>`
      SELECT b.product_id AS pid FROM order_items a
      JOIN order_items b ON b.order_id = a.order_id AND b.product_id IS NOT NULL AND b.product_id <> a.product_id
      JOIN orders o ON o.id = a.order_id AND o.status <> 'cancelled'
      WHERE a.product_id = ${pid}
      GROUP BY b.product_id ORDER BY count(*) DESC LIMIT ${limit}`;
    let ids = rows.map((r) => r.pid);
    if (ids.length < limit) {
      const more = await this.prisma.products.findMany({
        where: { id: { notIn: [pid, ...ids] }, status: 'active', deleted_at: null },
        orderBy: { sold_count: 'desc' },
        take: limit - ids.length,
        select: { id: true },
      });
      ids = [...ids, ...more.map((m) => m.id)];
    }
    return this.cardsByIds(ids);
  }

  async compare(ids: number[]) {
    const cards = await this.cardsByIds(ids.slice(0, 3));
    const extra = await this.prisma.products.findMany({
      where: { id: { in: cards.map((c) => BigInt(c.id)) } },
      include: { product_ingredients: { include: { ingredients: true }, orderBy: { sort_order: 'asc' } } },
    });
    return cards.map((c) => ({
      ...c,
      ingredients: extra.find((e) => Number(e.id) === c.id)?.product_ingredients.map((pi) => pi.ingredients.name) ?? [],
    }));
  }

  async traceability(qrCode: string) {
    const batch = await this.prisma.product_batches.findUnique({
      where: { qr_code: qrCode },
      include: { product_variants: { include: { products: { include: { product_images: { take: 1 } } } } }, farms: true, suppliers: true },
    });
    if (!batch) throw new NotFoundException('Không tìm thấy lô hàng với mã QR này');
    const p = batch.product_variants.products;
    return {
      batchCode: batch.batch_code,
      product: { name: p.name, slug: p.slug, variant: batch.product_variants.name, image: p.product_images[0]?.url || PLACEHOLDER_IMG },
      farm: batch.farms ? { name: batch.farms.name, province: batch.farms.province, address: batch.farms.address, description: batch.farms.description } : null,
      supplier: batch.suppliers?.name ?? null,
      harvestedOn: batch.harvested_on,
      manufacturedOn: batch.manufactured_on,
      expiresOn: batch.expires_on,
      labResult: batch.lab_result_note,
    };
  }
}
