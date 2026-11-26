# Tài liệu API

- **Base URL**: `http://localhost:5001/api/v1`.
- **Swagger UI**: `http://localhost:5001/api/docs`. Spec JSON tại `/api/docs-json`.
- **Định dạng**: REST, JSON, UTF-8.

Danh sách endpoint ở §5 được **sinh tự động từ metadata của các controller đã build** (`dist/**/*.controller.js`): method, đường dẫn, `@Public`, `@RequirePermissions`. Mô tả lấy từ `@ApiOperation` trong Swagger; endpoint không có mô tả thì ghi tên hàm xử lý. Tổng cộng **165 endpoint** (07/11/2026).

## 1. Xác thực

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "lan@example.com", "password": "User@123" }
```

Phản hồi `201`:

```json
{ "message": "Đăng nhập thành công", "accessToken": "<JWT>", "user": { "id": 2, "email": "…", "fullName": "…", "phone": "…", "avatarUrl": null, "roles": ["customer"], "permissions": [], "isStaff": false } }
```

- Gửi token ở header `Authorization: Bearer <JWT>`. Token hết hạn theo `JWT_EXPIRES_IN` (mặc định `7d`).
- **Giỏ khách vãng lai**: header `x-cart-token: guest-<uuid>` (16–80 ký tự). Dùng cho `/cart/*`, `/checkout/quote`, `POST /orders` khi chưa đăng nhập.

| Cột “Truy cập” | Ý nghĩa |
|---|---|
| Công khai | `@Public()`: không cần token; nếu có token hợp lệ thì API biết người dùng |
| Đăng nhập | Cần token hợp lệ, mọi vai trò |
| `mã.quyền` | Cần token **và** quyền tương ứng (Super Admin luôn đạt). Xem [ROLE_PERMISSION.md](ROLE_PERMISSION.md) |

## 2. Định dạng lỗi

Mọi lỗi đi qua `AllExceptionsFilter`:

```json
{ "statusCode": 400, "message": "property foo should not exist", "errors": ["property foo should not exist", "Email không đúng định dạng"] }
```

| Mã | Khi nào |
|---|---|
| 400 | Dữ liệu không hợp lệ: class-validator, trường thừa bị chặn (`forbidNonWhitelisted`), vi phạm nghiệp vụ (hết hàng, chuyển trạng thái sai, mã giảm giá không đủ điều kiện…) |
| 401 | Thiếu/sai/hết hạn token; sai mật khẩu; tài khoản bị khóa |
| 403 | Thiếu quyền |
| 404 | Không tìm thấy (Prisma `P2025` cũng được đổi thành 404) |
| 409 | Trùng giá trị duy nhất (Prisma `P2002`) |
| 429 | Vượt giới hạn tần suất: 300 request/phút/IP; đăng nhập/đăng ký/đặt lại mật khẩu 10/phút; quên mật khẩu 5/phút |

## 3. Phân trang và lọc

Các danh sách (`GET /products`, `/admin/orders`, `/admin/products`, `/admin/customers`…) nhận `page`, `limit` và trả:

```json
{ "data": [ … ], "meta": { "page": 1, "limit": 20, "total": 147, "totalPages": 8 } }
```

`GET /products` (`ProductsQueryDto`) hỗ trợ: `page` (mặc định 1), `limit` (mặc định 12), `q`, `category` (slug), `diets[]`, `excludeAllergens[]`, `minPrice`, `maxPrice`, `minRating`, `nutriScore[]`, `featured`, `inStock`, `onSale`, `sort`.

## 4. Ví dụ luồng đặt hàng

```http
POST /api/v1/cart/items            { "variantId": 6, "quantity": 2 }
GET  /api/v1/cart?selected=10,9    → giỏ + báo giá cho dòng 10, 9
POST /api/v1/checkout/quote        { "cartItemIds": [10, 9], "couponCode": "GIAM30K", "shippingMethodId": 1, "pointsToUse": 50 }
POST /api/v1/orders
{
  "cartItemIds": [10, 9], "couponCode": "GIAM30K", "shippingMethodId": 1, "pointsToUse": 50,
  "recipientName": "Nguyễn Thị Lan", "phone": "0900000002", "email": "chỉ bắt buộc với khách vãng lai",
  "province": "TP. Hồ Chí Minh", "district": "Quận 1", "ward": "Bến Nghé", "street": "12 Lê Lợi",
  "note": "", "saveAddress": false,
  "paymentMethod": "cod | bank_transfer | vnpay | momo",
  "idempotencyKey": "chuỗi 16–80 ký tự [A-Za-z0-9-], sinh mới cho mỗi lần bấm Đặt hàng"
}
```

- Phản hồi `201` gồm `order` (id, orderNumber, tổng tiền, trạng thái) và `payment`: `redirectUrl` cho VNPay/MoMo, hoặc `bankTransfer.qrUrl` cho chuyển khoản.
- Gửi lại cùng `idempotencyKey` sẽ nhận **cùng đơn**, không tạo đơn mới.

Đổi trạng thái (quản trị):

```http
PATCH /api/v1/admin/orders/174/status      { "status": "shipping", "note": "Đã bàn giao vận chuyển" }
POST  /api/v1/admin/orders/175/confirm-payment
```

## 5. Danh sách endpoint

### Hệ thống (2)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/` | Công khai | `getRoot` |
| GET | `/health` | Công khai | `getHealth` |

### Xác thực (auth) (6)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| POST | `/auth/change-password` | Đăng nhập | Đổi mật khẩu |
| POST | `/auth/forgot-password` | Công khai | Gửi email đặt lại mật khẩu |
| POST | `/auth/login` | Công khai | Đăng nhập, trả về JWT access token |
| GET | `/auth/me` | Đăng nhập | Thông tin tài khoản đang đăng nhập (vai trò, quyền, điểm thưởng) |
| POST | `/auth/register` | Công khai | Đăng ký tài khoản khách hàng |
| POST | `/auth/reset-password` | Công khai | Đặt lại mật khẩu bằng token trong email |

### Tài khoản khách hàng (account) (14)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/account/addresses` | Đăng nhập | `addresses` |
| POST | `/account/addresses` | Đăng nhập | `addAddress` |
| DELETE | `/account/addresses/:id` | Đăng nhập | `deleteAddress` |
| PUT | `/account/addresses/:id` | Đăng nhập | `updateAddress` |
| GET | `/account/loyalty` | Đăng nhập | Điểm thưởng, hạng thành viên Bronze/Silver/Gold, lịch sử điểm |
| GET | `/account/notifications` | Đăng nhập | `notifications` |
| POST | `/account/notifications/read` | Đăng nhập | `readAll` |
| PATCH | `/account/profile` | Đăng nhập | Cập nhật thông tin cá nhân / ảnh đại diện |
| GET | `/account/vouchers` | Đăng nhập | Voucher có thể sử dụng |
| GET | `/account/wishlist` | Đăng nhập | `wishlist` |
| POST | `/account/wishlist` | Đăng nhập | `addWishlist` |
| DELETE | `/account/wishlist/:productId` | Đăng nhập | `removeWishlist` |
| POST | `/account/wishlist/:productId/price-alert` | Đăng nhập | Bật/tắt thông báo khi sản phẩm yêu thích giảm giá |
| GET | `/account/wishlist/ids` | Đăng nhập | `wishlistIds` |

### Sản phẩm (10)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/products` | Công khai | Danh sách sản phẩm: tìm kiếm, lọc (danh mục, giá, mục tiêu dinh dưỡng, đánh giá, dị ứng), sắp xếp, phân trang |
| GET | `/products/:id/frequently-bought` | Công khai | `frequentlyBought` |
| GET | `/products/:id/related` | Công khai | `related` |
| GET | `/products/:slug` | Công khai | Chi tiết sản phẩm theo slug |
| GET | `/products/by-ids` | Công khai | Lấy nhiều sản phẩm theo ID (đã xem gần đây...) |
| GET | `/products/collections` | Công khai | Sản phẩm nổi bật, bán chạy, mới nhất (trang chủ) |
| GET | `/products/compare` | Công khai | So sánh 2–3 sản phẩm |
| GET | `/products/popular-searches` | Công khai | Từ khóa được tìm nhiều |
| GET | `/products/suggest` | Công khai | Gợi ý từ khóa / sản phẩm khi đang gõ tìm kiếm |
| GET | `/products/traceability/:qrCode` | Công khai | Truy xuất nguồn gốc lô hàng qua mã QR |

### Danh mục (3)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/categories` | Công khai | Cây danh mục sản phẩm (cha/con) kèm số lượng sản phẩm |
| GET | `/categories/:slug` | Công khai | `findOne` |
| GET | `/categories/meta` | Công khai | Danh sách chế độ ăn, thành phần dị ứng, chứng nhận (dùng cho bộ lọc) |

### Giỏ hàng (9)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| DELETE | `/cart` | Công khai | `clear` |
| GET | `/cart` | Công khai | Giỏ hàng + tổng tiền + dinh dưỡng (selected = id các dòng muốn thanh toán) |
| DELETE | `/cart/coupon` | Công khai | `removeCoupon` |
| POST | `/cart/coupon` | Công khai | `applyCoupon` |
| POST | `/cart/items` | Công khai | `add` |
| DELETE | `/cart/items/:id` | Công khai | `remove` |
| PATCH | `/cart/items/:id` | Công khai | `update` |
| POST | `/cart/items/bulk` | Công khai | Thêm nhiều sản phẩm một lần (công thức, thực đơn, mua lại) |
| POST | `/cart/merge` | Đăng nhập | Gộp giỏ hàng khách vãng lai vào tài khoản sau khi đăng nhập |

### Đơn hàng & checkout (7)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| POST | `/checkout/quote` | Công khai | Tính tiền đơn hàng trước khi đặt (giá, giảm giá, phí ship, điểm thưởng) – tính ở server |
| GET | `/orders` | Đăng nhập | Lịch sử đơn hàng của tôi |
| POST | `/orders` | Công khai | Đặt hàng (khách vãng lai hoặc đã đăng nhập) |
| GET | `/orders/:id` | Đăng nhập | `detail` |
| POST | `/orders/:id/cancel` | Đăng nhập | Khách hủy đơn (chỉ khi Chờ xác nhận / Đã xác nhận) |
| POST | `/orders/:id/reorder` | Đăng nhập | Mua lại: thêm toàn bộ sản phẩm của đơn cũ vào giỏ |
| POST | `/orders/track` | Công khai | Tra cứu đơn hàng bằng mã đơn + số điện thoại |

### Thanh toán (6)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/payments/methods` | Công khai | Phương thức thanh toán đang được hỗ trợ |
| POST | `/payments/momo/ipn` | Công khai | `momoIpn` |
| GET | `/payments/momo/verify` | Công khai | `momoVerify` |
| POST | `/payments/retry/:orderNumber` | Công khai | Tạo lại liên kết thanh toán online cho đơn chưa thanh toán |
| GET | `/payments/vnpay/ipn` | Công khai | IPN VNPay (server-to-server) |
| GET | `/payments/vnpay/verify` | Công khai | Xác minh kết quả trả về từ VNPay (frontend gọi sau khi redirect) |

### Đánh giá (8)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| POST | `/reviews` | Đăng nhập | Viết đánh giá (chỉ người đã mua và nhận hàng) |
| DELETE | `/reviews/:id` | Đăng nhập | `remove` |
| PATCH | `/reviews/:id` | Đăng nhập | `update` |
| POST | `/reviews/:id/helpful` | Đăng nhập | `helpful` |
| GET | `/reviews/eligible` | Đăng nhập | Sản phẩm đã nhận hàng nhưng chưa đánh giá |
| GET | `/reviews/mine` | Đăng nhập | `mine` |
| GET | `/reviews/product/:productId` | Công khai | Đánh giá đã duyệt của sản phẩm (lọc theo sao / có ảnh) |
| GET | `/reviews/testimonials` | Công khai | `testimonials` |

### Dinh dưỡng (6)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| POST | `/nutrition/calculate` | Công khai | Tính BMI, BMR, TDEE, calo & macro khuyến nghị (không cần đăng nhập) |
| GET | `/nutrition/options` | Công khai | `options` |
| GET | `/nutrition/profile` | Đăng nhập | Hồ sơ sức khỏe của tôi |
| PUT | `/nutrition/profile` | Đăng nhập | Lưu hồ sơ sức khỏe (giới tính, tuổi, chiều cao, cân nặng, vận động, mục tiêu, dị ứng) |
| GET | `/nutrition/profile/recommendations` | Đăng nhập | `mine` |
| GET | `/nutrition/recommendations` | Công khai | Gợi ý sản phẩm theo mục tiêu, loại trừ thành phần dị ứng |

### Quiz (2)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/quiz` | Công khai | Bộ câu hỏi tư vấn sản phẩm |
| POST | `/quiz/submit` | Công khai | Gửi câu trả lời, nhận gợi ý sản phẩm & combo phù hợp |

### Công thức & thực đơn (7)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| POST | `/meal-plans` | Đăng nhập | Lưu thực đơn vào tài khoản |
| POST | `/meal-plans/cart-items` | Công khai | Quy đổi nguyên liệu của thực đơn thành sản phẩm để thêm vào giỏ |
| POST | `/meal-plans/generate` | Công khai | Tạo thực đơn 7 ngày theo mục tiêu calo và dị ứng |
| GET | `/meal-plans/mine` | Đăng nhập | `mine` |
| POST | `/meal-plans/swap` | Công khai | Đổi món cho một bữa trong thực đơn |
| GET | `/recipes` | Công khai | Công thức Eat Clean / Keto / Vegan (lọc theo chế độ, bữa, calo) |
| GET | `/recipes/:slug` | Công khai | `detail` |

### Nội dung công khai & khuyến mãi (13)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/banners` | Công khai | `banners` |
| POST | `/contact` | Công khai | Gửi yêu cầu tư vấn dinh dưỡng / liên hệ |
| GET | `/home` | Công khai | Toàn bộ dữ liệu trang chủ |
| POST | `/newsletter` | Công khai | `newsletter` |
| GET | `/pages` | Công khai | `pages` |
| GET | `/pages/:slug` | Công khai | `page` |
| GET | `/posts` | Công khai | `posts` |
| GET | `/posts/:slug` | Công khai | `post` |
| GET | `/promotions/bundles` | Công khai | `bundles` |
| GET | `/promotions/bundles/:slug` | Công khai | `bundle` |
| GET | `/promotions/coupons` | Công khai | `coupons` |
| GET | `/promotions/flash-sale` | Công khai | `flashSale` |
| GET | `/store-info` | Công khai | `storeInfo` |

### Giao hàng định kỳ (4)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/subscriptions` | Đăng nhập | `mine` |
| POST | `/subscriptions` | Đăng nhập | `create` |
| PATCH | `/subscriptions/:id` | Đăng nhập | `update` |
| GET | `/subscriptions/plans` | Công khai | `plans` |

### Upload ảnh (1)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| POST | `/uploads` | Đăng nhập | Tải lên tối đa 8 ảnh (jpg, png, webp, gif – tối đa 5MB/ảnh) |

### Quản trị – Tổng quan & báo cáo (3)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/admin/dashboard` | `dashboard.view` | Số liệu tổng quan, biểu đồ, cảnh báo tồn kho & hạn sử dụng |
| GET | `/admin/reports` | `report.view` | Báo cáo: doanh thu, số đơn, AOV, tỷ lệ thành công, top sản phẩm/khách hàng |
| GET | `/admin/reports/export` | `report.view` | Xuất báo cáo Excel |

### Quản trị – Sản phẩm & danh mục (12)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/admin/catalog/meta` | `product.read` | `meta` |
| GET | `/admin/catalog/variants` | `product.read` | `variants` |
| GET | `/admin/categories` | `product.read` | `categories` |
| POST | `/admin/categories` | `category.write` | `createCategory` |
| DELETE | `/admin/categories/:id` | `category.write` | `removeCategory` |
| PUT | `/admin/categories/:id` | `category.write` | `updateCategory` |
| GET | `/admin/products` | `product.read` | `list` |
| POST | `/admin/products` | `product.write` | `create` |
| DELETE | `/admin/products/:id` | `product.write` | `remove` |
| GET | `/admin/products/:id` | `product.read` | `get` |
| PUT | `/admin/products/:id` | `product.write` | `update` |
| PATCH | `/admin/products/:id/visibility` | `product.write` | `visibility` |

### Quản trị – Đơn hàng (5)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/admin/orders` | `order.read` | `list` |
| GET | `/admin/orders/:id` | `order.read` | `detail` |
| POST | `/admin/orders/:id/confirm-payment` | `payment.confirm` | `confirmPayment` |
| PATCH | `/admin/orders/:id/status` | `order.update` | `updateStatus` |
| GET | `/admin/orders/export` | `order.read` | `export` |

### Quản trị – Khách hàng (3)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/admin/customers` | `customer.read` | `list` |
| GET | `/admin/customers/:id` | `customer.read` | `detail` |
| PATCH | `/admin/customers/:id/lock` | `customer.manage` | `lock` |

### Quản trị – Kho (6)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| POST | `/admin/inventory/adjust` | `inventory.manage` | `adjust` |
| GET | `/admin/inventory/batches` | `inventory.manage` | `batches` |
| POST | `/admin/inventory/issue` | `inventory.manage` | `issue` |
| GET | `/admin/inventory/movements` | `inventory.manage` | `movements` |
| POST | `/admin/inventory/receive` | `inventory.manage` | `receive` |
| GET | `/admin/inventory/stock` | `inventory.manage` | `stock` |

### Quản trị – Khuyến mãi (12)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/admin/promotions/bundles` | `coupon.manage` | `bundles` |
| POST | `/admin/promotions/bundles` | `coupon.manage` | `createBundle` |
| DELETE | `/admin/promotions/bundles/:id` | `coupon.manage` | `deleteBundle` |
| PUT | `/admin/promotions/bundles/:id` | `coupon.manage` | `updateBundle` |
| GET | `/admin/promotions/coupons` | `coupon.manage` | `coupons` |
| POST | `/admin/promotions/coupons` | `coupon.manage` | `createCoupon` |
| DELETE | `/admin/promotions/coupons/:id` | `coupon.manage` | `deleteCoupon` |
| PUT | `/admin/promotions/coupons/:id` | `coupon.manage` | `updateCoupon` |
| GET | `/admin/promotions/flash-sales` | `coupon.manage` | `flashSales` |
| POST | `/admin/promotions/flash-sales` | `coupon.manage` | `createFlash` |
| DELETE | `/admin/promotions/flash-sales/:id` | `coupon.manage` | `deleteFlash` |
| PUT | `/admin/promotions/flash-sales/:id` | `coupon.manage` | `updateFlash` |

### Quản trị – Nội dung, đánh giá, liên hệ (20)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/admin/banners` | `content.manage` | `banners` |
| POST | `/admin/banners` | `content.manage` | `createBanner` |
| DELETE | `/admin/banners/:id` | `content.manage` | `deleteBanner` |
| PUT | `/admin/banners/:id` | `content.manage` | `updateBanner` |
| POST | `/admin/blog-categories` | `content.manage` | `createBlogCategory` |
| GET | `/admin/contacts` | `customer.read` | `contacts` |
| PATCH | `/admin/contacts/:id` | `customer.read` | `resolveContact` |
| GET | `/admin/newsletter` | `content.manage` | `newsletter` |
| GET | `/admin/pages` | `content.manage` | `pages` |
| PUT | `/admin/pages/:slug` | `content.manage` | `savePage` |
| GET | `/admin/posts` | `content.manage` | `posts` |
| POST | `/admin/posts` | `content.manage` | `createPost` |
| DELETE | `/admin/posts/:id` | `content.manage` | `deletePost` |
| PUT | `/admin/posts/:id` | `content.manage` | `updatePost` |
| GET | `/admin/recipes` | `content.manage` | `recipes` |
| POST | `/admin/recipes` | `content.manage` | `createRecipe` |
| DELETE | `/admin/recipes/:id` | `content.manage` | `deleteRecipe` |
| PUT | `/admin/recipes/:id` | `content.manage` | `updateRecipe` |
| GET | `/admin/reviews` | `review.moderate` | `reviews` |
| PATCH | `/admin/reviews/:id` | `review.moderate` | `moderate` |

### Quản trị – Nhân viên & phân quyền (6)

| Method | Endpoint | Truy cập | Mô tả |
|---|---|---|---|
| GET | `/admin/roles` | `user.manage` | `roles` |
| PUT | `/admin/roles/:code/permissions` | `user.manage` | `setPermissions` |
| GET | `/admin/staff` | `user.manage` | `staff` |
| POST | `/admin/staff` | `user.manage` | `createStaff` |
| PUT | `/admin/staff/:id/roles` | `user.manage` | `setRoles` |
| POST | `/admin/subscriptions/run` | `user.manage` | `runSubscriptions` |
