// End-to-end API checks for NUTRIO (needs DB + API running on :5001 and the demo seed).
// Usage: npm run test:e2e   – test data it creates is tagged (TEST-*, e2e-*, guest-e2e-*) and removed by npm run db:cleanup-test -- --apply
const B = process.env.API_URL || 'http://localhost:5001/api/v1';
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
async function call(method, path, { token, body, cart, raw } = {}) {
  const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(cart ? { 'x-cart-token': cart } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (raw) return r;
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
const login = async (email, password) => (await call('POST', '/auth/login', { body: { email, password } })).j?.accessToken;

for (let i = 0; i < 30; i++) { try { await fetch(B + '/health'); break; } catch { await new Promise((r) => setTimeout(r, 1000)); } }

const admin = await login('admin@nutrio.vn', 'Admin@123');
const sales = await login('sales@nutrio.vn', 'Staff@123');
const kho = await login('kho@nutrio.vn', 'Staff@123');
const cskh = await login('cskh@nutrio.vn', 'Staff@123');
const lan = await login('lan@example.com', 'User@123');
ok(admin && sales && kho && cskh && lan, 'Login all demo roles');
ok((await call('POST', '/auth/login', { body: { email: 'lan@example.com', password: 'wrong' } })).s === 401, 'Wrong password rejected');

// ---- RBAC ----
ok((await call('GET', '/admin/dashboard', { token: lan })).s === 403, 'Customer blocked from admin API');
ok((await call('GET', '/admin/dashboard')).s === 401, 'Anonymous blocked from admin API');
ok((await call('GET', '/admin/promotions/coupons', { token: kho })).s === 403, 'Warehouse staff cannot manage coupons');
ok((await call('GET', '/admin/inventory/stock', { token: kho })).s === 200, 'Warehouse staff can view stock');
ok((await call('GET', '/admin/inventory/stock', { token: sales })).s === 403, 'Sales staff cannot access inventory');
ok((await call('GET', '/admin/reviews', { token: cskh })).s === 200, 'Support staff can moderate reviews');
ok((await call('PATCH', '/admin/orders/1/status', { token: cskh, body: { status: 'confirmed' } })).s === 403, 'Support staff cannot change order status');
ok((await call('GET', '/admin/staff', { token: sales })).s === 403, 'Sales staff cannot manage staff');

// ---- Admin dashboard / reports ----
const dash = await call('GET', '/admin/dashboard', { token: admin });
ok(dash.s === 200 && dash.j.kpis.orders > 0 && dash.j.revenueSeries.length === 30, 'Dashboard KPIs & 30-day series', `revenue=${dash.j?.kpis?.revenue}`);
const xl = await call('GET', '/admin/reports/export', { token: admin, raw: true });
ok(xl.status === 200 && (xl.headers.get('content-type') || '').includes('spreadsheet'), 'Report Excel export');
const xl2 = await call('GET', '/admin/orders/export', { token: sales, raw: true });
ok(xl2.status === 200, 'Orders Excel export (sales)');

// ---- Product create + receive stock ----
const meta = (await call('GET', '/admin/catalog/meta', { token: admin })).j;
const sku = `TEST-${Date.now().toString(36).toUpperCase()}`;
const created = await call('POST', '/admin/products', { token: admin, body: {
  name: 'Hạt test E2E', categoryId: meta.categories.find((c) => c.parentId).id, status: 'active', images: [{ url: '/images/products/mixed-2.jpg' }],
  variants: [{ sku, name: 'Túi 100g', netWeightG: 100, price: 50000, compareAtPrice: 60000, isDefault: true }],
  nutrition: { caloriesKcal: 600, proteinG: 20, carbG: 20, fatG: 50, sugarG: 3, fiberG: 8, saturatedFatG: 5, sodiumMg: 5 }, allergens: [{ code: 'tree_nut', relation: 'contains' }], diets: ['keto'] } });
ok(created.s === 201 && created.j.nutriScoreGrade, 'Create product (Nutri-Score computed)', `grade=${created.j?.nutriScoreGrade}`);
const badPrice = await call('POST', '/admin/products', { token: admin, body: { name: 'Sai giá', categoryId: 1, status: 'draft', variants: [{ sku: sku + 'X', name: 'x', netWeightG: 100, price: 50000, compareAtPrice: 1000 }] } });
ok(badPrice.s === 400, 'Validation: compare price below price rejected');
const vId = created.j.variants[0].id;
const wh = meta.warehouses[0].id;
const rec = await call('POST', '/admin/inventory/receive', { token: kho, body: { variantId: vId, warehouseId: wh, quantity: 5, expiresOn: new Date(Date.now() + 200 * 864e5).toISOString().slice(0, 10) } });
ok(rec.s === 201, 'Warehouse receives stock', rec.j?.message);

// ---- Customer: cart beyond stock, order with points ----
const add6 = await call('POST', '/cart/items', { token: lan, body: { variantId: vId, quantity: 6 } });
ok(add6.s === 400, 'Cannot add more than available stock', add6.j?.message);
await call('DELETE', '/cart', { token: lan });
const cart = (await call('POST', '/cart/items', { token: lan, body: { variantId: vId, quantity: 3 } })).j;
const item = cart.items[0];
const loyaltyBefore = (await call('GET', '/account/loyalty', { token: lan })).j;
const quote = (await call('POST', '/checkout/quote', { token: lan, body: { cartItemIds: [item.id], pointsToUse: 50 } })).j;
ok(quote.summary.pointsUsed === Math.min(50, quote.summary.maxPointsUsable), 'Quote applies points', `used=${quote.summary.pointsUsed}`);
const idem = `e2e-${Date.now()}-abcdefghij`;
const orderBody = { cartItemIds: [item.id], recipientName: 'Nguyễn Thị Lan', phone: '0900000002', province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé', street: '12 Nguyễn Huệ', paymentMethod: 'cod', pointsToUse: quote.summary.pointsUsed, idempotencyKey: idem };
const order = await call('POST', '/orders', { token: lan, body: orderBody });
ok(order.s === 201, 'Place order with loyalty points (trigger fix)', order.j?.message || JSON.stringify(order.j));
const dup = await call('POST', '/orders', { token: lan, body: orderBody });
ok(dup.j?.order?.id === order.j?.order?.id, 'Duplicate submit returns same order (idempotent)');
const loyaltyAfter = (await call('GET', '/account/loyalty', { token: lan })).j;
ok(loyaltyAfter.pointsBalance === loyaltyBefore.pointsBalance - quote.summary.pointsUsed, 'Points deducted', `${loyaltyBefore.pointsBalance} → ${loyaltyAfter.pointsBalance}`);
const oid = order.j.order.id;
let stock = (await call('GET', '/admin/inventory/stock', { token: kho, })).j.find((r) => r.variantId === vId);
ok(stock.reserved === 3 && stock.available === 2, 'Stock reserved on order', `reserved=${stock.reserved}`);

// ---- Lifecycle ----
ok((await call('PATCH', `/admin/orders/${oid}/status`, { token: sales, body: { status: 'shipping' } })).s === 400, 'Invalid transition pending→shipping rejected');
for (const s of ['confirmed', 'processing', 'shipping']) await call('PATCH', `/admin/orders/${oid}/status`, { token: kho, body: { status: s } });
stock = (await call('GET', '/admin/inventory/stock', { token: kho })).j.find((r) => r.variantId === vId);
ok(stock.onHand === 2 && stock.reserved === 0, 'Stock deducted when shipping', `onHand=${stock.onHand}`);
ok((await call('POST', `/orders/${oid}/cancel`, { token: lan, body: { reason: 'test' } })).s === 400, 'Customer cannot cancel shipped order');
const del = await call('PATCH', `/admin/orders/${oid}/status`, { token: sales, body: { status: 'delivered' } });
ok(del.j?.paymentStatus === 'paid', 'COD marked paid on delivery');
const elig = (await call('GET', '/reviews/eligible', { token: lan })).j.find((e) => e.productId === created.j.id);
const rv = await call('POST', '/reviews', { token: lan, body: { orderItemId: elig.orderItemId, rating: 5, content: 'Hạt rất ngon, giao hàng nhanh.' } });
ok(rv.s === 201 && rv.j.isVerifiedPurchase, 'Verified buyer review');
const minh = await login('minh@example.com', 'User@123');
ok((await call('POST', '/reviews', { token: minh, body: { orderItemId: elig.orderItemId, rating: 1, content: 'Không mua mà đánh giá' } })).s === 403, 'Non-buyer cannot review');
const ret = await call('PATCH', `/admin/orders/${oid}/status`, { token: admin, body: { status: 'returned', note: 'Khách trả hàng' } });
ok(ret.s === 200 && ret.j.paymentStatus === 'refunded', 'Return: refunded + points revoked (negative txn)', ret.j?.message);
stock = (await call('GET', '/admin/inventory/stock', { token: kho })).j.find((r) => r.variantId === vId);
ok(stock.onHand === 5, 'Stock restored on return', `onHand=${stock.onHand}`);

// ---- Guest checkout + cancel releases stock ----
const gt = `guest-e2e-${Date.now()}-xyz`;
const gc = (await call('POST', '/cart/items', { cart: gt, body: { variantId: vId, quantity: 2 } })).j;
const go = await call('POST', '/orders', { cart: gt, body: { ...orderBody, pointsToUse: 0, cartItemIds: [gc.items[0].id], email: 'guest@test.vn', paymentMethod: 'bank_transfer', idempotencyKey: `e2e-guest-${Date.now()}-0123456789` } });
ok(go.s === 201 && go.j.payment.bankTransfer?.qrUrl, 'Guest order with bank transfer QR');
const tr = await call('POST', '/orders/track', { body: { orderNumber: go.j.order.orderNumber, phone: '0900000002' } });
ok(tr.s === 200, 'Guest order tracking');
ok((await call('POST', '/orders/track', { body: { orderNumber: go.j.order.orderNumber, phone: '0999999999' } })).s === 404, 'Tracking requires matching phone');
// Bank transfer is only "paid" after a staff member with payment.confirm confirms it
ok((await call('POST', `/admin/orders/${go.j.order.id}/confirm-payment`, { token: kho })).s === 403, 'Warehouse staff cannot confirm payments');
const cp = await call('POST', `/admin/orders/${go.j.order.id}/confirm-payment`, { token: sales });
const paidOrder = (await call('GET', `/admin/orders/${go.j.order.id}`, { token: sales })).j;
ok(cp.s < 300 && paidOrder?.paymentStatus === 'paid', 'Sales staff confirms bank transfer → paid', `status=${paidOrder?.paymentStatus}`);
await call('PATCH', `/admin/orders/${go.j.order.id}/status`, { token: sales, body: { status: 'cancelled', note: 'Khách đổi ý' } });
const cancelled = (await call('GET', `/admin/orders/${go.j.order.id}`, { token: sales })).j;
ok(cancelled?.paymentStatus === 'refunded', 'Cancelling a paid order marks it refunded', `status=${cancelled?.paymentStatus}`);
stock = (await call('GET', '/admin/inventory/stock', { token: kho })).j.find((r) => r.variantId === vId);
ok(stock.reserved === 0 && stock.available === 5, 'Cancel releases reserved stock');

// ---- Nutrition & content ----
const calc = await call('POST', '/nutrition/calculate', { body: { gender: 'female', age: 28, heightCm: 160, weightKg: 55, activityLevel: 'light', goal: 'lose_weight' } });
ok(calc.j?.bmr === 1249 && calc.j?.tdee === 1717, 'BMR/TDEE (Mifflin–St Jeor)', `bmr=${calc.j?.bmr} tdee=${calc.j?.tdee}`);
const plan = await call('POST', '/meal-plans/generate', { body: { targetCalories: 1800, excludeAllergens: ['milk'] } });
ok(plan.j?.days?.length === 7 && plan.j.days.every((d) => d.meals.length === 4), '7-day meal plan', `avg=${plan.j?.weekAverageKcal}`);
const q = (await call('GET', '/quiz')).j;
const sub = await call('POST', '/quiz/submit', { body: { answers: q.map((x) => ({ questionId: x.id, optionIds: [x.options[x.options.length - 1].id] })) } });
ok(sub.s === 200, 'Quiz submit', `${sub.j?.products?.length} products`);
const tn = (await call('GET', '/products?excludeAllergens=tree_nut&limit=60')).j;
ok(tn.data.every((p) => !p.allergens.some((a) => a.code === 'tree_nut')), 'Allergy filter excludes tree nuts', `${tn.meta.total} safe products`);

// cleanup test product (soft delete)
await call('DELETE', `/admin/products/${created.j.id}`, { token: admin });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
