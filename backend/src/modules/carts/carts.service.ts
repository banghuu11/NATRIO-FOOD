import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { AddCartItemDto } from './dto/cart.dto';

export interface CartOwner {
  userId?: number;
  token?: string;
}

const TOKEN_RE = /^[A-Za-z0-9-]{16,80}$/;

@Injectable()
export class CartsService {
  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
  ) {}

  private async findCart(owner: CartOwner, create = true) {
    if (owner.userId) {
      const uid = BigInt(owner.userId);
      const cart = await this.prisma.carts.findFirst({ where: { user_id: uid }, orderBy: { id: 'asc' } });
      return cart ?? (create ? this.prisma.carts.create({ data: { user_id: uid } }) : null);
    }
    if (owner.token && TOKEN_RE.test(owner.token)) {
      const cart = await this.prisma.carts.findFirst({ where: { session_token: owner.token, user_id: null } });
      return cart ?? (create ? this.prisma.carts.create({ data: { session_token: owner.token, expires_at: new Date(Date.now() + 30 * 864e5) } }) : null);
    }
    if (!create) return null;
    throw new BadRequestException('Thiếu mã giỏ hàng (x-cart-token) cho khách chưa đăng nhập');
  }

  async getCart(owner: CartOwner, selectedIds?: number[]) {
    const cart = await this.findCart(owner, false);
    if (!cart) return this.emptyCart();
    const items = await this.prisma.cart_items.findMany({ where: { cart_id: cart.id }, orderBy: { added_at: 'desc' } });
    const lines = await this.pricing.priceLines(
      items.map((i) => ({ cartItemId: Number(i.id), variantId: i.variant_id ? Number(i.variant_id) : null, bundleId: i.bundle_id ? Number(i.bundle_id) : null, quantity: i.quantity })),
    );
    const selected = selectedIds?.length ? lines.filter((l) => selectedIds.includes(l.cartItemId!)) : lines;
    const coupon = cart.coupon_id ? await this.prisma.coupons.findUnique({ where: { id: cart.coupon_id } }) : null;
    const summary = await this.pricing.quote(selected, { userId: owner.userId, couponCode: coupon?.code });
    return {
      cartId: Number(cart.id),
      items: lines.map((l) => ({ ...l, id: l.cartItemId!, selected: selected.includes(l) })),
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      couponCode: coupon?.code ?? null,
      summary,
    };
  }

  private async emptyCart() {
    return { cartId: null, items: [], itemCount: 0, couponCode: null, summary: await this.pricing.quote([], {}) };
  }

  private async assertStock(variantId: number | undefined, bundleId: number | undefined, quantity: number) {
    const [line] = await this.pricing.priceLines([{ variantId, bundleId, quantity }]);
    if (line.availableStock <= 0) throw new BadRequestException(`"${line.name}" hiện đã hết hàng`);
    if (!line.stockOk) throw new BadRequestException(`"${line.name}" chỉ còn ${line.availableStock} sản phẩm`);
    return line;
  }

  async addItem(owner: CartOwner, dto: AddCartItemDto) {
    if (!!dto.variantId === !!dto.bundleId) throw new BadRequestException('Chọn đúng một sản phẩm hoặc một combo');
    const cart = await this.findCart(owner);
    const where = dto.variantId ? { cart_id: cart!.id, variant_id: BigInt(dto.variantId) } : { cart_id: cart!.id, bundle_id: BigInt(dto.bundleId!) };
    const existing = await this.prisma.cart_items.findFirst({ where });
    const qty = (existing?.quantity ?? 0) + dto.quantity;
    if (qty > 99) throw new BadRequestException('Số lượng tối đa cho mỗi sản phẩm là 99');
    await this.assertStock(dto.variantId, dto.bundleId, qty);
    if (existing) await this.prisma.cart_items.update({ where: { id: existing.id }, data: { quantity: qty } });
    else await this.prisma.cart_items.create({ data: { ...where, quantity: dto.quantity } });
    await this.prisma.carts.update({ where: { id: cart!.id }, data: { updated_at: new Date() } });
    return this.getCart(owner);
  }

  /** Adds many items at once (recipe ingredients, meal plan, reorder). Out-of-stock items are skipped and reported. */
  async addMany(owner: CartOwner, items: AddCartItemDto[]) {
    const added: string[] = [];
    const skipped: { name: string; reason: string }[] = [];
    for (const item of items) {
      try {
        const cart = await this.findCart(owner);
        const where = item.variantId ? { cart_id: cart!.id, variant_id: BigInt(item.variantId) } : { cart_id: cart!.id, bundle_id: BigInt(item.bundleId!) };
        const existing = await this.prisma.cart_items.findFirst({ where });
        const [line] = await this.pricing.priceLines([{ variantId: item.variantId, bundleId: item.bundleId, quantity: (existing?.quantity ?? 0) + item.quantity }]);
        if (line.availableStock <= (existing?.quantity ?? 0)) {
          skipped.push({ name: line.name, reason: 'Hết hàng' });
          continue;
        }
        const qty = Math.min(line.availableStock, (existing?.quantity ?? 0) + item.quantity, 99);
        if (existing) await this.prisma.cart_items.update({ where: { id: existing.id }, data: { quantity: qty } });
        else await this.prisma.cart_items.create({ data: { ...where, quantity: qty } });
        added.push(line.name);
        if (qty < (existing?.quantity ?? 0) + item.quantity) skipped.push({ name: line.name, reason: `Chỉ còn ${line.availableStock} sản phẩm` });
      } catch (e) {
        skipped.push({ name: `#${item.variantId ?? item.bundleId}`, reason: (e as Error).message });
      }
    }
    return { added, skipped, cart: await this.getCart(owner) };
  }

  private async ownedItem(owner: CartOwner, itemId: number) {
    const cart = await this.findCart(owner, false);
    const item = cart ? await this.prisma.cart_items.findFirst({ where: { id: BigInt(itemId), cart_id: cart.id } }) : null;
    if (!item) throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
    return item;
  }

  async updateQuantity(owner: CartOwner, itemId: number, quantity: number) {
    const item = await this.ownedItem(owner, itemId);
    await this.assertStock(item.variant_id ? Number(item.variant_id) : undefined, item.bundle_id ? Number(item.bundle_id) : undefined, quantity);
    await this.prisma.cart_items.update({ where: { id: item.id }, data: { quantity } });
    return this.getCart(owner);
  }

  async removeItem(owner: CartOwner, itemId: number) {
    const item = await this.ownedItem(owner, itemId);
    await this.prisma.cart_items.delete({ where: { id: item.id } });
    return this.getCart(owner);
  }

  async clear(owner: CartOwner) {
    const cart = await this.findCart(owner, false);
    if (cart) await this.prisma.cart_items.deleteMany({ where: { cart_id: cart.id } });
    return this.getCart(owner);
  }

  async applyCoupon(owner: CartOwner, code: string) {
    const cart = await this.findCart(owner);
    const current = await this.getCart(owner);
    const res = await this.pricing.checkCoupon(code, current.summary.subtotal, owner.userId);
    if ('error' in res && res.error) throw new BadRequestException(res.error);
    await this.prisma.carts.update({ where: { id: cart!.id }, data: { coupon_id: res.coupon!.id } });
    return this.getCart(owner);
  }

  async removeCoupon(owner: CartOwner) {
    const cart = await this.findCart(owner, false);
    if (cart) await this.prisma.carts.update({ where: { id: cart.id }, data: { coupon_id: null } });
    return this.getCart(owner);
  }

  /** After login: moves guest cart items into the user's cart (quantities are summed, capped by stock). */
  async merge(userId: number, guestToken: string) {
    const guest = TOKEN_RE.test(guestToken) ? await this.prisma.carts.findFirst({ where: { session_token: guestToken, user_id: null } }) : null;
    if (guest) {
      const items = await this.prisma.cart_items.findMany({ where: { cart_id: guest.id } });
      if (items.length) {
        await this.addMany(
          { userId },
          items.map((i) => ({ variantId: i.variant_id ? Number(i.variant_id) : undefined, bundleId: i.bundle_id ? Number(i.bundle_id) : undefined, quantity: i.quantity })),
        );
      }
      await this.prisma.carts.delete({ where: { id: guest.id } });
    }
    return this.getCart({ userId });
  }

  /** Cart items for checkout (only the ones the customer selected). */
  async itemsForCheckout(owner: CartOwner, cartItemIds: number[]) {
    const cart = await this.findCart(owner, false);
    if (!cart) throw new BadRequestException('Giỏ hàng trống');
    const items = await this.prisma.cart_items.findMany({ where: { cart_id: cart.id, id: { in: cartItemIds.map((i) => BigInt(i)) } } });
    if (!items.length) throw new BadRequestException('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
    return { cart, items };
  }
}
