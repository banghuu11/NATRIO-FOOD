import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../products/stock.service';
import { NotificationsService } from '../../core/notifications.service';
import { pageMeta, slugify } from '../../common/utils/serialize';
import { CategoryInput, ProductInput } from './dto/admin-catalog.dto';
import { PLACEHOLDER_IMG } from '../products/product.mapper';

@Injectable()
export class AdminCatalogService {
  constructor(
    private prisma: PrismaService,
    private stock: StockService,
    private notifications: NotificationsService,
  ) {}

  private async actor(tx: Prisma.TransactionClient, userId: number) {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(userId)}, true)`;
  }

  async list(q: { q?: string; categoryId?: number; status?: string; page?: number; limit?: number; stock?: string }) {
    const page = q.page || 1;
    const limit = Math.min(q.limit || 20, 100);
    const where: Prisma.productsWhereInput = { deleted_at: null };
    if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { product_variants: { some: { sku: { contains: q.q, mode: 'insensitive' } } } }];
    if (q.categoryId) where.category_id = BigInt(q.categoryId);
    if (q.status) where.status = q.status as any;
    const [rows, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { categories: true, product_variants: { orderBy: [{ is_default: 'desc' }, { price: 'asc' }] }, product_images: { take: 1, orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }] } },
      }),
      this.prisma.products.count({ where }),
    ]);
    const stock = await this.stock.availableByVariant(rows.flatMap((r) => r.product_variants.map((v) => v.id)));
    return {
      data: rows.map((p) => {
        const totalStock = p.product_variants.reduce((s, v) => s + (stock.get(Number(v.id)) ?? 0), 0);
        const dv = p.product_variants[0];
        return {
          id: Number(p.id),
          name: p.name,
          slug: p.slug,
          image: p.product_images[0]?.url || PLACEHOLDER_IMG,
          category: p.categories.name,
          status: p.status,
          isFeatured: p.is_featured,
          nutriScoreGrade: p.nutri_score_grade,
          price: dv ? Number(dv.price) : null,
          compareAtPrice: dv?.compare_at_price ? Number(dv.compare_at_price) : null,
          variantCount: p.product_variants.length,
          stock: totalStock,
          lowStock: p.product_variants.some((v) => (stock.get(Number(v.id)) ?? 0) <= v.reorder_level),
          soldCount: p.sold_count,
          avgRating: Number(p.avg_rating),
          updatedAt: p.updated_at,
        };
      }),
      meta: pageMeta(page, limit, total),
    };
  }

  async get(id: number) {
    const p = await this.prisma.products.findUnique({
      where: { id: BigInt(id) },
      include: {
        product_variants: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] },
        product_images: { orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }] },
        nutrition_facts: true,
        product_allergens: { include: { allergens: true } },
        product_diets: { include: { diets: true } },
        product_certifications: { include: { certifications: true } },
        product_ingredients: { include: { ingredients: true }, orderBy: { sort_order: 'asc' } },
      },
    });
    if (!p || p.deleted_at) throw new NotFoundException('Không tìm thấy sản phẩm');
    const stock = await this.stock.availableByVariant(p.product_variants.map((v) => v.id));
    const nf = p.nutrition_facts;
    return {
      id: Number(p.id),
      name: p.name,
      slug: p.slug,
      categoryId: Number(p.category_id),
      brandId: p.brand_id ? Number(p.brand_id) : null,
      farmId: p.farm_id ? Number(p.farm_id) : null,
      supplierId: p.supplier_id ? Number(p.supplier_id) : null,
      shortDescription: p.short_description,
      description: p.description,
      originCountry: p.origin_country,
      storageInstruction: p.storage_instruction,
      usageInstruction: p.usage_instruction,
      shelfLifeDays: p.shelf_life_days,
      status: p.status,
      isFeatured: p.is_featured,
      nutriScoreGrade: p.nutri_score_grade,
      metaTitle: p.meta_title,
      metaDescription: p.meta_description,
      variants: p.product_variants.map((v) => ({
        id: Number(v.id), sku: v.sku, name: v.name, netWeightG: Number(v.net_weight_g), price: Number(v.price),
        compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null, costPrice: v.cost_price ? Number(v.cost_price) : null,
        reorderLevel: v.reorder_level, isDefault: v.is_default, isActive: v.is_active, unitLabel: v.unit_label, stock: stock.get(Number(v.id)) ?? 0,
      })),
      images: p.product_images.map((i) => ({ url: i.url, altText: i.alt_text })),
      nutrition: nf
        ? { servingSizeG: nf.serving_size_g ? Number(nf.serving_size_g) : null, caloriesKcal: Number(nf.calories_kcal), proteinG: Number(nf.protein_g), carbG: Number(nf.carbohydrate_g), fatG: Number(nf.fat_g), sugarG: Number(nf.sugar_g), fiberG: Number(nf.fiber_g), saturatedFatG: Number(nf.saturated_fat_g), sodiumMg: Number(nf.sodium_mg) }
        : null,
      allergens: p.product_allergens.map((a) => ({ code: a.allergens.code, relation: a.relation })),
      diets: p.product_diets.map((d) => d.diets.code),
      certifications: p.product_certifications.map((c) => c.certifications.code),
      ingredients: p.product_ingredients.map((i) => ({ name: i.ingredients.name, percentage: i.percentage ? Number(i.percentage) : null })),
    };
  }

  /** Lightweight list of sellable variants for pickers (combos, flash sales, recipes). */
  async variantOptions() {
    const rows = await this.prisma.product_variants.findMany({
      where: { is_active: true, products: { deleted_at: null } },
      include: { products: { select: { name: true } } },
      orderBy: [{ products: { name: 'asc' } }, { net_weight_g: 'asc' }],
    });
    return rows.map((v) => ({ id: Number(v.id), sku: v.sku, label: `${v.products.name} – ${v.name}`, price: Number(v.price) }));
  }

  async meta() {
    const [categories, brands, farms, suppliers, diets, allergens, certifications, warehouses] = await Promise.all([
      this.prisma.categories.findMany({ orderBy: [{ sort_order: 'asc' }, { name: 'asc' }] }),
      this.prisma.brands.findMany({ where: { is_active: true } }),
      this.prisma.farms.findMany(),
      this.prisma.suppliers.findMany({ where: { is_active: true } }),
      this.prisma.diets.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.allergens.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.certifications.findMany(),
      this.prisma.warehouses.findMany({ where: { is_active: true } }),
    ]);
    return {
      categories: categories.map((c) => ({ id: Number(c.id), name: c.name, parentId: c.parent_id ? Number(c.parent_id) : null, isActive: c.is_active })),
      brands: brands.map((b) => ({ id: Number(b.id), name: b.name })),
      farms: farms.map((f) => ({ id: Number(f.id), name: f.name, province: f.province })),
      suppliers: suppliers.map((s) => ({ id: Number(s.id), name: s.name })),
      diets: diets.map((d) => ({ code: d.code, name: d.name_vi })),
      allergens: allergens.map((a) => ({ code: a.code, name: a.name_vi })),
      certifications: certifications.map((c) => ({ code: c.code, name: c.name })),
      warehouses: warehouses.map((w) => ({ id: Number(w.id), code: w.code, name: w.name })),
    };
  }

  private validate(dto: ProductInput) {
    if (!dto.variants.length) throw new BadRequestException('Sản phẩm cần ít nhất một biến thể (quy cách đóng gói)');
    const skus = dto.variants.map((v) => v.sku.toUpperCase());
    if (new Set(skus).size !== skus.length) throw new BadRequestException('Mã SKU bị trùng giữa các biến thể');
    for (const v of dto.variants) {
      if (v.compareAtPrice && v.compareAtPrice < v.price) throw new BadRequestException(`Giá gốc của "${v.name}" phải lớn hơn hoặc bằng giá bán`);
    }
    if (dto.status === 'active' && !dto.images?.length) throw new BadRequestException('Sản phẩm đang bán cần ít nhất một hình ảnh');
  }

  async save(dto: ProductInput, actorId: number, id?: number) {
    this.validate(dto);
    const slug = dto.slug || slugify(dto.name);
    const clash = await this.prisma.products.findFirst({ where: { slug, ...(id ? { id: { not: BigInt(id) } } : {}) } });
    if (clash) throw new ConflictException('Slug đã được sử dụng cho sản phẩm khác');
    const old = id ? await this.prisma.products.findUnique({ where: { id: BigInt(id) }, include: { product_variants: true } }) : null;
    if (id && (!old || old.deleted_at)) throw new NotFoundException('Không tìm thấy sản phẩm');

    const productId = await this.prisma.$transaction(
      async (tx) => {
        await this.actor(tx, actorId);
        const data = {
          name: dto.name,
          slug,
          category_id: BigInt(dto.categoryId),
          brand_id: dto.brandId ? BigInt(dto.brandId) : null,
          farm_id: dto.farmId ? BigInt(dto.farmId) : null,
          supplier_id: dto.supplierId ? BigInt(dto.supplierId) : null,
          short_description: dto.shortDescription || null,
          description: dto.description || null,
          origin_country: dto.originCountry || 'Việt Nam',
          storage_instruction: dto.storageInstruction || null,
          usage_instruction: dto.usageInstruction || null,
          shelf_life_days: dto.shelfLifeDays || null,
          status: dto.status,
          is_featured: !!dto.isFeatured,
          meta_title: dto.metaTitle || null,
          meta_description: dto.metaDescription || null,
        };
        const p = id ? await tx.products.update({ where: { id: BigInt(id) }, data }) : await tx.products.create({ data });

        // Variants: update existing, create new, deactivate removed ones (they may be referenced by orders)
        const defaultIdx = Math.max(0, dto.variants.findIndex((v) => v.isDefault));
        const keepIds: bigint[] = [];
        for (const [i, v] of dto.variants.entries()) {
          const vdata = {
            sku: v.sku.toUpperCase(),
            name: v.name,
            net_weight_g: v.netWeightG,
            price: Math.round(v.price),
            compare_at_price: v.compareAtPrice ? Math.round(v.compareAtPrice) : null,
            cost_price: v.costPrice ? Math.round(v.costPrice) : null,
            reorder_level: v.reorderLevel ?? 10,
            is_default: i === defaultIdx,
            is_active: v.isActive ?? true,
            unit_label: v.unitLabel || 'gói',
          };
          const skuOwner = await tx.product_variants.findUnique({ where: { sku: vdata.sku } });
          if (skuOwner && Number(skuOwner.id) !== v.id) throw new ConflictException(`SKU ${vdata.sku} đã tồn tại`);
          if (v.id && old?.product_variants.some((ov) => Number(ov.id) === v.id)) {
            await tx.product_variants.update({ where: { id: BigInt(v.id) }, data: vdata });
            keepIds.push(BigInt(v.id));
          } else {
            const created = await tx.product_variants.create({ data: { ...vdata, product_id: p.id } });
            keepIds.push(created.id);
          }
        }
        await tx.product_variants.updateMany({ where: { product_id: p.id, id: { notIn: keepIds } }, data: { is_active: false, is_default: false } });

        if (dto.images) {
          await tx.product_images.deleteMany({ where: { product_id: p.id } });
          if (dto.images.length) {
            await tx.product_images.createMany({ data: dto.images.map((img, i) => ({ product_id: p.id, url: img.url, alt_text: img.altText || dto.name, sort_order: i, is_primary: i === 0 })) });
          }
        }
        if (dto.nutrition) {
          const n = dto.nutrition;
          const nd = {
            serving_size_g: n.servingSizeG ?? null, calories_kcal: n.caloriesKcal, protein_g: n.proteinG, carbohydrate_g: n.carbG, fat_g: n.fatG,
            sugar_g: n.sugarG ?? 0, fiber_g: n.fiberG ?? 0, saturated_fat_g: n.saturatedFatG ?? 0, sodium_mg: n.sodiumMg ?? 0,
          };
          // Nutri-Score is recalculated by the DB trigger from these values
          await tx.nutrition_facts.upsert({ where: { product_id: p.id }, update: nd, create: { ...nd, product_id: p.id } });
        }
        if (dto.allergens) {
          await tx.product_allergens.deleteMany({ where: { product_id: p.id } });
          const rows = await tx.allergens.findMany({ where: { code: { in: dto.allergens.map((a) => a.code) } } });
          if (rows.length) await tx.product_allergens.createMany({ data: rows.map((a) => ({ product_id: p.id, allergen_id: a.id, relation: dto.allergens!.find((x) => x.code === a.code)!.relation })) });
        }
        if (dto.diets) {
          await tx.product_diets.deleteMany({ where: { product_id: p.id } });
          const rows = await tx.diets.findMany({ where: { code: { in: dto.diets } } });
          if (rows.length) await tx.product_diets.createMany({ data: rows.map((d) => ({ product_id: p.id, diet_id: d.id })) });
        }
        if (dto.certifications) {
          await tx.product_certifications.deleteMany({ where: { product_id: p.id } });
          const rows = await tx.certifications.findMany({ where: { code: { in: dto.certifications } } });
          if (rows.length) await tx.product_certifications.createMany({ data: rows.map((c) => ({ product_id: p.id, certification_id: c.id })) });
        }
        if (dto.ingredients) {
          await tx.product_ingredients.deleteMany({ where: { product_id: p.id } });
          for (const [i, ing] of dto.ingredients.entries()) {
            const row = await tx.ingredients.upsert({ where: { name: ing.name }, update: {}, create: { name: ing.name } });
            await tx.product_ingredients.create({ data: { product_id: p.id, ingredient_id: row.id, percentage: ing.percentage ?? null, sort_order: i } });
          }
        }
        return p.id;
      },
      { timeout: 30000 },
    );

    if (old) await this.notifyPriceDrops(productId, old.product_variants);
    return this.get(Number(productId));
  }

  /** Notifies customers who wishlisted the product when its default price goes down. */
  private async notifyPriceDrops(productId: bigint, before: { id: bigint; price: Prisma.Decimal; is_default: boolean }[]) {
    const p = await this.prisma.products.findUnique({ where: { id: productId }, include: { product_variants: { where: { is_default: true } } } });
    const dv = p?.product_variants[0];
    if (!p || !dv || p.status !== 'active') return;
    const prev = before.find((b) => b.id === dv.id);
    if (!prev || Number(dv.price) >= Number(prev.price)) return;
    const alerts = await this.prisma.product_alerts.findMany({ where: { product_id: productId, alert_type: 'price_drop', is_active: true } });
    for (const a of alerts) {
      if (a.target_price && Number(dv.price) >= Number(a.target_price)) continue;
      await this.notifications.create(a.user_id, 'price_drop', `${p.name} vừa giảm giá!`, `Giá mới ${Number(dv.price).toLocaleString('vi-VN')}đ (trước đó ${Number(prev.price).toLocaleString('vi-VN')}đ).`, { productSlug: p.slug });
      await this.prisma.product_alerts.update({ where: { id: a.id }, data: { notified_at: new Date(), target_price: dv.price } });
    }
  }

  async setStatus(id: number, status: 'active' | 'inactive', actorId: number) {
    const p = await this.prisma.products.findUnique({ where: { id: BigInt(id) }, include: { product_images: true } });
    if (!p || p.deleted_at) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (status === 'active' && !p.product_images.length) throw new BadRequestException('Cần thêm hình ảnh trước khi hiển thị sản phẩm');
    await this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actorId);
      await tx.products.update({ where: { id: p.id }, data: { status } });
    });
    return { message: status === 'active' ? 'Đã hiển thị sản phẩm' : 'Đã ẩn sản phẩm' };
  }

  /** Soft delete – keeps order history intact. */
  async remove(id: number, actorId: number) {
    const p = await this.prisma.products.findUnique({ where: { id: BigInt(id) } });
    if (!p || p.deleted_at) throw new NotFoundException('Không tìm thấy sản phẩm');
    await this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actorId);
      await tx.products.update({ where: { id: p.id }, data: { deleted_at: new Date(), status: 'discontinued', slug: `${p.slug}-deleted-${Date.now()}` } });
      await tx.product_variants.updateMany({ where: { product_id: p.id }, data: { is_active: false } });
      await tx.cart_items.deleteMany({ where: { product_variants: { product_id: p.id } } });
    });
    return { message: 'Đã xóa sản phẩm' };
  }

  // ---------------- Categories ----------------
  async categories() {
    const rows = await this.prisma.categories.findMany({
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: { where: { deleted_at: null } }, other_categories: true } } },
    });
    return rows.map((c) => ({
      id: Number(c.id), parentId: c.parent_id ? Number(c.parent_id) : null, name: c.name, slug: c.slug, description: c.description,
      imageUrl: c.image_url, sortOrder: c.sort_order, isActive: c.is_active, productCount: c._count.products, childCount: c._count.other_categories,
    }));
  }

  async saveCategory(dto: CategoryInput, id?: number) {
    const slug = dto.slug || slugify(dto.name);
    if (await this.prisma.categories.findFirst({ where: { slug, ...(id ? { id: { not: BigInt(id) } } : {}) } })) throw new ConflictException('Slug danh mục đã tồn tại');
    if (id && dto.parentId === id) throw new BadRequestException('Danh mục không thể là cha của chính nó');
    if (id && dto.parentId) {
      // prevent cycles: parent must not be a descendant
      const rows = await this.prisma.$queryRaw<{ id: bigint }[]>`
        WITH RECURSIVE t AS (SELECT id FROM categories WHERE parent_id = ${BigInt(id)} UNION ALL SELECT c.id FROM categories c JOIN t ON c.parent_id = t.id) SELECT id FROM t`;
      if (rows.some((r) => Number(r.id) === dto.parentId)) throw new BadRequestException('Không thể chọn danh mục con làm danh mục cha');
    }
    const data = { name: dto.name, slug, parent_id: dto.parentId ? BigInt(dto.parentId) : null, description: dto.description ?? null, image_url: dto.imageUrl ?? null, sort_order: dto.sortOrder ?? 0, is_active: dto.isActive ?? true };
    const c = id ? await this.prisma.categories.update({ where: { id: BigInt(id) }, data }) : await this.prisma.categories.create({ data });
    return { id: Number(c.id), message: 'Đã lưu danh mục' };
  }

  async removeCategory(id: number) {
    const c = await this.prisma.categories.findUnique({ where: { id: BigInt(id) }, include: { _count: { select: { products: { where: { deleted_at: null } }, other_categories: true } } } });
    if (!c) throw new NotFoundException('Không tìm thấy danh mục');
    if (c._count.other_categories) throw new ConflictException('Danh mục còn danh mục con, vui lòng chuyển hoặc xóa danh mục con trước');
    if (c._count.products) throw new ConflictException(`Danh mục đang có ${c._count.products} sản phẩm, vui lòng chuyển sản phẩm sang danh mục khác trước`);
    await this.prisma.categories.delete({ where: { id: c.id } });
    return { message: 'Đã xóa danh mục' };
  }
}
