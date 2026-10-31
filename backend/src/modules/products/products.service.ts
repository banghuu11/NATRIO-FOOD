import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsQueryDto, SortBy } from './dto/products-query.dto';
import { CreateProductDto, InitialVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  /**
   * [ADMIN] Lấy toàn bộ sản phẩm (kể cả draft & archived) kèm tổng tồn kho thực tế
   */
  async findAllForAdmin(query: { search?: string; status?: string; nutriScore?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }
    if (query.nutriScore && query.nutriScore !== 'all') {
      where.nutri_score_grade = query.nutriScore.toUpperCase();
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
        include: {
          categories: { select: { id: true, name: true, slug: true } },
          brands: { select: { id: true, name: true } },
          farms: { select: { id: true, name: true, province: true } },
          product_variants: {
            include: {
              product_batches: {
                include: {
                  inventory: true,
                },
              },
            },
          },
          nutrition_facts: true,
          product_images: { orderBy: { sort_order: 'asc' } },
        },
      }),
      this.prisma.products.count({ where }),
    ]);

    const formatted = products.map((p) => {
      // Tính tổng tồn kho khả dụng từ tất cả biến thể và lô hàng
      let totalStock = 0;
      p.product_variants.forEach((v) => {
        v.product_batches.forEach((b) => {
          b.inventory.forEach((inv) => {
            totalStock += inv.quantity_on_hand;
          });
        });
      });

      const defaultVariant = p.product_variants.find((v) => v.is_default) || p.product_variants[0];

      return {
        id: Number(p.id),
        name: p.name,
        slug: p.slug,
        category: p.categories.name,
        categorySlug: p.categories.slug,
        brand: p.brands?.name || 'NUTRIO Organic',
        farm: p.farms?.name || null,
        status: p.status,
        isFeatured: p.is_featured,
        nutriScore: p.nutri_score_grade,
        price: defaultVariant ? Number(defaultVariant.price) : 0,
        compareAtPrice: defaultVariant?.compare_at_price ? Number(defaultVariant.compare_at_price) : null,
        totalStock,
        variantsCount: p.product_variants.length,
        images: p.product_images.map((img) => img.url),
        primaryImage: p.product_images[0]?.url || '/images/default-nut.jpg',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * [ADMIN] Tạo sản phẩm mới kèm Nutrition Facts & Biến thể ban đầu
   */
  async createProduct(dto: CreateProductDto) {
    const rawSlug = dto.slug || dto.name;
    const cleanSlug = rawSlug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Kiểm tra trùng slug
    const existing = await this.prisma.products.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      throw new BadRequestException(`Đường dẫn slug '${cleanSlug}' đã tồn tại, vui lòng chọn tên hoặc slug khác.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.products.create({
        data: {
          category_id: BigInt(dto.categoryId),
          brand_id: dto.brandId ? BigInt(dto.brandId) : null,
          farm_id: dto.farmId ? BigInt(dto.farmId) : null,
          name: dto.name,
          slug: cleanSlug,
          short_description: dto.shortDescription || null,
          description: dto.description || null,
          origin_country: dto.originCountry || 'Việt Nam',
          shelf_life_days: dto.shelfLifeDays || 270,
          nutri_score_grade: dto.nutriScoreGrade || 'A',
          is_featured: dto.isFeatured || false,
          status: dto.status || 'active',
        },
      });

      // Tạo Nutrition Facts nếu có
      if (dto.nutritionFacts) {
        await tx.nutrition_facts.create({
          data: {
            product_id: product.id,
            serving_size_g: 100,
            calories_kcal: dto.nutritionFacts.caloriesKcal,
            protein_g: dto.nutritionFacts.proteinG,
            carbohydrate_g: dto.nutritionFacts.carbohydratesG,
            sugar_g: dto.nutritionFacts.sugarsG || 0,
            fat_g: dto.nutritionFacts.fatG,
            fiber_g: dto.nutritionFacts.fiberG || 0,
            sodium_mg: dto.nutritionFacts.sodiumMg || 0,
          },
        });
      }

      // Tạo biến thể ban đầu
      const v = dto.initialVariant;
      if (v) {
        await tx.product_variants.create({
          data: {
            product_id: product.id,
            sku: v.sku,
            name: v.name,
            net_weight_g: v.netWeightG,
            price: v.price,
            compare_at_price: v.compareAtPrice || null,
            cost_price: v.costPrice || null,
            reorder_level: v.reorderLevel || 10,
            is_default: true,
            is_active: true,
          },
        });
      }

      // Tạo hình ảnh nếu có
      if (dto.imageUrls && dto.imageUrls.length > 0) {
        await tx.product_images.createMany({
          data: dto.imageUrls.map((url, idx) => ({
            product_id: product.id,
            url: url,
            is_primary: idx === 0,
            sort_order: idx,
          })),
        });
      }

      return {
        message: 'Tạo sản phẩm thành công',
        productId: Number(product.id),
        slug: product.slug,
      };
    });
  }

  /**
   * [ADMIN] Cập nhật thông tin sản phẩm
   */
  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.products.findUnique({
      where: { id: BigInt(id) },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: ${id}`);
    }

    const data: any = {
      updated_at: new Date(),
    };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.shortDescription !== undefined) data.short_description = dto.shortDescription;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) data.category_id = BigInt(dto.categoryId);
    if (dto.brandId !== undefined) data.brand_id = dto.brandId ? BigInt(dto.brandId) : null;
    if (dto.farmId !== undefined) data.farm_id = dto.farmId ? BigInt(dto.farmId) : null;
    if (dto.originCountry !== undefined) data.origin_country = dto.originCountry;
    if (dto.shelfLifeDays !== undefined) data.shelf_life_days = dto.shelfLifeDays;
    if (dto.nutriScoreGrade !== undefined) data.nutri_score_grade = dto.nutriScoreGrade;
    if (dto.isFeatured !== undefined) data.is_featured = dto.isFeatured;
    if (dto.status !== undefined) data.status = dto.status;

    await this.prisma.products.update({
      where: { id: BigInt(id) },
      data,
    });

    // Cập nhật Nutrition Facts nếu có
    if (dto.nutritionFacts) {
      await this.prisma.nutrition_facts.upsert({
        where: { product_id: BigInt(id) },
        update: {
          calories_kcal: dto.nutritionFacts.caloriesKcal,
          protein_g: dto.nutritionFacts.proteinG,
          carbohydrate_g: dto.nutritionFacts.carbohydratesG,
          sugar_g: dto.nutritionFacts.sugarsG || 0,
          fat_g: dto.nutritionFacts.fatG,
          fiber_g: dto.nutritionFacts.fiberG || 0,
          sodium_mg: dto.nutritionFacts.sodiumMg || 0,
        },
        create: {
          product_id: BigInt(id),
          serving_size_g: 100,
          calories_kcal: dto.nutritionFacts.caloriesKcal,
          protein_g: dto.nutritionFacts.proteinG,
          carbohydrate_g: dto.nutritionFacts.carbohydratesG,
          sugar_g: dto.nutritionFacts.sugarsG || 0,
          fat_g: dto.nutritionFacts.fatG,
          fiber_g: dto.nutritionFacts.fiberG || 0,
          sodium_mg: dto.nutritionFacts.sodiumMg || 0,
        },
      });
    }

    return {
      message: 'Cập nhật sản phẩm thành công',
      productId: id,
    };
  }

  /**
   * [ADMIN] Lưu trữ / Vô hiệu hóa sản phẩm (Archive)
   */
  async archiveProduct(id: number) {
    const product = await this.prisma.products.findUnique({
      where: { id: BigInt(id) },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: ${id}`);
    }

    await this.prisma.products.update({
      where: { id: BigInt(id) },
      data: {
        status: 'discontinued',
        deleted_at: new Date(),
      },
    });

    return {
      message: `Đã lưu trữ và ngưng kinh doanh sản phẩm: ${product.name}`,
    };
  }

  /**
   * [ADMIN] Thêm biến thể đóng gói mới cho sản phẩm
   */
  async createVariant(productId: number, v: InitialVariantDto) {
    const product = await this.prisma.products.findUnique({
      where: { id: BigInt(productId) },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: ${productId}`);
    }

    const existingSku = await this.prisma.product_variants.findUnique({
      where: { sku: v.sku },
    });
    if (existingSku) {
      throw new BadRequestException(`Mã SKU '${v.sku}' đã tồn tại.`);
    }

    const variant = await this.prisma.product_variants.create({
      data: {
        product_id: BigInt(productId),
        sku: v.sku,
        name: v.name,
        net_weight_g: v.netWeightG,
        price: v.price,
        compare_at_price: v.compareAtPrice || null,
        cost_price: v.costPrice || null,
        reorder_level: v.reorderLevel || 10,
        is_default: false,
        is_active: true,
      },
    });

    return {
      message: 'Thêm biến thể thành công',
      variantId: Number(variant.id),
      sku: variant.sku,
    };
  }
}
