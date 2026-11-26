import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../products/stock.service';
import { PLACEHOLDER_IMG } from '../products/product.mapper';
import { round1 } from '../../common/utils/serialize';

type Db = PrismaService | Prisma.TransactionClient;

export interface LineInput {
  variantId?: number | null;
  bundleId?: number | null;
  quantity: number;
  cartItemId?: number;
}

export interface PricedLine {
  cartItemId?: number;
  variantId: number | null;
  bundleId: number | null;
  productId: number | null;
  slug: string | null;
  name: string;
  variantName: string | null;
  sku: string | null;
  image: string;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  weightG: number;
  availableStock: number;
  stockOk: boolean;
  isFlashSale: boolean;
  flashSaleItemId: number | null;
  /** components for bundles: variant → qty per bundle */
  components: { variantId: number; quantity: number }[];
  nutrition: { kcal: number; protein: number; carb: number; fat: number; sugar: number; fiber: number };
}

export interface QuoteOptions {
  userId?: number;
  couponCode?: string | null;
  shippingMethodId?: number | null;
  pointsToUse?: number;
  /** If true, invalid coupon throws instead of being reported. */
  strict?: boolean;
}

const POINT_VALUE_VND = 100; // 1 điểm = 100đ
const MAX_REDEEM_RATIO = 0.5; // tối đa 50% giá trị đơn sau giảm giá
const VND_PER_POINT_EARNED = 1000; // 1.000đ = 1 điểm

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private stock: StockService,
  ) {}

  /** Resolves current prices, stock and nutrition for a list of lines. */
  async priceLines(lines: LineInput[], db: Db = this.prisma): Promise<PricedLine[]> {
    const variantIds = lines.filter((l) => l.variantId).map((l) => BigInt(l.variantId!));
    const bundleIds = lines.filter((l) => l.bundleId).map((l) => BigInt(l.bundleId!));

    const [variants, bundles, flash] = await Promise.all([
      db.product_variants.findMany({
        where: { id: { in: variantIds } },
        include: { products: { include: { nutrition_facts: true, product_images: { orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }], take: 1 } } } },
      }),
      db.bundles.findMany({
        where: { id: { in: bundleIds } },
        include: { bundle_items: { include: { product_variants: { include: { products: { include: { nutrition_facts: true } } } } } } },
      }),
      db.flash_sale_items.findMany({
        where: { variant_id: { in: variantIds }, flash_sales: { is_active: true, starts_at: { lte: new Date() }, ends_at: { gt: new Date() } } },
      }),
    ]);
    const componentIds = bundles.flatMap((b) => b.bundle_items.map((bi) => bi.variant_id));
    const stock = await this.stock.availableByVariant([...variantIds, ...componentIds], db);

    const nutritionOf = (nf: any, grams: number) => {
      const r = grams / 100;
      return nf
        ? { kcal: Number(nf.calories_kcal) * r, protein: Number(nf.protein_g) * r, carb: Number(nf.carbohydrate_g) * r, fat: Number(nf.fat_g) * r, sugar: Number(nf.sugar_g) * r, fiber: Number(nf.fiber_g) * r }
        : { kcal: 0, protein: 0, carb: 0, fat: 0, sugar: 0, fiber: 0 };
    };
    const add = (a: PricedLine['nutrition'], b: PricedLine['nutrition'], k = 1) => {
      for (const key of Object.keys(a) as (keyof typeof a)[]) a[key] += b[key] * k;
    };

    return lines.map((line) => {
      if (line.variantId) {
        const v = variants.find((x) => Number(x.id) === Number(line.variantId));
        if (!v) throw new BadRequestException('Có sản phẩm trong giỏ không còn tồn tại');
        const p = v.products;
        const fs = flash.find((f) => Number(f.variant_id) === Number(v.id) && f.sold_count + line.quantity <= f.quantity_limit);
        const unitPrice = fs ? Number(fs.sale_price) : Number(v.price);
        const available = stock.get(Number(v.id)) ?? 0;
        const sellable = v.is_active && p.status === 'active' && !p.deleted_at;
        const weightG = Number(v.net_weight_g);
        const nutrition = nutritionOf(p.nutrition_facts, weightG * line.quantity);
        return {
          cartItemId: line.cartItemId,
          variantId: Number(v.id),
          bundleId: null,
          productId: Number(p.id),
          slug: p.slug,
          name: p.name,
          variantName: v.name,
          sku: v.sku,
          image: p.product_images[0]?.url || PLACEHOLDER_IMG,
          unitPrice,
          compareAtPrice: fs ? Number(v.price) : v.compare_at_price ? Number(v.compare_at_price) : null,
          quantity: line.quantity,
          lineTotal: unitPrice * line.quantity,
          weightG: weightG * line.quantity,
          availableStock: sellable ? available : 0,
          stockOk: sellable && available >= line.quantity,
          isFlashSale: !!fs,
          flashSaleItemId: fs ? Number(fs.id) : null,
          components: [{ variantId: Number(v.id), quantity: 1 }],
          nutrition,
        };
      }
      const b = bundles.find((x) => Number(x.id) === Number(line.bundleId));
      if (!b) throw new BadRequestException('Combo trong giỏ không còn tồn tại');
      const now = new Date();
      const active = b.is_active && (!b.starts_at || b.starts_at <= now) && (!b.ends_at || b.ends_at > now);
      const perBundle = b.bundle_items.map((bi) => Math.floor((stock.get(Number(bi.variant_id)) ?? 0) / bi.quantity));
      const available = active && perBundle.length ? Math.min(...perBundle) : 0;
      const nutrition = { kcal: 0, protein: 0, carb: 0, fat: 0, sugar: 0, fiber: 0 };
      let weight = 0;
      let retail = 0;
      for (const bi of b.bundle_items) {
        const grams = Number(bi.product_variants.net_weight_g) * bi.quantity;
        weight += grams;
        retail += Number(bi.product_variants.price) * bi.quantity;
        add(nutrition, nutritionOf(bi.product_variants.products.nutrition_facts, grams), line.quantity);
      }
      return {
        cartItemId: line.cartItemId,
        variantId: null,
        bundleId: Number(b.id),
        productId: null,
        slug: b.slug,
        name: b.name,
        variantName: 'Combo',
        sku: `COMBO-${b.id}`,
        image: b.image_url || PLACEHOLDER_IMG,
        unitPrice: Number(b.price),
        compareAtPrice: retail > Number(b.price) ? retail : null,
        quantity: line.quantity,
        lineTotal: Number(b.price) * line.quantity,
        weightG: weight * line.quantity,
        availableStock: available,
        stockOk: available >= line.quantity,
        isFlashSale: false,
        flashSaleItemId: null,
        components: b.bundle_items.map((bi) => ({ variantId: Number(bi.variant_id), quantity: bi.quantity })),
        nutrition,
      };
    });
  }

  /** Validates a coupon for a user/subtotal. Returns the coupon or an error message. */
  async checkCoupon(code: string, subtotal: number, userId: number | undefined, db: Db = this.prisma) {
    const coupon = await db.coupons.findUnique({ where: { code: code.trim() }, include: { membership_tiers: true } });
    const now = new Date();
    if (!coupon || !coupon.is_active) return { error: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa' };
    if (coupon.starts_at > now) return { error: 'Mã giảm giá chưa đến thời gian sử dụng' };
    if (coupon.ends_at && coupon.ends_at < now) return { error: 'Mã giảm giá đã hết hạn' };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return { error: 'Mã giảm giá đã hết lượt sử dụng' };
    if (subtotal < Number(coupon.min_order_amount)) {
      return { error: `Đơn hàng tối thiểu ${Number(coupon.min_order_amount).toLocaleString('vi-VN')}đ để dùng mã này` };
    }
    if (coupon.first_order_only || coupon.usage_limit_per_user || coupon.min_tier_id) {
      if (!userId) {
        if (coupon.first_order_only || coupon.min_tier_id) return { error: 'Vui lòng đăng nhập để sử dụng mã giảm giá này' };
      } else {
        const uid = BigInt(userId);
        const [used, orders, loyalty] = await Promise.all([
          db.coupon_usages.count({ where: { coupon_id: coupon.id, user_id: uid } }),
          coupon.first_order_only ? db.orders.count({ where: { user_id: uid, status: { not: 'cancelled' } } }) : Promise.resolve(0),
          coupon.min_tier_id ? db.loyalty_accounts.findUnique({ where: { user_id: uid } }) : Promise.resolve(null),
        ]);
        if (used >= coupon.usage_limit_per_user) return { error: 'Bạn đã dùng hết lượt cho mã giảm giá này' };
        if (coupon.first_order_only && orders > 0) return { error: 'Mã chỉ áp dụng cho đơn hàng đầu tiên' };
        if (coupon.membership_tiers && (loyalty?.lifetime_points ?? 0) < coupon.membership_tiers.min_points) {
          return { error: `Mã chỉ dành cho thành viên hạng ${coupon.membership_tiers.name} trở lên` };
        }
      }
    }
    return { coupon };
  }

  /** Full price breakdown. Same function is used for the cart, the checkout preview and order creation. */
  async quote(lines: PricedLine[], opts: QuoteOptions, db: Db = this.prisma) {
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const totalWeightG = lines.reduce((s, l) => s + l.weightG, 0);

    // Membership tier (discount % and free-ship threshold)
    let tier: { code: string; name: string; discount: number; freeShipMin: number | null; multiplier: number } | null = null;
    let pointsBalance = 0;
    if (opts.userId) {
      const la = await db.loyalty_accounts.findUnique({ where: { user_id: BigInt(opts.userId) }, include: { membership_tiers: true } });
      pointsBalance = la?.points_balance ?? 0;
      if (la?.membership_tiers) {
        const benefits = (la.membership_tiers.benefits || {}) as { free_ship_min?: number };
        tier = {
          code: la.membership_tiers.code,
          name: la.membership_tiers.name,
          discount: Number(la.membership_tiers.discount_percent),
          freeShipMin: typeof benefits.free_ship_min === 'number' ? benefits.free_ship_min : null,
          multiplier: Number(la.membership_tiers.points_multiplier),
        };
      }
    }
    const memberDiscount = tier && tier.discount > 0 ? Math.floor((subtotal * tier.discount) / 100) : 0;

    // Coupon
    let couponDiscount = 0;
    let freeShipping = false;
    let coupon: { id: number; code: string; description: string | null; discountType: string } | null = null;
    let couponError: string | null = null;
    if (opts.couponCode) {
      const res = await this.checkCoupon(opts.couponCode, subtotal, opts.userId, db);
      if ('error' in res && res.error) {
        if (opts.strict) throw new BadRequestException(res.error);
        couponError = res.error;
      } else if (res.coupon) {
        const c = res.coupon;
        coupon = { id: Number(c.id), code: c.code, description: c.description, discountType: c.discount_type };
        if (c.discount_type === 'percent') {
          couponDiscount = Math.floor((subtotal * Number(c.discount_value)) / 100);
          if (c.max_discount_amount) couponDiscount = Math.min(couponDiscount, Number(c.max_discount_amount));
        } else if (c.discount_type === 'fixed_amount') {
          couponDiscount = Number(c.discount_value);
        } else {
          freeShipping = true;
        }
      }
    }
    const discountAmount = Math.min(subtotal, memberDiscount + couponDiscount);

    // Shipping
    const methods = await db.shipping_methods.findMany({ where: { is_active: true }, orderBy: { base_fee: 'asc' } });
    const method = (opts.shippingMethodId && methods.find((m) => Number(m.id) === Number(opts.shippingMethodId))) || methods[0];
    if (opts.strict && opts.shippingMethodId && Number(method?.id) !== Number(opts.shippingMethodId)) {
      throw new BadRequestException('Phương thức vận chuyển không hợp lệ');
    }
    const shippingFor = (m: (typeof methods)[number]) => {
      if (!lines.length || freeShipping) return 0;
      const thresholds = [m.free_ship_threshold ? Number(m.free_ship_threshold) : null, m.code === 'standard' ? tier?.freeShipMin ?? null : null].filter(
        (x): x is number => x !== null,
      );
      const threshold = thresholds.length ? Math.min(...thresholds) : null;
      return threshold !== null && subtotal >= threshold ? 0 : Number(m.base_fee);
    };
    const shippingFee = method ? shippingFor(method) : 0;

    // Loyalty points
    const afterDiscount = subtotal - discountAmount;
    const maxPoints = Math.min(pointsBalance, Math.floor((afterDiscount * MAX_REDEEM_RATIO) / POINT_VALUE_VND));
    const requested = Math.max(0, Math.floor(opts.pointsToUse || 0));
    if (opts.strict && requested > maxPoints) throw new BadRequestException(`Bạn chỉ có thể dùng tối đa ${maxPoints} điểm cho đơn này`);
    const pointsUsed = Math.min(requested, maxPoints);
    const pointsDiscount = pointsUsed * POINT_VALUE_VND;

    const totalAmount = subtotal - discountAmount - pointsDiscount + shippingFee;
    const pointsEarned = Math.floor((Math.floor(totalAmount / VND_PER_POINT_EARNED) * (tier?.multiplier ?? 1)));

    const nutrition = lines.reduce(
      (acc, l) => {
        acc.kcal += l.nutrition.kcal;
        acc.protein += l.nutrition.protein;
        acc.carb += l.nutrition.carb;
        acc.fat += l.nutrition.fat;
        acc.sugar += l.nutrition.sugar;
        acc.fiber += l.nutrition.fiber;
        return acc;
      },
      { kcal: 0, protein: 0, carb: 0, fat: 0, sugar: 0, fiber: 0 },
    );

    return {
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal,
      memberDiscount,
      couponDiscount: Math.max(0, discountAmount - Math.min(memberDiscount, discountAmount)),
      discountAmount,
      shippingFee,
      freeShipping,
      pointsUsed,
      pointsDiscount,
      maxPointsUsable: maxPoints,
      pointsBalance,
      totalAmount,
      pointsEarned,
      totalWeightG,
      coupon,
      couponError,
      tier: tier ? { code: tier.code, name: tier.name, discountPercent: tier.discount } : null,
      shippingMethod: method ? { id: Number(method.id), code: method.code, name: method.name } : null,
      shippingOptions: methods.map((m) => ({
        id: Number(m.id),
        code: m.code,
        name: m.name,
        carrier: m.carrier,
        fee: shippingFor(m),
        baseFee: Number(m.base_fee),
        freeShipThreshold: m.free_ship_threshold ? Number(m.free_ship_threshold) : null,
        estHoursMin: m.est_hours_min,
        estHoursMax: m.est_hours_max,
      })),
      nutrition: {
        kcal: Math.round(nutrition.kcal),
        proteinG: round1(nutrition.protein),
        carbG: round1(nutrition.carb),
        fatG: round1(nutrition.fat),
        sugarG: round1(nutrition.sugar),
        fiberG: round1(nutrition.fiber),
      },
      allInStock: lines.every((l) => l.stockOk),
    };
  }
}
