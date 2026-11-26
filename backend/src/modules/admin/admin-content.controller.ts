import { Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { pageMeta, slugify } from '../../common/utils/serialize';
import { cleanText } from '../reviews/dto/review.dto';
import { NotificationsService } from '../../core/notifications.service';

/** Long-form content keeps line breaks; only tags are stripped. */
const cleanLong = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/<\/?(script|iframe|object|embed|style)[^>]*>/gi, '').trim() : value);

class BannerDto {
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(200) title?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(300) subtitle?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(60) ctaLabel?: string;
  @ApiProperty() @IsString() @IsNotEmpty({ message: 'Vui lòng chọn ảnh banner' }) @MaxLength(1000) imageUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) linkUrl?: string;
  @ApiProperty({ enum: ['home_hero', 'home_promo'] }) @IsIn(['home_hero', 'home_promo']) position: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

class PostDto {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty({ message: 'Tiêu đề không được trống' }) @MaxLength(300) title: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(600) summary?: string;
  @ApiProperty() @Transform(cleanLong) @IsString() @IsNotEmpty({ message: 'Nội dung không được trống' }) content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categorySlug?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(150) expertReviewer?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

class RecipeIngredientDto {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty() @MaxLength(150) name: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() quantity?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() variantId?: number | null;
}
class RecipeDto {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty({ message: 'Tên món không được trống' }) @MaxLength(255) title: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) prepMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) cookMinutes?: number;
  @ApiProperty() @IsInt() @Min(1) servings: number;
  @ApiProperty({ enum: ['easy', 'medium', 'hard'] }) @IsIn(['easy', 'medium', 'hard']) difficulty: 'easy' | 'medium' | 'hard';
  @ApiProperty() @IsNumber() @Min(0) caloriesPerServing: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) proteinG?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) carbG?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) fatG?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsIn(['breakfast', 'lunch', 'dinner', 'snack'], { each: true }) mealTypes?: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) diets?: string[];
  @ApiProperty({ type: [RecipeIngredientDto] }) @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => RecipeIngredientDto) ingredients: RecipeIngredientDto[];
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) steps: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

class PageDto {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiProperty() @Transform(cleanLong) @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

class ModerateDto {
  @ApiPropertyOptional({ enum: ['approved', 'rejected'] }) @IsOptional() @IsIn(['approved', 'rejected']) status?: 'approved' | 'rejected';
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(1000) adminReply?: string;
}

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminContentController {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ---------------- Banners ----------------
  @Get('banners')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async banners() {
    const rows = await this.prisma.banners.findMany({ orderBy: [{ position: 'asc' }, { sort_order: 'asc' }] });
    return rows.map((b) => ({ id: Number(b.id), title: b.title, subtitle: b.subtitle, ctaLabel: b.cta_label, imageUrl: b.image_url, linkUrl: b.link_url, position: b.position, sortOrder: b.sort_order, startsAt: b.starts_at, endsAt: b.ends_at, isActive: b.is_active }));
  }

  private bannerData(d: BannerDto) {
    return { title: d.title ?? null, subtitle: d.subtitle ?? null, cta_label: d.ctaLabel ?? null, image_url: d.imageUrl, link_url: d.linkUrl ?? null, position: d.position, sort_order: d.sortOrder ?? 0, starts_at: d.startsAt ? new Date(d.startsAt) : null, ends_at: d.endsAt ? new Date(d.endsAt) : null, is_active: d.isActive ?? true };
  }

  @Post('banners')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async createBanner(@Body() d: BannerDto) {
    await this.prisma.banners.create({ data: this.bannerData(d) });
    return { message: 'Đã thêm banner' };
  }

  @Put('banners/:id')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async updateBanner(@Param('id', ParseIntPipe) id: number, @Body() d: BannerDto) {
    await this.prisma.banners.update({ where: { id: BigInt(id) }, data: this.bannerData(d) });
    return { message: 'Đã cập nhật banner' };
  }

  @Delete('banners/:id')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async deleteBanner(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.banners.delete({ where: { id: BigInt(id) } });
    return { message: 'Đã xóa banner' };
  }

  // ---------------- Blog posts ----------------
  @Get('posts')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async posts() {
    const rows = await this.prisma.blog_posts.findMany({ orderBy: { created_at: 'desc' }, include: { blog_categories: true } });
    return {
      data: rows.map((p) => ({ id: Number(p.id), title: p.title, slug: p.slug, summary: p.summary, content: p.content, coverImageUrl: p.cover_image_url, categorySlug: p.blog_categories?.slug ?? null, category: p.blog_categories?.name ?? null, expertReviewer: p.expert_reviewer, isPublished: p.is_published, publishedAt: p.published_at, viewCount: p.view_count })),
      categories: (await this.prisma.blog_categories.findMany()).map((c) => ({ slug: c.slug, name: c.name })),
    };
  }

  private async postData(d: PostDto, id?: number) {
    let slug = slugify(d.title);
    if (await this.prisma.blog_posts.findFirst({ where: { slug, ...(id ? { id: { not: BigInt(id) } } : {}) } })) slug = `${slug}-${Date.now().toString(36)}`;
    const cat = d.categorySlug ? await this.prisma.blog_categories.findUnique({ where: { slug: d.categorySlug } }) : null;
    return { title: d.title, slug, summary: d.summary ?? null, content: d.content, cover_image_url: d.coverImageUrl ?? null, category_id: cat?.id ?? null, expert_reviewer: d.expertReviewer ?? null, is_published: !!d.isPublished };
  }

  @Post('posts')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async createPost(@Body() d: PostDto, @CurrentUser() u: CurrentUserPayload) {
    const data = await this.postData(d);
    await this.prisma.blog_posts.create({ data: { ...data, author_id: BigInt(u.id), published_at: data.is_published ? new Date() : null } });
    return { message: 'Đã tạo bài viết' };
  }

  @Put('posts/:id')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async updatePost(@Param('id', ParseIntPipe) id: number, @Body() d: PostDto) {
    const old = await this.prisma.blog_posts.findUnique({ where: { id: BigInt(id) } });
    if (!old) throw new NotFoundException('Không tìm thấy bài viết');
    const data = await this.postData(d, id);
    await this.prisma.blog_posts.update({ where: { id: old.id }, data: { ...data, published_at: data.is_published ? old.published_at ?? new Date() : null } });
    return { message: 'Đã cập nhật bài viết' };
  }

  @Delete('posts/:id')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async deletePost(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.blog_posts.delete({ where: { id: BigInt(id) } });
    return { message: 'Đã xóa bài viết' };
  }

  // ---------------- Recipes ----------------
  @Get('recipes')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async recipes() {
    const rows = await this.prisma.recipes.findMany({
      orderBy: { created_at: 'desc' },
      include: { recipe_diets: { include: { diets: true } }, recipe_ingredients: { orderBy: { sort_order: 'asc' } }, recipe_steps: { orderBy: { step_number: 'asc' } } },
    });
    return rows.map((r) => ({
      id: Number(r.id), title: r.title, slug: r.slug, description: r.description, imageUrl: r.image_url, prepMinutes: r.prep_minutes, cookMinutes: r.cook_minutes, servings: r.servings,
      difficulty: r.difficulty, caloriesPerServing: Number(r.calories_per_serving ?? 0), proteinG: Number(r.protein_g ?? 0), carbG: Number(r.carbohydrate_g ?? 0), fatG: Number(r.fat_g ?? 0),
      mealTypes: r.meal_types, diets: r.recipe_diets.map((d) => d.diets.code), isPublished: r.is_published, viewCount: r.view_count,
      ingredients: r.recipe_ingredients.map((i) => ({ name: i.ingredient_name, quantity: i.quantity ? Number(i.quantity) : null, unit: i.unit, variantId: i.variant_id ? Number(i.variant_id) : null })),
      steps: r.recipe_steps.map((s) => s.instruction),
    }));
  }

  private async saveRecipe(d: RecipeDto, authorId: number, id?: number) {
    let slug = slugify(d.title);
    if (await this.prisma.recipes.findFirst({ where: { slug, ...(id ? { id: { not: BigInt(id) } } : {}) } })) slug = `${slug}-${Date.now().toString(36)}`;
    const variants = await this.prisma.product_variants.findMany({ where: { id: { in: d.ingredients.filter((i) => i.variantId).map((i) => BigInt(i.variantId!)) } } });
    await this.prisma.$transaction(async (tx) => {
      const data = {
        title: d.title, slug, description: d.description ?? null, image_url: d.imageUrl ?? null, prep_minutes: d.prepMinutes ?? null, cook_minutes: d.cookMinutes ?? null,
        servings: d.servings, difficulty: d.difficulty, calories_per_serving: d.caloriesPerServing, protein_g: d.proteinG ?? null, carbohydrate_g: d.carbG ?? null, fat_g: d.fatG ?? null,
        meal_types: d.mealTypes ?? [], is_published: !!d.isPublished,
      };
      const r = id ? await tx.recipes.update({ where: { id: BigInt(id) }, data }) : await tx.recipes.create({ data: { ...data, author_id: BigInt(authorId) } });
      await tx.recipe_ingredients.deleteMany({ where: { recipe_id: r.id } });
      await tx.recipe_steps.deleteMany({ where: { recipe_id: r.id } });
      await tx.recipe_diets.deleteMany({ where: { recipe_id: r.id } });
      for (const [i, ing] of d.ingredients.entries()) {
        const v = ing.variantId ? variants.find((x) => Number(x.id) === ing.variantId) : null;
        await tx.recipe_ingredients.create({ data: { recipe_id: r.id, ingredient_name: ing.name, quantity: ing.quantity ?? null, unit: ing.unit ?? null, variant_id: v?.id ?? null, product_id: v?.product_id ?? null, sort_order: i } });
      }
      if (d.steps.length) await tx.recipe_steps.createMany({ data: d.steps.filter((s) => s.trim()).map((s, i) => ({ recipe_id: r.id, step_number: i + 1, instruction: s.trim() })) });
      if (d.diets?.length) {
        const diets = await tx.diets.findMany({ where: { code: { in: d.diets } } });
        await tx.recipe_diets.createMany({ data: diets.map((x) => ({ recipe_id: r.id, diet_id: x.id })) });
      }
    });
    return { message: 'Đã lưu công thức' };
  }

  @Post('recipes')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  createRecipe(@Body() d: RecipeDto, @CurrentUser() u: CurrentUserPayload) {
    return this.saveRecipe(d, u.id);
  }

  @Put('recipes/:id')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  updateRecipe(@Param('id', ParseIntPipe) id: number, @Body() d: RecipeDto, @CurrentUser() u: CurrentUserPayload) {
    return this.saveRecipe(d, u.id, id);
  }

  @Delete('recipes/:id')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async deleteRecipe(@Param('id', ParseIntPipe) id: number) {
    const used = await this.prisma.meal_plan_items.count({ where: { recipe_id: BigInt(id) } });
    if (used) {
      await this.prisma.recipes.update({ where: { id: BigInt(id) }, data: { is_published: false } });
      return { message: 'Công thức đang nằm trong thực đơn của khách nên đã được ẩn thay vì xóa' };
    }
    await this.prisma.recipes.delete({ where: { id: BigInt(id) } });
    return { message: 'Đã xóa công thức' };
  }

  // ---------------- CMS pages ----------------
  @Get('pages')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async pages() {
    const rows = await this.prisma.cms_pages.findMany({ orderBy: { id: 'asc' } });
    return rows.map((p) => ({ id: Number(p.id), slug: p.slug, title: p.title, content: p.content, isPublished: p.is_published, updatedAt: p.updated_at }));
  }

  @Put('pages/:slug')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async savePage(@Param('slug') slug: string, @Body() d: PageDto) {
    const s = slugify(slug);
    await this.prisma.cms_pages.upsert({ where: { slug: s }, update: { title: d.title, content: d.content, is_published: d.isPublished ?? true }, create: { slug: s, title: d.title, content: d.content, is_published: d.isPublished ?? true } });
    return { message: 'Đã lưu trang' };
  }

  // ---------------- Reviews moderation ----------------
  @Get('reviews')
  @RequirePermissions(PERMISSIONS.REVIEW_MODERATE)
  async reviews(@Query('status') status?: string, @Query('rating') rating?: string, @Query('page') pageStr?: string) {
    const page = Math.max(1, Number(pageStr) || 1);
    const where = { ...(status ? { status: status as any } : {}), ...(rating ? { rating: Number(rating) } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.reviews.findMany({ where, orderBy: { created_at: 'desc' }, take: 20, skip: (page - 1) * 20, include: { users: { select: { full_name: true, email: true } }, products: { select: { name: true, slug: true } }, review_media: true } }),
      this.prisma.reviews.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({ id: Number(r.id), product: r.products.name, productSlug: r.products.slug, author: r.users.full_name, email: r.users.email, rating: r.rating, title: r.title, content: r.content, images: r.review_media.map((m) => m.url), status: r.status, isVerifiedPurchase: r.is_verified_purchase, adminReply: r.admin_reply, helpfulCount: r.helpful_count, createdAt: r.created_at })),
      meta: pageMeta(page, 20, total),
    };
  }

  @Patch('reviews/:id')
  @RequirePermissions(PERMISSIONS.REVIEW_MODERATE)
  async moderate(@Param('id', ParseIntPipe) id: number, @Body() d: ModerateDto) {
    const r = await this.prisma.reviews.findUnique({ where: { id: BigInt(id) }, include: { products: { select: { name: true, slug: true } } } });
    if (!r) throw new NotFoundException('Không tìm thấy đánh giá');
    await this.prisma.reviews.update({
      where: { id: r.id },
      data: { status: d.status ?? r.status, ...(d.adminReply !== undefined ? { admin_reply: d.adminReply || null, replied_at: d.adminReply ? new Date() : null } : {}) },
    });
    if (d.status === 'rejected' && r.status !== 'rejected') {
      await this.notifications.create(r.user_id, 'system', 'Đánh giá của bạn đã bị ẩn', `Đánh giá cho "${r.products.name}" vi phạm tiêu chuẩn cộng đồng của NUTRIO.`);
    }
    if (d.adminReply) await this.notifications.create(r.user_id, 'system', 'NUTRIO đã phản hồi đánh giá của bạn', d.adminReply.slice(0, 180), { productSlug: r.products.slug });
    return { message: 'Đã cập nhật đánh giá' };
  }

  // ---------------- Contacts & newsletter ----------------
  @Get('contacts')
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  async contacts() {
    const rows = await this.prisma.contact_messages.findMany({ orderBy: [{ is_resolved: 'asc' }, { created_at: 'desc' }], take: 100 });
    return rows.map((c) => ({ id: Number(c.id), name: c.name, email: c.email, subject: c.subject, message: c.message, isResolved: c.is_resolved, createdAt: c.created_at }));
  }

  @Patch('contacts/:id')
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  async resolveContact(@Param('id', ParseIntPipe) id: number, @Body('resolved') resolved: boolean) {
    await this.prisma.contact_messages.update({ where: { id: BigInt(id) }, data: { is_resolved: !!resolved } });
    return { message: resolved ? 'Đã đánh dấu đã xử lý' : 'Đã mở lại yêu cầu' };
  }

  @Get('newsletter')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async newsletter() {
    const rows = await this.prisma.newsletter_subscribers.findMany({ orderBy: { created_at: 'desc' }, take: 500 });
    return rows.map((r) => ({ email: r.email, createdAt: r.created_at }));
  }

  @Post('blog-categories')
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async createBlogCategory(@Body('name') name: string) {
    if (!name?.trim()) throw new ConflictException('Vui lòng nhập tên chuyên mục');
    await this.prisma.blog_categories.create({ data: { name: name.trim(), slug: slugify(name) } });
    return { message: 'Đã tạo chuyên mục' };
  }
}
