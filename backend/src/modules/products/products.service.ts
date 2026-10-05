import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsQueryDto, SortBy } from './dto/products-query.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'active',
      deleted_at: null,
    };

    if (query.categorySlug) {
      where.categories = { slug: query.categorySlug };
    }

    if (query.isFeatured !== undefined) {
      where.is_featured = query.isFeatured;
    }

    if (query.nutriScore) {
      where.nutri_score_grade = query.nutriScore.toUpperCase();
    }

    if (query.dietCode) {
      where.product_diets = {
        some: {
          diets: { code: query.dietCode },
        },
      };
    }

    if (query.excludeAllergen) {
      where.product_allergens = {
        none: {
          allergens: { code: query.excludeAllergen },
        },
      };
    }

    if (query.maxCalories) {
      where.nutrition_facts = {
        calories_kcal: { lte: query.maxCalories },
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { short_description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };
    if (query.sortBy === SortBy.RATING) {
      orderBy = { avg_rating: 'desc' };
    } else if (query.sortBy === SortBy.BEST_SELLING) {
      orderBy = { sold_count: 'desc' };
    }

    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          categories: true,
          brands: true,
          product_variants: {
            where: { is_active: true },
            orderBy: [{ is_default: 'desc' }, { price: 'asc' }],
          },
          product_images: {
            orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
          },
          nutrition_facts: true,
          product_diets: {
            include: { diets: true },
          },
          product_allergens: {
            include: { allergens: true },
          },
        },
      }),
      this.prisma.products.count({ where }),
    ]);

    const formatted = products.map((p) => {
      const defaultVariant = p.product_variants[0] || null;
      const primaryImage = p.product_images[0]?.url || 'https://placehold.co/600x600?text=Nutrio';

      return {
        id: Number(p.id),
        name: p.name,
        slug: p.slug,
        shortDescription: p.short_description,
        category: {
          id: Number(p.categories.id),
          name: p.categories.name,
          slug: p.categories.slug,
        },
        brand: p.brands ? { id: Number(p.brands.id), name: p.brands.name } : null,
        nutriScoreGrade: p.nutri_score_grade,
        nutriScorePoints: p.nutri_score_points,
        avgRating: Number(p.avg_rating),
        reviewCount: p.review_count,
        soldCount: p.sold_count,
        isFeatured: p.is_featured,
        primaryImage,
        defaultVariant: defaultVariant
          ? {
              id: Number(defaultVariant.id),
              sku: defaultVariant.sku,
              name: defaultVariant.name,
              price: Number(defaultVariant.price),
              compareAtPrice: defaultVariant.compare_at_price ? Number(defaultVariant.compare_at_price) : null,
              netWeightG: Number(defaultVariant.net_weight_g),
            }
          : null,
        nutrition: p.nutrition_facts
          ? {
              caloriesKcal: Number(p.nutrition_facts.calories_kcal),
              proteinG: Number(p.nutrition_facts.protein_g),
              carbG: Number(p.nutrition_facts.carbohydrate_g),
              fatG: Number(p.nutrition_facts.fat_g),
              sugarG: Number(p.nutrition_facts.sugar_g),
              fiberG: Number(p.nutrition_facts.fiber_g),
            }
          : null,
        diets: p.product_diets.map((pd) => ({
          code: pd.diets.code,
          name: pd.diets.name_vi,
          iconUrl: pd.diets.icon_url,
        })),
        allergens: p.product_allergens.map((pa) => ({
          code: pa.allergens.code,
          name: pa.allergens.name_vi,
          relation: pa.relation,
        })),
      };
    });

    return {
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.products.findUnique({
      where: { slug },
      include: {
        categories: true,
        brands: true,
        farms: true,
        suppliers: true,
        product_variants: {
          where: { is_active: true },
          orderBy: [{ is_default: 'desc' }, { price: 'asc' }],
          include: {
            product_batches: {
              where: {
                OR: [{ expires_on: null }, { expires_on: { gte: new Date() } }],
              },
              include: {
                inventory: true,
              },
            },
          },
        },
        product_images: {
          orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
        },
        nutrition_facts: true,
        product_ingredients: {
          include: { ingredients: true },
          orderBy: { sort_order: 'asc' },
        },
        product_diets: {
          include: { diets: true },
        },
        product_allergens: {
          include: { allergens: true },
        },
        product_certifications: {
          include: { certifications: true },
        },
        product_substitutes_product_substitutes_product_idToproducts: {
          include: {
            products_product_substitutes_substitute_idToproducts: {
              include: {
                product_variants: true,
                product_images: true,
              },
            },
          },
        },
      },
    });

    if (!product || product.deleted_at || product.status !== 'active') {
      throw new NotFoundException(`Không tìm thấy sản phẩm: ${slug}`);
    }

    // Tăng lượt xem
    await this.prisma.products.update({
      where: { id: product.id },
      data: { view_count: { increment: 1 } },
    });

    return {
      id: Number(product.id),
      name: product.name,
      slug: product.slug,
      shortDescription: product.short_description,
      description: product.description,
      originCountry: product.origin_country,
      storageInstruction: product.storage_instruction,
      usageInstruction: product.usage_instruction,
      shelfLifeDays: product.shelf_life_days,
      nutriScoreGrade: product.nutri_score_grade,
      nutriScorePoints: product.nutri_score_points,
      avgRating: Number(product.avg_rating),
      reviewCount: product.review_count,
      soldCount: product.sold_count,
      viewCount: product.view_count + 1,
      category: {
        id: Number(product.categories.id),
        name: product.categories.name,
        slug: product.categories.slug,
      },
      brand: product.brands ? { id: Number(product.brands.id), name: product.brands.name, country: product.brands.country } : null,
      farm: product.farms
        ? {
            id: Number(product.farms.id),
            name: product.farms.name,
            province: product.farms.province,
            address: product.farms.address,
            description: product.farms.description,
          }
        : null,
      images: product.product_images.map((img) => ({
        id: Number(img.id),
        url: img.url,
        altText: img.alt_text,
        isPrimary: img.is_primary,
      })),
      variants: product.product_variants.map((v) => {
        const totalStock = v.product_batches.reduce((sum, b) => {
          return sum + b.inventory.reduce((iSum, inv) => iSum + (inv.quantity_on_hand - inv.quantity_reserved), 0);
        }, 0);

        return {
          id: Number(v.id),
          sku: v.sku,
          barcode: v.barcode,
          name: v.name,
          netWeightG: Number(v.net_weight_g),
          unitLabel: v.unit_label,
          price: Number(v.price),
          compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
          isDefault: v.is_default,
          availableStock: Math.max(0, totalStock),
        };
      }),
      nutritionFacts: product.nutrition_facts
        ? {
            servingSizeG: product.nutrition_facts.serving_size_g ? Number(product.nutrition_facts.serving_size_g) : null,
            caloriesKcal: Number(product.nutrition_facts.calories_kcal),
            proteinG: Number(product.nutrition_facts.protein_g),
            carbohydrateG: Number(product.nutrition_facts.carbohydrate_g),
            sugarG: Number(product.nutrition_facts.sugar_g),
            addedSugarG: Number(product.nutrition_facts.added_sugar_g),
            fiberG: Number(product.nutrition_facts.fiber_g),
            fatG: Number(product.nutrition_facts.fat_g),
            saturatedFatG: Number(product.nutrition_facts.saturated_fat_g),
            sodiumMg: Number(product.nutrition_facts.sodium_mg),
            glycemicIndex: product.nutrition_facts.glycemic_index,
          }
        : null,
      ingredients: product.product_ingredients.map((pi) => ({
        name: pi.ingredients.name,
        nameEn: pi.ingredients.name_en,
        percentage: pi.percentage ? Number(pi.percentage) : null,
      })),
      diets: product.product_diets.map((pd) => ({
        code: pd.diets.code,
        name: pd.diets.name_vi,
        iconUrl: pd.diets.icon_url,
      })),
      allergens: product.product_allergens.map((pa) => ({
        code: pa.allergens.code,
        name: pa.allergens.name_vi,
        relation: pa.relation,
      })),
      certifications: product.product_certifications.map((pc) => ({
        code: pc.certifications.code,
        name: pc.certifications.name,
        issuer: pc.certifications.issuer,
        certificateNumber: pc.certificate_number,
      })),
      substitutes: product.product_substitutes_product_substitutes_product_idToproducts.map((sub) => {
        const subProd = sub.products_product_substitutes_substitute_idToproducts;
        return {
          id: Number(subProd.id),
          name: subProd.name,
          slug: subProd.slug,
          reason: sub.reason,
          price: subProd.product_variants[0] ? Number(subProd.product_variants[0].price) : null,
          image: subProd.product_images[0]?.url || null,
        };
      }),
    };
  }

  async getTraceabilityByQr(qrCode: string) {
    const batch = await this.prisma.product_batches.findUnique({
      where: { qr_code: qrCode },
      include: {
        product_variants: {
          include: {
            products: true,
          },
        },
        farms: true,
        suppliers: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy thông tin lô hàng từ mã QR: ${qrCode}`);
    }

    return {
      batchCode: batch.batch_code,
      qrCode: batch.qr_code,
      product: {
        id: Number(batch.product_variants.products.id),
        name: batch.product_variants.products.name,
        slug: batch.product_variants.products.slug,
        variantName: batch.product_variants.name,
      },
      farm: batch.farms
        ? {
            name: batch.farms.name,
            owner: batch.farms.owner_name,
            province: batch.farms.province,
            address: batch.farms.address,
            description: batch.farms.description,
          }
        : null,
      supplier: batch.suppliers ? { name: batch.suppliers.name, contact: batch.suppliers.contact_name } : null,
      dates: {
        harvestedOn: batch.harvested_on,
        manufacturedOn: batch.manufactured_on,
        expiresOn: batch.expires_on,
      },
      labTest: {
        url: batch.lab_test_url,
        resultNote: batch.lab_result_note,
      },
    };
  }
}
