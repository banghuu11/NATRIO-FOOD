import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { slugify } from '../../common/utils/serialize';
import { cleanText } from '../reviews/dto/review.dto';

class CouponDto {
  @ApiProperty() @Transform(({ value }) => String(value ?? '').trim().toUpperCase()) @Matches(/^[A-Z0-9_-]{3,40}$/, { message: 'Mã chỉ gồm chữ in hoa, số, gạch dưới (3–40 ký tự)' }) code: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(300) description?: string;
  @ApiProperty({ enum: ['percent', 'fixed_amount', 'free_shipping'] }) @IsIn(['percent', 'fixed_amount', 'free_shipping']) discountType: 'percent' | 'fixed_amount' | 'free_shipping';
  @ApiProperty() @IsNumber() @Min(0) discountValue: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minOrderAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) usageLimit?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) usageLimitPerUser?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() firstOrderOnly?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() minTierCode?: string | null;
  @ApiProperty() @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' }) startsAt: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' }) endsAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

class BundleItemDto {
  @ApiProperty() @IsInt() @Min(1) variantId: number;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
}
class BundleDto {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty({ message: 'Tên combo không được trống' }) @MaxLength(200) name: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) imageUrl?: string;
  @ApiProperty() @IsNumber() @Min(1000) price: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ type: [BundleItemDto] }) @IsArray() @ArrayMinSize(2, { message: 'Combo cần ít nhất 2 sản phẩm' }) @ValidateNested({ each: true }) @Type(() => BundleItemDto) items: BundleItemDto[];
}

class FlashItemDto {
  @ApiProperty() @IsInt() @Min(1) variantId: number;
  @ApiProperty() @IsNumber() @Min(1000) salePrice: number;
  @ApiProperty() @IsInt() @Min(1) quantityLimit: number;
}
class FlashSaleDto {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @ApiProperty() @IsDateString() startsAt: string;
  @ApiProperty() @IsDateString() endsAt: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ type: [FlashItemDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => FlashItemDto) items: FlashItemDto[];
}

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@RequirePermissions(PERMISSIONS.COUPON_MANAGE)
@Controller('admin/promotions')
export class AdminPromotionsController {
  constructor(private prisma: PrismaService) {}

  private async actor(tx: any, id: number) {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(id)}, true)`;
  }

  // ---------------- Coupons ----------------
  @Get('coupons')
  async coupons() {
    const rows = await this.prisma.coupons.findMany({ orderBy: { created_at: 'desc' }, include: { membership_tiers: true } });
    const now = new Date();
    return rows.map((c) => ({
      id: Number(c.id), code: c.code, description: c.description, discountType: c.discount_type, discountValue: Number(c.discount_value),
      maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null, minOrderAmount: Number(c.min_order_amount),
      usageLimit: c.usage_limit, usageLimitPerUser: c.usage_limit_per_user, usedCount: c.used_count, firstOrderOnly: c.first_order_only,
      minTierCode: c.membership_tiers?.code ?? null, minTier: c.membership_tiers?.name ?? null, startsAt: c.starts_at, endsAt: c.ends_at, isActive: c.is_active,
      state: !c.is_active ? 'inactive' : c.starts_at > now ? 'scheduled' : c.ends_at && c.ends_at < now ? 'expired' : c.usage_limit && c.used_count >= c.usage_limit ? 'used_up' : 'running',
    }));
  }

  private async couponData(dto: CouponDto) {
    if (dto.discountType === 'percent' && (dto.discountValue <= 0 || dto.discountValue > 100)) throw new BadRequestException('Phần trăm giảm phải từ 1 đến 100');
    if (dto.discountType === 'fixed_amount' && dto.discountValue < 1000) throw new BadRequestException('Số tiền giảm tối thiểu 1.000đ');
    if (dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    const tier = dto.minTierCode ? await this.prisma.membership_tiers.findUnique({ where: { code: dto.minTierCode } }) : null;
    return {
      code: dto.code, description: dto.description ?? null, discount_type: dto.discountType, discount_value: dto.discountType === 'free_shipping' ? 0 : dto.discountValue,
      max_discount_amount: dto.discountType === 'percent' ? dto.maxDiscountAmount ?? null : null, min_order_amount: dto.minOrderAmount ?? 0,
      usage_limit: dto.usageLimit ?? null, usage_limit_per_user: dto.usageLimitPerUser ?? 1, first_order_only: !!dto.firstOrderOnly,
      min_tier_id: tier?.id ?? null, starts_at: new Date(dto.startsAt), ends_at: dto.endsAt ? new Date(dto.endsAt) : null, is_active: dto.isActive ?? true,
    };
  }

  @Post('coupons')
  async createCoupon(@Body() dto: CouponDto, @CurrentUser() u: CurrentUserPayload) {
    if (await this.prisma.coupons.findUnique({ where: { code: dto.code } })) throw new ConflictException('Mã giảm giá đã tồn tại');
    const data = await this.couponData(dto);
    await this.prisma.$transaction(async (tx) => {
      await this.actor(tx, u.id);
      await tx.coupons.create({ data });
    });
    return { message: 'Đã tạo mã giảm giá' };
  }

  @Put('coupons/:id')
  async updateCoupon(@Param('id', ParseIntPipe) id: number, @Body() dto: CouponDto, @CurrentUser() u: CurrentUserPayload) {
    const other = await this.prisma.coupons.findUnique({ where: { code: dto.code } });
    if (other && Number(other.id) !== id) throw new ConflictException('Mã giảm giá đã tồn tại');
    const data = await this.couponData(dto);
    await this.prisma.$transaction(async (tx) => {
      await this.actor(tx, u.id);
      await tx.coupons.update({ where: { id: BigInt(id) }, data });
    });
    return { message: 'Đã cập nhật mã giảm giá' };
  }

  @Delete('coupons/:id')
  async deleteCoupon(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: CurrentUserPayload) {
    const c = await this.prisma.coupons.findUnique({ where: { id: BigInt(id) }, include: { _count: { select: { coupon_usages: true, orders: true } } } });
    if (!c) throw new NotFoundException('Không tìm thấy mã giảm giá');
    await this.prisma.$transaction(async (tx) => {
      await this.actor(tx, u.id);
      if (c._count.coupon_usages || c._count.orders) await tx.coupons.update({ where: { id: c.id }, data: { is_active: false } });
      else {
        await tx.carts.updateMany({ where: { coupon_id: c.id }, data: { coupon_id: null } });
        await tx.coupons.delete({ where: { id: c.id } });
      }
    });
    return { message: c._count.coupon_usages || c._count.orders ? 'Mã đã được sử dụng nên được chuyển sang trạng thái vô hiệu hóa' : 'Đã xóa mã giảm giá' };
  }

  // ---------------- Bundles (combo) ----------------
  @Get('bundles')
  async bundles() {
    const rows = await this.prisma.bundles.findMany({ orderBy: { id: 'desc' }, include: { bundle_items: { include: { product_variants: { include: { products: { select: { name: true } } } } } } } });
    return rows.map((b) => ({
      id: Number(b.id), name: b.name, slug: b.slug, description: b.description, imageUrl: b.image_url, price: Number(b.price), isActive: b.is_active, startsAt: b.starts_at, endsAt: b.ends_at,
      retailPrice: b.bundle_items.reduce((s, i) => s + Number(i.product_variants.price) * i.quantity, 0),
      items: b.bundle_items.map((i) => ({ variantId: Number(i.variant_id), quantity: i.quantity, name: `${i.product_variants.products.name} – ${i.product_variants.name}` })),
    }));
  }

  @Post('bundles')
  async createBundle(@Body() dto: BundleDto) {
    return this.saveBundle(dto);
  }

  @Put('bundles/:id')
  async updateBundle(@Param('id', ParseIntPipe) id: number, @Body() dto: BundleDto) {
    return this.saveBundle(dto, id);
  }

  private async saveBundle(dto: BundleDto, id?: number) {
    const slug = slugify(dto.name);
    const clash = await this.prisma.bundles.findFirst({ where: { slug, ...(id ? { id: { not: BigInt(id) } } : {}) } });
    const data = { name: dto.name, slug: clash ? `${slug}-${Date.now().toString(36)}` : slug, description: dto.description ?? null, image_url: dto.imageUrl ?? null, price: Math.round(dto.price), starts_at: dto.startsAt ? new Date(dto.startsAt) : null, ends_at: dto.endsAt ? new Date(dto.endsAt) : null, is_active: dto.isActive ?? true };
    await this.prisma.$transaction(async (tx) => {
      const b = id ? await tx.bundles.update({ where: { id: BigInt(id) }, data }) : await tx.bundles.create({ data });
      await tx.bundle_items.deleteMany({ where: { bundle_id: b.id } });
      await tx.bundle_items.createMany({ data: dto.items.map((i) => ({ bundle_id: b.id, variant_id: BigInt(i.variantId), quantity: i.quantity })) });
    });
    return { message: 'Đã lưu combo' };
  }

  @Delete('bundles/:id')
  async deleteBundle(@Param('id', ParseIntPipe) id: number) {
    const used = await this.prisma.order_items.count({ where: { bundle_id: BigInt(id) } });
    if (used) {
      await this.prisma.bundles.update({ where: { id: BigInt(id) }, data: { is_active: false } });
      return { message: 'Combo đã có đơn hàng nên được chuyển sang ngừng bán' };
    }
    await this.prisma.bundles.delete({ where: { id: BigInt(id) } });
    return { message: 'Đã xóa combo' };
  }

  // ---------------- Flash sales ----------------
  @Get('flash-sales')
  async flashSales() {
    const rows = await this.prisma.flash_sales.findMany({ orderBy: { starts_at: 'desc' }, include: { flash_sale_items: { include: { product_variants: { include: { products: { select: { name: true } } } } } } } });
    return rows.map((f) => ({
      id: Number(f.id), name: f.name, startsAt: f.starts_at, endsAt: f.ends_at, isActive: f.is_active,
      items: f.flash_sale_items.map((i) => ({ variantId: Number(i.variant_id), name: `${i.product_variants.products.name} – ${i.product_variants.name}`, salePrice: Number(i.sale_price), regularPrice: Number(i.product_variants.price), quantityLimit: i.quantity_limit, soldCount: i.sold_count })),
    }));
  }

  @Post('flash-sales')
  createFlash(@Body() dto: FlashSaleDto) {
    return this.saveFlash(dto);
  }

  @Put('flash-sales/:id')
  updateFlash(@Param('id', ParseIntPipe) id: number, @Body() dto: FlashSaleDto) {
    return this.saveFlash(dto, id);
  }

  private async saveFlash(dto: FlashSaleDto, id?: number) {
    if (new Date(dto.endsAt) <= new Date(dto.startsAt)) throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    const variants = await this.prisma.product_variants.findMany({ where: { id: { in: dto.items.map((i) => BigInt(i.variantId)) } } });
    for (const it of dto.items) {
      const v = variants.find((x) => Number(x.id) === it.variantId);
      if (!v) throw new BadRequestException('Sản phẩm không tồn tại');
      if (it.salePrice >= Number(v.price)) throw new BadRequestException(`Giá flash sale của ${v.sku} phải thấp hơn giá bán ${Number(v.price).toLocaleString('vi-VN')}đ`);
    }
    await this.prisma.$transaction(async (tx) => {
      const data = { name: dto.name, starts_at: new Date(dto.startsAt), ends_at: new Date(dto.endsAt), is_active: dto.isActive ?? true };
      const f = id ? await tx.flash_sales.update({ where: { id: BigInt(id) }, data }) : await tx.flash_sales.create({ data });
      const existing = await tx.flash_sale_items.findMany({ where: { flash_sale_id: f.id } });
      await tx.flash_sale_items.deleteMany({ where: { flash_sale_id: f.id, variant_id: { notIn: dto.items.map((i) => BigInt(i.variantId)) } } });
      for (const it of dto.items) {
        const prev = existing.find((e) => Number(e.variant_id) === it.variantId);
        if (prev && prev.sold_count > it.quantityLimit) throw new BadRequestException('Số suất không thể nhỏ hơn số đã bán');
        await tx.flash_sale_items.upsert({
          where: { flash_sale_id_variant_id: { flash_sale_id: f.id, variant_id: BigInt(it.variantId) } },
          update: { sale_price: it.salePrice, quantity_limit: it.quantityLimit },
          create: { flash_sale_id: f.id, variant_id: BigInt(it.variantId), sale_price: it.salePrice, quantity_limit: it.quantityLimit },
        });
      }
    });
    return { message: 'Đã lưu chương trình flash sale' };
  }

  @Delete('flash-sales/:id')
  async deleteFlash(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.flash_sales.delete({ where: { id: BigInt(id) } });
    return { message: 'Đã xóa chương trình flash sale' };
  }
}
