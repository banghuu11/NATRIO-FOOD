/**
 * NUTRIO demo data seed (run after the SQL schema + base seed):
 *   npm run db:seed            – seeds once (skips if already seeded)
 *   npm run db:seed -- --force – runs again (adds another batch of demo orders)
 *
 * Boots the Nest application context so historical orders go through the real
 * order + lifecycle services (stock reservation, points, status history...).
 */
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'node:crypto';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../modules/orders/orders.service';
import { OrderLifecycleService } from '../modules/orders/order-lifecycle.service';
import { PaymentMethodEnum } from '../modules/orders/dto/order.dto';
import { PERMISSIONS } from '../common/permissions';
import { slugify } from '../common/utils/serialize';
import { BUNDLES, CATEGORY_TREE, EXISTING_PRODUCTS, PRODUCTS } from './catalog.data';
import { PAGES, POSTS, QUIZ, RECIPES, REVIEW_TEXT } from './content.data';

const SEED_KEY = 'seed.nutrio_demo_v2';
const day = 864e5;
const today = () => new Date(new Date().toISOString().slice(0, 10));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * day);
let seedState = 42;
const rand = () => ((seedState = (seedState * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const log = (s: string) => console.log(`  • ${s}`);

async function rbac(prisma: PrismaService) {
  const descriptions: Record<string, string> = {
    'dashboard.view': 'Xem tổng quan', 'product.read': 'Xem sản phẩm', 'product.write': 'Thêm/sửa/xóa sản phẩm', 'category.write': 'Quản lý danh mục',
    'order.read': 'Xem đơn hàng', 'order.update': 'Cập nhật trạng thái đơn', 'payment.confirm': 'Xác nhận thanh toán / hoàn tiền',
    'customer.read': 'Xem khách hàng', 'customer.manage': 'Khóa/mở khóa khách hàng', 'inventory.manage': 'Quản lý kho', 'coupon.manage': 'Quản lý khuyến mãi',
    'content.manage': 'Quản lý nội dung', 'review.moderate': 'Kiểm duyệt đánh giá', 'report.view': 'Xem báo cáo', 'user.manage': 'Quản lý nhân viên & phân quyền',
  };
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permissions.upsert({ where: { code }, update: { description: descriptions[code] }, create: { code, description: descriptions[code] } });
  }
  const roles: Record<string, { name: string; description: string; perms: string[] }> = {
    admin: { name: 'Super Admin', description: 'Toàn quyền hệ thống', perms: Object.values(PERMISSIONS) },
    staff_sales: { name: 'Nhân viên bán hàng', description: 'Xử lý đơn hàng, thanh toán, khuyến mãi', perms: ['dashboard.view', 'product.read', 'order.read', 'order.update', 'payment.confirm', 'customer.read', 'coupon.manage', 'report.view'] },
    staff_warehouse: { name: 'Nhân viên kho', description: 'Nhập/xuất kho, chuẩn bị & giao hàng', perms: ['dashboard.view', 'product.read', 'inventory.manage', 'order.read', 'order.update'] },
    staff_support: { name: 'Nhân viên CSKH', description: 'Chăm sóc khách hàng, kiểm duyệt đánh giá', perms: ['dashboard.view', 'product.read', 'order.read', 'customer.read', 'review.moderate'] },
  };
  for (const [code, r] of Object.entries(roles)) {
    const role = await prisma.roles.upsert({ where: { code }, update: { name: r.name, description: r.description }, create: { code, name: r.name, description: r.description } });
    const perms = await prisma.permissions.findMany({ where: { code: { in: r.perms } } });
    await prisma.role_permissions.deleteMany({ where: { role_id: role.id } });
    await prisma.role_permissions.createMany({ data: perms.map((p) => ({ role_id: role.id, permission_id: p.id })) });
  }
  // Bronze / Silver / Gold
  await prisma.membership_tiers.update({ where: { code: 'member' }, data: { name: 'Bronze' } });
  await prisma.membership_tiers.update({ where: { code: 'silver' }, data: { name: 'Silver' } });
  await prisma.membership_tiers.update({ where: { code: 'gold' }, data: { name: 'Gold' } });
  log('Vai trò, quyền & hạng thành viên');
}

const PROVINCES: [string, string, string, string][] = [
  ['TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', 'Lê Lợi'],
  ['TP. Hồ Chí Minh', 'Quận 3', 'Phường Võ Thị Sáu', 'Nam Kỳ Khởi Nghĩa'],
  ['TP. Hồ Chí Minh', 'Quận 7', 'Phường Tân Phong', 'Nguyễn Văn Linh'],
  ['TP. Hồ Chí Minh', 'TP. Thủ Đức', 'Phường Thảo Điền', 'Xuân Thủy'],
  ['Hà Nội', 'Quận Cầu Giấy', 'Phường Dịch Vọng', 'Trần Thái Tông'],
  ['Hà Nội', 'Quận Hoàn Kiếm', 'Phường Hàng Bạc', 'Hàng Bạc'],
  ['Đà Nẵng', 'Quận Hải Châu', 'Phường Thạch Thang', 'Bạch Đằng'],
  ['Cần Thơ', 'Quận Ninh Kiều', 'Phường An Hòa', 'Mậu Thân'],
];

async function users(prisma: PrismaService) {
  const staffPass = await bcrypt.hash('Staff@123', 10);
  const userPass = await bcrypt.hash('User@123', 10);
  const staff: [string, string, string][] = [
    ['sales@nutrio.vn', 'Phạm Thu Hà (Bán hàng)', 'staff_sales'],
    ['kho@nutrio.vn', 'Võ Đức Thắng (Kho)', 'staff_warehouse'],
    ['cskh@nutrio.vn', 'Lê Mỹ Linh (CSKH)', 'staff_support'],
  ];
  for (const [email, name, role] of staff) {
    const r = await prisma.roles.findUniqueOrThrow({ where: { code: role } });
    await prisma.users.upsert({
      where: { email },
      update: {},
      create: { email, full_name: name, password_hash: staffPass, email_verified_at: new Date(), user_roles: { create: { role_id: r.id } } },
    });
  }
  const customerRole = await prisma.roles.findUniqueOrThrow({ where: { code: 'customer' } });
  const names = ['Hoàng Minh Anh', 'Đặng Thảo Vy', 'Bùi Gia Huy', 'Ngô Khánh Linh', 'Phan Quốc Bảo', 'Vũ Ngọc Mai', 'Đỗ Tuấn Kiệt', 'Trịnh Bảo Ngọc', 'Lý Hải Đăng', 'Mai Phương Thảo', 'Tạ Đức Long', 'Hồ Thanh Tâm'];
  for (const [i, name] of names.entries()) {
    const email = `${slugify(name).replace(/-/g, '.')}@example.com`;
    const gender = i % 2 === 0 ? 'male' : 'female';
    await prisma.users.upsert({
      where: { email },
      update: {},
      create: {
        email, full_name: name, phone: `09${String(10000000 + i * 7919).slice(0, 8)}`, password_hash: userPass, gender, date_of_birth: new Date(1985 + (i % 15), i % 12, 5 + i),
        email_verified_at: new Date(), created_at: addDays(new Date(), -(100 + i * 5)), user_roles: { create: { role_id: customerRole.id } },
      },
    });
  }
  const customers = await prisma.users.findMany({ where: { user_roles: { some: { role_id: customerRole.id } } }, include: { addresses: true } });
  for (const [i, c] of customers.entries()) {
    if (c.addresses.length) continue;
    const [prov, dist, ward, street] = PROVINCES[i % PROVINCES.length];
    await prisma.addresses.create({ data: { user_id: c.id, label: 'Nhà riêng', recipient_name: c.full_name, phone: c.phone || `0912${String(100000 + i).slice(-6)}`, province: prov, district: dist, ward, street: `${10 + i * 3} ${street}`, is_default: true } });
  }
  await prisma.users.update({ where: { email: 'minh@example.com' }, data: { gender: 'male' } });
  log(`Tài khoản: 3 nhân viên, ${customers.length} khách hàng`);
}

async function catalog(prisma: PrismaService) {
  // Category tree
  let order = 1;
  for (const c of CATEGORY_TREE) {
    const parent = await prisma.categories.upsert({ where: { slug: c.slug }, update: { name: c.name, description: c.description, image_url: c.image, sort_order: order, is_active: true, parent_id: null }, create: { slug: c.slug, name: c.name, description: c.description, image_url: c.image, sort_order: order } });
    order++;
    for (const [i, ch] of (c.children || []).entries()) {
      await prisma.categories.upsert({ where: { slug: ch.slug }, update: { name: ch.name, description: ch.description, image_url: ch.image, parent_id: parent.id, sort_order: i + 1, is_active: true }, create: { slug: ch.slug, name: ch.name, description: ch.description, image_url: ch.image, parent_id: parent.id, sort_order: i + 1 } });
    }
  }
  const cats = new Map((await prisma.categories.findMany()).map((c) => [c.slug, c.id]));
  const [brand, supplier, farm] = await Promise.all([prisma.brands.findFirstOrThrow({ where: { slug: 'nutrio-farm' } }), prisma.suppliers.findFirstOrThrow(), prisma.farms.findFirstOrThrow()]);
  const farmDL = (await prisma.farms.findFirst({ where: { name: 'HTX Macca Krông Năng' } })) ?? (await prisma.farms.create({ data: { name: 'HTX Macca Krông Năng', owner_name: 'Y Đhăm Niê', province: 'Đắk Lắk', address: 'Xã Ea Tóh, huyện Krông Năng', description: 'Hợp tác xã 120 hộ trồng macca theo hướng hữu cơ.' } }));
  const farmBP = (await prisma.farms.findFirst({ where: { name: 'Vườn điều Bù Đăng' } })) ?? (await prisma.farms.create({ data: { name: 'Vườn điều Bù Đăng', owner_name: 'Trần Văn Lực', province: 'Bình Phước', address: 'Xã Đức Liễu, huyện Bù Đăng', description: 'Vườn điều 30 năm tuổi, thu hoạch thủ công.' } }));
  const [wh, whCold] = await Promise.all([prisma.warehouses.findUniqueOrThrow({ where: { code: 'HCM-01' } }), prisma.warehouses.findUniqueOrThrow({ where: { code: 'HCM-COLD' } })]);

  // Re-home the 6 base products and give them real photos
  for (const [slug, e] of Object.entries(EXISTING_PRODUCTS)) {
    const p = await prisma.products.findUnique({ where: { slug } });
    if (!p) continue;
    await prisma.products.update({
      where: { id: p.id },
      data: { category_id: cats.get(e.category)!, origin_country: e.origin, storage_instruction: e.storage, usage_instruction: e.usage, ...(e.description ? { description: e.description } : {}), ...(e.short ? { short_description: e.short } : {}) },
    });
    await prisma.product_images.deleteMany({ where: { product_id: p.id } });
    await prisma.product_images.createMany({ data: e.images.map((url, i) => ({ product_id: p.id, url, alt_text: p.name, is_primary: i === 0, sort_order: i })) });
  }
  await prisma.categories.updateMany({ where: { slug: { in: ['ngu-coc-hat', 'sua-hat-do-uong', 'rau-cu-salad', 'dam-sach', 'snack-lanh-manh'] } }, data: { is_active: false } });

  const allergens = new Map((await prisma.allergens.findMany()).map((a) => [a.code, a.id]));
  const diets = new Map((await prisma.diets.findMany()).map((d) => [d.code, d.id]));
  const certs = new Map((await prisma.certifications.findMany()).map((c) => [c.code, c.id]));

  for (const [idx, sp] of PRODUCTS.entries()) {
    if (await prisma.products.findUnique({ where: { slug: sp.slug } })) continue;
    const farmId = sp.category === 'hat-macca' ? farmDL.id : sp.category === 'hat-dieu' ? farmBP.id : farm.id;
    const p = await prisma.products.create({
      data: {
        category_id: cats.get(sp.category)!, brand_id: brand.id, supplier_id: supplier.id, farm_id: farmId, name: sp.name, slug: sp.slug,
        short_description: sp.short, description: sp.description, origin_country: sp.origin, storage_instruction: sp.storage, usage_instruction: sp.usage,
        shelf_life_days: sp.shelfLifeDays, status: 'active', is_featured: !!sp.featured, created_at: addDays(new Date(), -(80 - idx * 2)),
        meta_title: `${sp.name} | NUTRIO`, meta_description: sp.short,
      },
    });
    for (const [vi, v] of sp.variants.entries()) {
      const variant = await prisma.product_variants.create({
        data: { product_id: p.id, sku: v.sku, name: v.name, net_weight_g: v.g, price: v.price, compare_at_price: v.compare ?? null, cost_price: v.cost, is_default: vi === 0, reorder_level: v.reorder ?? 10, unit_label: v.unit ?? 'gói' },
      });
      const warehouse = sp.slug.startsWith('sua-hat') ? whCold : wh;
      const lots: { qty: number; exp: number; tag: string }[] = [{ qty: v.stock, exp: v.expiryDays, tag: 'A' }];
      if (vi === 0 && idx % 4 === 0 && v.expiryDays > 40) lots.push({ qty: 15, exp: 18 + (idx % 10), tag: 'OLD' }); // near-expiry lot for FEFO / alert demo
      for (const lot of lots) {
        const batch = await prisma.product_batches.create({
          data: {
            variant_id: variant.id, farm_id: farmId, supplier_id: supplier.id, batch_code: `LOT-${v.sku}-${lot.tag}`, qr_code: `NUTRIO-${randomBytes(5).toString('hex').toUpperCase()}`,
            harvested_on: addDays(today(), -60), manufactured_on: addDays(today(), lot.tag === 'OLD' ? -150 : -25), expires_on: addDays(today(), lot.exp), received_on: addDays(today(), lot.tag === 'OLD' ? -140 : -20),
            quantity_received: lot.qty, unit_cost: v.cost, lab_result_note: 'Đạt chỉ tiêu vi sinh & aflatoxin theo QCVN 8-1:2011/BYT',
          },
        });
        const inv = await prisma.inventory.create({ data: { warehouse_id: warehouse.id, batch_id: batch.id, quantity_on_hand: lot.qty } });
        await prisma.stock_movements.create({ data: { batch_id: batch.id, warehouse_id: inv.warehouse_id, movement_type: 'purchase_in', quantity: lot.qty, reference_type: 'seed', note: 'Nhập kho ban đầu', created_at: addDays(new Date(), lot.tag === 'OLD' ? -140 : -20) } });
      }
    }
    await prisma.product_images.createMany({ data: sp.images.map((url, i) => ({ product_id: p.id, url, alt_text: sp.name, is_primary: i === 0, sort_order: i })) });
    const [kcal, prot, carb, sugar, fiber, fat, sat, sodium] = sp.n;
    await prisma.nutrition_facts.create({ data: { product_id: p.id, serving_size_g: sp.serving, calories_kcal: kcal, protein_g: prot, carbohydrate_g: carb, sugar_g: sugar, fiber_g: fiber, fat_g: fat, saturated_fat_g: sat, sodium_mg: sodium } });
    if (sp.allergens?.length) await prisma.product_allergens.createMany({ data: sp.allergens.map(([code, relation]) => ({ product_id: p.id, allergen_id: allergens.get(code)!, relation })) });
    await prisma.product_diets.createMany({ data: sp.diets.filter((d) => diets.has(d)).map((d) => ({ product_id: p.id, diet_id: diets.get(d)! })) });
    if (sp.certs?.length) await prisma.product_certifications.createMany({ data: sp.certs.map((c) => ({ product_id: p.id, certification_id: certs.get(c)!, certificate_number: `${c.toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`, issued_on: addDays(today(), -200), expires_on: addDays(today(), 500) })) });
    for (const [i, [name, pct]] of sp.ingredients.entries()) {
      const ing = await prisma.ingredients.upsert({ where: { name }, update: {}, create: { name } });
      await prisma.product_ingredients.create({ data: { product_id: p.id, ingredient_id: ing.id, percentage: pct ?? null, sort_order: i } });
    }
  }
  // Healthier-alternative links (Smart Swap)
  const swaps: [string, string, string][] = [
    ['hat-dieu-rang-toi-ot', 'hat-dieu-say-moc', 'Ít natri hơn gần 30 lần'],
    ['granola-socola-den', 'granola-keto-khong-yen-mach', 'Ít đường và tinh bột hơn'],
    ['trail-mix-hat-trai-cay-say', 'mix-5-loai-hat-dinh-duong', 'Ít đường, nhiều đạm hơn'],
    ['granola-sieu-hat-mat-ong', 'yen-mach-can-vo-uc', 'Không đường, nhiều chất xơ hơn'],
  ];
  for (const [a, b, reason] of swaps) {
    const [pa, pb] = await Promise.all([prisma.products.findUnique({ where: { slug: a } }), prisma.products.findUnique({ where: { slug: b } })]);
    if (pa && pb) await prisma.product_substitutes.upsert({ where: { product_id_substitute_id: { product_id: pa.id, substitute_id: pb.id } }, update: {}, create: { product_id: pa.id, substitute_id: pb.id, reason } });
  }
  log(`Danh mục (${cats.size}) & ${PRODUCTS.length + 6} sản phẩm kèm lô hàng, tồn kho, dinh dưỡng`);
}

async function promotions(prisma: PrismaService) {
  const sku = async (s: string) => (await prisma.product_variants.findUniqueOrThrow({ where: { sku: s } })).id;
  for (const b of BUNDLES) {
    const slug = slugify(b.name);
    if (await prisma.bundles.findUnique({ where: { slug } })) continue;
    const bundle = await prisma.bundles.create({ data: { name: b.name, slug, description: b.description, image_url: b.image, price: b.price } });
    for (const [s, q] of b.items) await prisma.bundle_items.create({ data: { bundle_id: bundle.id, variant_id: await sku(s), quantity: q } });
  }
  await prisma.bundles.updateMany({ where: { slug: 'combo-an-sang-eat-clean' }, data: { image_url: '/images/recipes/recipe-breakfast.jpg', description: 'Yến mạch cán dẹt + Granola không đường + Hạt chia – đủ 2 tuần bữa sáng Eat Clean.' } });

  const gold = await prisma.membership_tiers.findUniqueOrThrow({ where: { code: 'gold' } });
  const silver = await prisma.membership_tiers.findUniqueOrThrow({ where: { code: 'silver' } });
  const coupons: Prisma.couponsCreateInput[] = [
    { code: 'NUTRIO50K', description: 'Giảm 50.000đ cho đơn từ 500.000đ', discount_type: 'fixed_amount', discount_value: 50000, min_order_amount: 500000, usage_limit: 300, usage_limit_per_user: 3, ends_at: addDays(new Date(), 60) },
    { code: 'KETO20', description: 'Giảm 20% tối đa 60.000đ cho đơn từ 300.000đ', discount_type: 'percent', discount_value: 20, max_discount_amount: 60000, min_order_amount: 300000, usage_limit: 200, usage_limit_per_user: 2, ends_at: addDays(new Date(), 30) },
    { code: 'SILVER8', description: 'Thành viên Silver: giảm 8% tối đa 80.000đ', discount_type: 'percent', discount_value: 8, max_discount_amount: 80000, min_order_amount: 200000, usage_limit_per_user: 5, membership_tiers: { connect: { id: silver.id } }, ends_at: addDays(new Date(), 90) },
    { code: 'GOLD15', description: 'Đặc quyền Gold: giảm 15% tối đa 150.000đ', discount_type: 'percent', discount_value: 15, max_discount_amount: 150000, min_order_amount: 300000, usage_limit_per_user: 5, membership_tiers: { connect: { id: gold.id } }, ends_at: addDays(new Date(), 90) },
    { code: 'HETHAN10', description: 'Mã đã hết hạn (minh họa)', discount_type: 'percent', discount_value: 10, max_discount_amount: 30000, min_order_amount: 0, starts_at: addDays(new Date(), -60), ends_at: addDays(new Date(), -5) },
  ];
  for (const c of coupons) {
    if (!(await prisma.coupons.findUnique({ where: { code: c.code } }))) await prisma.coupons.create({ data: c });
  }
  await prisma.coupons.updateMany({ where: { code: 'GIAM30K' }, data: { usage_limit_per_user: 5 } });

  const flash = await prisma.flash_sales.create({ data: { name: 'Flash Sale cuối tuần – Hạt cao cấp', starts_at: addDays(new Date(), -1), ends_at: addDays(new Date(), 3) } });
  for (const [s, price, limit] of [['MAC-DL-250', 159000, 40], ['WAL-US-250', 139000, 40], ['MIX5-300', 149000, 50]] as [string, number, number][]) {
    await prisma.flash_sale_items.create({ data: { flash_sale_id: flash.id, variant_id: await sku(s), sale_price: price, quantity_limit: limit } });
  }
  log('Combo, mã giảm giá, flash sale');
}

async function content(prisma: PrismaService) {
  const variantBySku = new Map((await prisma.product_variants.findMany()).map((v) => [v.sku, v]));
  const diets = new Map((await prisma.diets.findMany()).map((d) => [d.code, d.id]));
  for (const r of RECIPES) {
    const slug = slugify(r.title);
    const existing = await prisma.recipes.findUnique({ where: { slug } });
    const data = {
      title: r.title, description: r.description, image_url: r.image, prep_minutes: r.prep, cook_minutes: r.cook, servings: r.servings, difficulty: r.difficulty,
      calories_per_serving: r.kcal, protein_g: r.p, carbohydrate_g: r.c, fat_g: r.f, meal_types: r.meals, is_published: true,
    };
    if (existing) {
      await prisma.recipes.update({ where: { id: existing.id }, data });
      continue;
    }
    const rec = await prisma.recipes.create({ data: { ...data, slug } });
    for (const [i, [name, qty, unit, sku]] of r.ingredients.entries()) {
      const v = sku ? variantBySku.get(sku) : undefined;
      await prisma.recipe_ingredients.create({ data: { recipe_id: rec.id, ingredient_name: name, quantity: qty, unit, variant_id: v?.id ?? null, product_id: v?.product_id ?? null, sort_order: i } });
    }
    await prisma.recipe_steps.createMany({ data: r.steps.map((s, i) => ({ recipe_id: rec.id, step_number: i + 1, instruction: s })) });
    await prisma.recipe_diets.createMany({ data: r.diets.filter((d) => diets.has(d)).map((d) => ({ recipe_id: rec.id, diet_id: diets.get(d)! })) });
  }

  // Quiz: retire the 3-question demo quiz, add the 5-question advisor
  if (!(await prisma.quiz_questions.findFirst({ where: { question_text: QUIZ[0].q } }))) {
    await prisma.quiz_questions.updateMany({ data: { is_active: false } });
    const cats = new Map((await prisma.categories.findMany()).map((c) => [c.slug, c.id]));
    const allergens = new Map((await prisma.allergens.findMany()).map((a) => [a.code, a.id]));
    for (const [qi, q] of QUIZ.entries()) {
      const question = await prisma.quiz_questions.create({ data: { question_text: q.q, is_multiple: q.multiple, sort_order: 10 + qi } });
      for (const [oi, o] of q.options.entries()) {
        const opt = await prisma.quiz_options.create({ data: { question_id: question.id, option_text: o.text, icon: o.icon, sort_order: oi, meta: (o.meta || {}) as Prisma.InputJsonValue } });
        for (const [code, w] of o.diets || []) if (diets.has(code)) await prisma.quiz_option_effects.create({ data: { option_id: opt.id, effect_type: 'boost_diet', diet_id: diets.get(code), weight: w } });
        for (const [slug, w] of o.categories || []) if (cats.has(slug)) await prisma.quiz_option_effects.create({ data: { option_id: opt.id, effect_type: 'boost_category', category_id: cats.get(slug), weight: w } });
        for (const code of o.allergens || []) await prisma.quiz_option_effects.create({ data: { option_id: opt.id, effect_type: 'exclude_allergen', allergen_id: allergens.get(code) } });
      }
    }
  }

  // Blog
  const admin = await prisma.users.findUniqueOrThrow({ where: { email: 'admin@nutrio.vn' } });
  const blogCats = new Map((await prisma.blog_categories.findMany()).map((c) => [c.slug, c.id]));
  for (const [i, p] of POSTS.entries()) {
    const slug = slugify(p.title);
    if (await prisma.blog_posts.findUnique({ where: { slug } })) continue;
    await prisma.blog_posts.create({ data: { title: p.title, slug, summary: p.summary, content: p.content, cover_image_url: p.cover, category_id: blogCats.get(p.category), author_id: admin.id, expert_reviewer: p.reviewer, is_published: true, published_at: addDays(new Date(), -(3 + i * 6)), view_count: 120 + i * 37 } });
  }
  await prisma.blog_posts.updateMany({
    where: { slug: 'yen-mach-an-the-nao-cho-dung' },
    data: { cover_image_url: '/images/products/oats-1.jpg', published_at: addDays(new Date(), -40), content: 'Yến mạch là nguồn tinh bột phức hợp giàu beta-glucan – loại chất xơ hòa tan giúp no lâu và hỗ trợ giảm cholesterol.\n\n## Chọn loại nào?\n- Yến mạch cán dẹt (rolled oats): nấu 5 phút, giữ độ dai.\n- Yến mạch cán vỡ (quick oats): chín trong 2–3 phút, hợp làm cháo cho trẻ.\n- Yến mạch nguyên hạt cắt (steel-cut): ít chế biến nhất, cần nấu 20 phút.\n\n## Khẩu phần\n40–50 g yến mạch khô cho một bữa sáng (khoảng 150–190 kcal). Kết hợp thêm đạm (sữa chua, trứng) và chất béo tốt (hạt) để bữa ăn cân bằng.' },
  });

  for (const pg of PAGES) await prisma.cms_pages.upsert({ where: { slug: pg.slug }, update: {}, create: pg });

  // Banners
  await prisma.banners.updateMany({ where: { image_url: { contains: 'placehold.co' } }, data: { is_active: false } });
  if (!(await prisma.banners.findFirst({ where: { position: 'home_hero', is_active: true } }))) {
    await prisma.banners.createMany({
      data: [
        { title: 'Dinh dưỡng chuẩn cho mỗi ngày', subtitle: 'Hạt Macca, Hạnh nhân, Óc chó sấy mộc – định lượng 30 g theo nhu cầu calo của riêng bạn.', cta_label: 'Mua ngay', image_url: '/images/products/mixed-3.jpg', link_url: '/products', position: 'home_hero', sort_order: 1 },
        { title: 'Tính TDEE miễn phí', subtitle: 'Biết chính xác bạn cần bao nhiêu calo, đạm, chất béo – và nhận gợi ý sản phẩm phù hợp.', cta_label: 'Tạo hồ sơ sức khỏe', image_url: '/images/banners/hero-harvest.jpg', link_url: '/health', position: 'home_hero', sort_order: 2 },
        { title: 'Thực đơn 7 ngày thông minh', subtitle: 'Tự động lên thực đơn theo mục tiêu calo, thêm toàn bộ nguyên liệu vào giỏ chỉ với 1 chạm.', cta_label: 'Tạo thực đơn', image_url: '/images/banners/hero-eating-healthy.jpg', link_url: '/meal-plan', position: 'home_hero', sort_order: 3 },
        { title: 'Combo Keto khởi đầu – tiết kiệm 12%', subtitle: 'Granola Keto, Mix hạt Keto & Hạt chia', cta_label: 'Xem combo', image_url: '/images/products/macadamia-3.jpg', link_url: '/combos', position: 'home_promo', sort_order: 1 },
        { title: 'Giao hàng định kỳ – giảm đến 10%', subtitle: 'Không bao giờ hết hạt, tạm dừng bất cứ lúc nào', cta_label: 'Tìm hiểu', image_url: '/images/products/mixed-4.jpg', link_url: '/account/subscriptions', position: 'home_promo', sort_order: 2 },
      ],
    });
  }
  await prisma.settings.upsert({
    where: { key: 'store' },
    update: { value: { name: 'NUTRIO Food', hotline: '1900 6868', email: 'hello@nutrio.vn', address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh', hours: '8:00 – 21:00 (T2 – CN)', facebook: 'https://facebook.com', instagram: 'https://instagram.com', tiktok: 'https://tiktok.com', youtube: 'https://youtube.com' } },
    create: { key: 'store', value: {} },
  });
  log(`${RECIPES.length} công thức, quiz 5 câu, ${POSTS.length} bài viết, ${PAGES.length} trang nội dung, banner`);
}

async function orders(app: INestApplicationContext, prisma: PrismaService) {
  const ordersSvc = app.get(OrdersService);
  const lifecycle = app.get(OrderLifecycleService);
  const admin = await prisma.users.findUniqueOrThrow({ where: { email: 'admin@nutrio.vn' } });
  const customers = await prisma.users.findMany({ where: { user_roles: { some: { roles: { code: 'customer' } } } }, include: { addresses: true } });
  const variants = await prisma.product_variants.findMany({ where: { is_active: true, products: { status: 'active', deleted_at: null } }, select: { id: true, price: true } });
  const bundles = await prisma.bundles.findMany({ where: { is_active: true } });
  const N = 140;
  let created = 0;

  for (let i = 0; i < N; i++) {
    const daysAgo = Math.floor(Math.pow(rand(), 1.4) * 90);
    const guest = rand() < 0.12;
    const cust = pick(customers);
    const addr = cust.addresses[0];
    const lines = new Map<string, { variantId?: number; bundleId?: number; quantity: number }>();
    const n = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const v = pick(variants);
      lines.set(`v${v.id}`, { variantId: Number(v.id), quantity: 1 + Math.floor(rand() * 2) });
    }
    if (rand() < 0.1 && bundles.length) {
      const b = pick(bundles);
      lines.set(`b${b.id}`, { bundleId: Number(b.id), quantity: 1 });
    }
    const pm = rand() < 0.62 ? PaymentMethodEnum.COD : PaymentMethodEnum.BANK_TRANSFER;
    const coupon = rand() < 0.2 ? pick(['GIAM30K', 'FREESHIP', 'NUTRIO50K']) : undefined;
    const [prov, dist, ward, street] = pick(PROVINCES);
    const dto = {
      recipientName: guest ? pick(['Nguyễn Văn Tùng', 'Trần Thị Hồng', 'Lê Hoàng Nam', 'Phạm Mai Anh']) : cust.full_name,
      phone: guest ? `0938${String(100000 + i * 37).slice(-6)}` : addr?.phone || '0912345678',
      email: guest ? `khach${i}@example.com` : undefined,
      province: guest ? prov : addr?.province || prov,
      district: guest ? dist : addr?.district || dist,
      ward: guest ? ward : addr?.ward || ward,
      street: guest ? `${i + 1} ${street}` : addr?.street || `${i + 1} ${street}`,
      paymentMethod: pm,
      shippingMethodId: undefined as number | undefined,
      couponCode: coupon,
      idempotencyKey: `seed-${randomUUID()}`,
    };
    let order: Awaited<ReturnType<OrdersService['placeOrder']>> | null = null;
    for (const attempt of [dto, { ...dto, couponCode: undefined, idempotencyKey: `seed-${randomUUID()}` }]) {
      try {
        order = await ordersSvc.placeOrder({ owner: guest ? {} : { userId: Number(cust.id) }, dto: attempt, lines: [...lines.values()] });
        break;
      } catch {
        /* retry without coupon */
      }
    }
    if (!order) continue;
    created++;

    // Decide the final status by age
    const r = rand();
    const path: ('confirmed' | 'processing' | 'shipping' | 'delivered' | 'completed' | 'cancelled' | 'returned')[] =
      daysAgo < 1
        ? r < 0.5 ? [] : r < 0.8 ? ['confirmed'] : ['confirmed', 'processing']
        : daysAgo < 3
          ? r < 0.3 ? ['confirmed', 'processing'] : r < 0.8 ? ['confirmed', 'processing', 'shipping'] : ['confirmed', 'processing', 'shipping', 'delivered']
          : r < 0.09 ? ['cancelled'] : r < 0.12 ? ['confirmed', 'cancelled'] : r < 0.16 ? ['confirmed', 'processing', 'shipping', 'delivered', 'returned'] : r < 0.22 ? ['confirmed', 'processing', 'shipping', 'delivered', 'completed'] : ['confirmed', 'processing', 'shipping', 'delivered'];
    try {
      if (pm === PaymentMethodEnum.BANK_TRANSFER && path.length && path[0] !== 'cancelled') await lifecycle.markPaid(order.id, { actorId: Number(admin.id), gateway: 'manual' });
      for (const s of path) await lifecycle.transition(order.id, s, { actorId: Number(admin.id), note: s === 'cancelled' ? 'Khách đổi ý' : s === 'returned' ? 'Sản phẩm bị móp hộp khi vận chuyển' : undefined, reason: s === 'cancelled' ? 'Khách đổi ý' : undefined });
    } catch (e) {
      console.warn(`    ! ${order.order_number}: ${(e as Error).message}`);
    }

    // Back-date timestamps so charts show history
    const t0 = new Date(Date.now() - daysAgo * day - Math.floor(rand() * 10 + 1) * 3600e3);
    const steps = Math.max(1, path.length);
    const span = Math.min(Date.now() - t0.getTime(), steps * 30 * 3600e3);
    const at = (k: number) => new Date(t0.getTime() + (span * k) / (steps + 0.5));
    const hist = await prisma.order_status_history.findMany({ where: { order_id: order.id }, orderBy: { id: 'asc' } });
    for (const [k, h] of hist.entries()) await prisma.order_status_history.update({ where: { id: h.id }, data: { changed_at: at(k) } });
    const idxOf = (s: string) => path.indexOf(s as any) + 1;
    await prisma.$executeRaw`UPDATE orders SET placed_at = ${t0}, created_at = ${t0},
      confirmed_at = CASE WHEN confirmed_at IS NOT NULL THEN ${at(idxOf('confirmed'))}::timestamptz END,
      shipped_at = CASE WHEN shipped_at IS NOT NULL THEN ${at(idxOf('shipping'))}::timestamptz END,
      delivered_at = CASE WHEN delivered_at IS NOT NULL THEN ${at(idxOf('delivered'))}::timestamptz END,
      completed_at = CASE WHEN completed_at IS NOT NULL THEN ${at(idxOf('completed'))}::timestamptz END,
      cancelled_at = CASE WHEN cancelled_at IS NOT NULL THEN ${at(idxOf('cancelled'))}::timestamptz END
      WHERE id = ${order.id}`;
    await prisma.$executeRaw`UPDATE payments SET created_at = ${t0}, paid_at = CASE WHEN paid_at IS NOT NULL THEN ${at(Math.max(1, idxOf('delivered')))}::timestamptz END WHERE order_id = ${order.id}`;
    await prisma.$executeRaw`UPDATE stock_movements SET created_at = ${at(idxOf('shipping') || 1)} WHERE reference_type = 'order' AND reference_id = ${order.id}`;
    await prisma.$executeRaw`UPDATE loyalty_transactions SET created_at = ${at(idxOf('delivered') || 1)} WHERE order_id = ${order.id}`;
    await prisma.$executeRaw`UPDATE shipments SET created_at = ${at(idxOf('shipping') || 1)}, picked_up_at = ${at(idxOf('shipping') || 1)} WHERE order_id = ${order.id}`;
    await prisma.$executeRaw`UPDATE notifications SET created_at = ${t0}, is_read = true WHERE (data->>'orderId')::bigint = ${order.id}`;
  }
  log(`${created} đơn hàng lịch sử (90 ngày) qua quy trình đặt hàng thật`);
}

async function reviews(prisma: PrismaService) {
  const items = await prisma.order_items.findMany({
    where: { product_id: { not: null }, reviews: { none: {} }, orders: { status: { in: ['delivered', 'completed'] }, user_id: { not: null } } },
    include: { orders: true },
  });
  const voters = await prisma.users.findMany({ where: { user_roles: { some: { roles: { code: 'customer' } } } }, select: { id: true } });
  const recipeImgs = ['/images/recipes/recipe-breakfast.jpg', '/images/recipes/recipe-chia-jars.jpg', '/images/recipes/recipe-yogurt-jar.jpg'];
  let count = 0;
  for (const it of items) {
    if (rand() > 0.58) continue;
    const roll = rand();
    const rating = roll < 0.56 ? 5 : roll < 0.84 ? 4 : roll < 0.94 ? 3 : roll < 0.97 ? 2 : 1;
    const created = new Date(Math.min(Date.now() - 3600e3, (it.orders.delivered_at?.getTime() ?? Date.now()) + (1 + rand() * 4) * day));
    const r = await prisma.reviews.create({
      data: {
        product_id: it.product_id!, user_id: it.orders.user_id!, order_item_id: it.id, rating, content: pick(REVIEW_TEXT[rating]), title: rating >= 4 ? pick(['Rất hài lòng', 'Sẽ mua lại', 'Ngon & chất lượng', 'Đáng tiền']) : rating === 3 ? 'Tạm ổn' : 'Chưa hài lòng',
        is_verified_purchase: true, status: 'approved', created_at: created,
        ...(count % 9 === 0 && rating >= 4 ? { review_media: { create: [{ url: pick(recipeImgs) }] } } : {}),
      },
    });
    for (const v of voters) if (v.id !== it.orders.user_id && rand() < 0.08) await prisma.review_votes.create({ data: { review_id: r.id, user_id: v.id } }).catch(() => undefined);
    count++;
  }
  const spam = await prisma.reviews.findFirst({ where: { rating: { lte: 2 } }, orderBy: { id: 'desc' } });
  if (spam) await prisma.reviews.update({ where: { id: spam.id }, data: { status: 'pending', content: 'Liên hệ zalo 09xx để mua giá rẻ hơn!!!' } });
  log(`${count} đánh giá từ khách đã mua (Verified Buyer)`);
}

async function extras(prisma: PrismaService) {
  const lan = await prisma.users.findUniqueOrThrow({ where: { email: 'lan@example.com' }, include: { addresses: true } });
  await prisma.users.update({ where: { id: lan.id }, data: { gender: 'female' } });
  await prisma.$executeRaw`UPDATE health_profiles SET updated_at = now() WHERE user_id = ${lan.id}`;
  for (const slug of ['nhan-oc-cho-vang-my', 'hat-macca-dak-lak-nut-vo', 'granola-keto-khong-yen-mach', 'hop-qua-6-loai-hat-cao-cap']) {
    const p = await prisma.products.findUnique({ where: { slug }, include: { product_variants: { where: { is_default: true } } } });
    if (!p) continue;
    await prisma.wishlists.upsert({ where: { user_id_product_id: { user_id: lan.id, product_id: p.id } }, update: {}, create: { user_id: lan.id, product_id: p.id } });
    await prisma.product_alerts.upsert({
      where: { user_id_product_id_alert_type: { user_id: lan.id, product_id: p.id, alert_type: 'price_drop' } },
      update: {},
      create: { user_id: lan.id, product_id: p.id, alert_type: 'price_drop', target_price: p.product_variants[0]?.price },
    });
  }
  const plan = await prisma.subscription_plans.findFirstOrThrow({ where: { frequency: 'weekly' } });
  if (!(await prisma.subscriptions.findFirst({ where: { user_id: lan.id } })) && lan.addresses[0]) {
    const [daily, gra] = await Promise.all([prisma.product_variants.findUniqueOrThrow({ where: { sku: 'MIX5-300' } }), prisma.product_variants.findUniqueOrThrow({ where: { sku: 'GRA-HONEY-300' } })]);
    await prisma.subscriptions.create({
      data: { user_id: lan.id, plan_id: plan.id, address_id: lan.addresses[0].id, next_delivery_date: addDays(today(), 3), last_delivery_date: addDays(today(), -4), subscription_items: { create: [{ variant_id: daily.id, quantity: 1 }, { variant_id: gra.id, quantity: 1 }] } },
    });
  }
  await prisma.notifications.create({ data: { user_id: lan.id, type: 'price_drop', title: 'Nhân óc chó vàng Mỹ đang Flash Sale!', body: 'Chỉ còn 139.000đ cho túi 250g – sản phẩm trong danh sách yêu thích của bạn.', data: { productSlug: 'nhan-oc-cho-vang-my' } } });
  const searches = ['hạt macca', 'granola', 'keto', 'hạnh nhân', 'óc chó', 'giàu đạm', 'hạt điều', 'ít calo'];
  for (const [i, q] of searches.entries()) for (let k = 0; k < 8 - i; k++) await prisma.search_logs.create({ data: { query: q, result_count: 5 } });
  log('Wishlist, giao hàng định kỳ, thông báo, lịch sử tìm kiếm');
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const prisma = app.get(PrismaService);
  try {
    const done = await prisma.settings.findUnique({ where: { key: SEED_KEY } });
    const force = process.argv.includes('--force');
    console.log('🌱 Seeding NUTRIO demo data...');
    if (!done) {
      await rbac(prisma);
      await users(prisma);
      await catalog(prisma);
      await promotions(prisma);
      await content(prisma);
    } else if (!force) {
      console.log('✅ Demo data already seeded (use --force to add more demo orders).');
      return;
    }
    await orders(app, prisma);
    await reviews(prisma);
    if (!done) await extras(prisma);
    await prisma.settings.upsert({ where: { key: SEED_KEY }, update: { value: { at: new Date().toISOString() } }, create: { key: SEED_KEY, value: { at: new Date().toISOString() }, description: 'Demo seed marker' } });
    console.log('✅ Done.');
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
