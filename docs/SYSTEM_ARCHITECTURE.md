# Kiến trúc hệ thống

Sơ đồ chi tiết: [component](diagrams/component-diagram.md), [deployment](diagrams/deployment-diagram.md).

## 1. Tổng thể

```
Trình duyệt ──HTTP──▶ Next.js (cổng 3000) ──REST/JSON (axios)──▶ NestJS API (cổng 5001, /api/v1) ──Prisma/pg──▶ PostgreSQL 18 (cổng 5433)
                         │                                          │
                         └── ảnh tĩnh /public/images                └── /uploads (ảnh người dùng tải lên, backend/uploads)
```

- Kiến trúc **client – server 3 lớp**: giao diện (Next.js), nghiệp vụ (NestJS), dữ liệu (PostgreSQL).
- Frontend chủ yếu là **client component**: dữ liệu tải qua TanStack Query từ REST API, không truy cập CSDL trực tiếp.
- Backend là **REST API không trạng thái**: xác thực bằng JWT Bearer, mỗi request tự đọc lại người dùng và quyền từ CSDL.
- CSDL giữ một phần nghiệp vụ bằng **trigger/hàm SQL**: Nutri-Score, cộng/trừ điểm, lịch sử trạng thái đơn, phân bổ FEFO, audit, `updated_at`.

## 2. Frontend (`frontend/src`)

| Thư mục | Vai trò |
|---|---|
| `app/(shop)/…` | Trang cửa hàng và tài khoản. Layout chung có header, footer, giỏ hàng |
| `app/(admin)/admin/…` | Trang quản trị. Layout riêng kiểm tra đăng nhập và quyền: menu chỉ hiện mục người dùng có quyền, trang không có quyền bị chặn |
| `components/ui` | Bộ UI dùng chung: button, form, feedback, overlay (hộp xác nhận), misc |
| `components/layout`, `home`, `shop`, `admin` | Thành phần theo khu vực (`admin/kit.tsx`, `charts.tsx`, `product-form.tsx`…) |
| `lib/api.ts` | axios instance: gắn `Authorization: Bearer <token>` và `x-cart-token`; xử lý 401 |
| `stores/` | Zustand: `auth` (người dùng, quyền), `prefs` (dị ứng, calo mục tiêu; lưu localStorage), `ui` (hộp xác nhận) |
| `hooks/` | `use-cart`, `use-wishlist`, `use-order-actions`, `use-mounted` |
| `lib/validation.ts`, `vn-provinces.ts` | Quy tắc Zod, danh sách tỉnh/thành |

- Token đăng nhập lưu trong `localStorage` (`nutrio_token`). Giỏ khách vãng lai dùng token `guest-<uuid>` (`nutrio_cart_token`).
- Phân quyền ở frontend **chỉ để ẩn/hiện giao diện**. Kiểm soát thật nằm ở backend.

## 3. Backend (`backend/src`)

### 3.1 Pipeline xử lý request

```
Request → Helmet → CORS (FRONTEND_URL) → ValidationPipe (whitelist, forbidNonWhitelisted, transform)
        → ThrottlerGuard (300 req/phút; đăng nhập/đăng ký 10, quên mật khẩu 5)
        → JwtAuthGuard (bắt buộc token, trừ @Public(); với @Public() token là tùy chọn)
        → RolesGuard (@RequirePermissions / @Roles; role "admin" luôn qua)
        → Controller → Service → Prisma → PostgreSQL
        → AllExceptionsFilter (chuẩn hóa lỗi, thông báo tiếng Việt)
```

Ba guard được đăng ký toàn cục (`APP_GUARD`) trong `app.module.ts`. Vì vậy mọi endpoint mặc định đều cần đăng nhập, trừ khi được đánh dấu `@Public()`.

### 3.2 Module

| Nhóm | Module | Ghi chú |
|---|---|---|
| Nền tảng | `prisma`, `common` (guards, decorators, filters, `permissions.ts`, `utils/serialize`), `core` (mail, notifications, uploads) | |
| Bán hàng | `auth`, `users` (/account), `products` (+ `stock.service`), `categories`, `carts`, `pricing`, `orders` (+ `order-lifecycle`, `order-status`, `orders.cron`), `payments`, `reviews`, `subscriptions` | `PricingService` dùng chung cho giỏ, checkout và tạo đơn |
| Dinh dưỡng | `nutrition`, `quiz`, `recipes` (+ meal plan) | |
| Nội dung | `content` (home, banner, bài viết, trang tĩnh, khuyến mãi công khai, liên hệ, nhận tin) | |
| Quản trị | `admin`: dashboard/báo cáo, catalog, orders, customers, inventory, promotions, content, staff, `excel.ts` | Mọi route `admin/*` gắn `@RequirePermissions` |
| Dữ liệu demo | `seed/` (`seed.ts`, `catalog.data.ts`, `content.data.ts`) | Chạy một lần, có cờ đánh dấu trong bảng `settings` |

### 3.3 Nguyên tắc thiết kế quan trọng

1. **Một nơi tính giá**: `PricingService.quote()` tính tạm tính, flash sale, ưu đãi hạng, mã giảm giá, phí ship, điểm và điểm sẽ nhận.
   - Giỏ hàng, `POST /checkout/quote` và `POST /orders` đều gọi hàm này.
   - Khi tạo đơn, hàm chạy ở chế độ `strict`: lỗi mã giảm giá hoặc phương thức giao không hợp lệ sẽ chặn đơn.
2. **Một nơi đổi trạng thái đơn**: `OrderLifecycleService.transition()`.
   - Khóa dòng đơn (`SELECT … FOR UPDATE`), kiểm tra bảng chuyển trạng thái `ORDER_TRANSITIONS`.
   - Xử lý mọi tác động phụ (kho, thanh toán, điểm, vận đơn, thông báo) trong **cùng một transaction**.
3. **Tạo đơn nguyên tử**: `OrdersService.placeOrder()` chạy trong một transaction.
   - Khóa mã giảm giá, định giá lại, giữ hàng FEFO, ghi dùng mã, trừ điểm, tạo bản ghi thanh toán, xóa dòng giỏ.
   - Khóa `idempotency_key` (UNIQUE) chống tạo trùng.
4. **Không tin dữ liệu client**: giá, phí ship, giảm giá và điểm đều tính lại ở server; DTO loại bỏ trường thừa.
5. **Tác vụ nền**: cron mỗi 10 phút hủy đơn VNPay/MoMo chưa thanh toán sau 60 phút để nhả hàng (`orders.cron.ts`).

## 4. Cơ sở dữ liệu

- PostgreSQL 18.6 chạy **nhúng** qua gói `embedded-postgres`:
  - Dữ liệu ở `backend/.pgdata`, cổng **5433**, quản lý bằng `backend/scripts/db.mjs`.
  - Cụm này **tách biệt hoàn toàn** với PostgreSQL 12 của Odoo trên cổng 5432 (xem [DATABASE_DESIGN.md §8](DATABASE_DESIGN.md#8-tách-biệt-với-postgresql-của-odoo)).
- Schema gốc nằm trong `database/init/01_schema.sql`, kèm `02_seed.sql` cho dữ liệu nền.
- Nâng cấp dùng các file `03…05_*.sql`, được ghi nhận trong bảng `_sql_migrations`.
- Prisma schema (`backend/prisma/schema.prisma`) được introspect (`prisma db pull`) từ CSDL. Prisma chỉ dùng làm client truy vấn, không quản lý migration.

## 5. Tích hợp bên ngoài

| Tích hợp | Trạng thái |
|---|---|
| VNPay sandbox | Có mã tạo URL (HMAC-SHA512) và xác minh chữ ký/IPN. **Chỉ bật khi có `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`**; hiện để trống nên chưa thử |
| MoMo sandbox | Tương tự, cần `MOMO_*`; hiện để trống nên chưa thử |
| Chuyển khoản / VietQR | Hiển thị QR từ thông tin `BANK_*`. Nhân viên xác nhận thủ công (`POST /admin/orders/:id/confirm-payment`) |
| SMTP | Gửi email xác nhận đơn, đổi trạng thái, đặt lại mật khẩu. Để trống thì chỉ ghi log |
| Vận chuyển | Mô phỏng nội bộ: mã vận đơn `NTR…`, hành trình tạo khi chuyển sang “Đang giao”/“Giao thành công” |

## 6. Cấu hình

- `backend/.env`: tạo từ `.env.example`, **không commit**. Chứa `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (mặc định 7d), `FRONTEND_URL`, `PUBLIC_API_URL`, SMTP, VNPay, MoMo, BANK.
- `frontend/.env.local`: chứa `NEXT_PUBLIC_API_URL`.
- `docker-compose.yml` (có sẵn từ repo gốc) **chưa được kiểm thử** vì máy phát triển không có Docker. Lưu ý: file này mặc định publish PostgreSQL ra cổng 5432, sẽ trùng với Odoo; nếu dùng cần đặt `POSTGRES_PORT` khác, ví dụ 5434.
