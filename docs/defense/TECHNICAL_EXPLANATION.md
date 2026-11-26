# Giải thích kỹ thuật

Mỗi mục gồm: khái niệm ngắn gọn → **dự án dùng thế nào** (kèm file) → câu nói gọn khi trình bày.

## 1. Next.js (frontend)
- **Là gì**: framework React có định tuyến theo thư mục, build tối ưu, hỗ trợ server/client component. Dự án dùng Next.js 16.3 với App Router và Turbopack.
- **Trong dự án**:
  - Route groups `app/(shop)` (cửa hàng) và `app/(admin)/admin` (quản trị) dùng hai layout khác nhau.
  - Trang động dùng `params` bất đồng bộ (`products/[slug]`, `admin/orders/[id]`).
  - Hầu hết trang là client component, dữ liệu tải qua TanStack Query từ API NestJS.
  - Ảnh tối ưu bằng `next/image`.
  - `next build` sinh 48 route, trong đó 42 trang sinh tĩnh.
- **Câu nói gọn**: “Next.js lo giao diện và điều hướng; mọi nghiệp vụ đều ở backend.”

## 2. NestJS (backend)
- **Là gì**: framework Node.js theo kiến trúc module, có dependency injection, decorator, guard, pipe, filter (giống Spring/Angular).
- **Trong dự án**: NestJS 11, các module `auth`, `products`, `carts`, `pricing`, `orders`, `payments`, `nutrition`, `admin`… Đăng ký toàn cục (`backend/src/app.module.ts`, `main.ts`):
  - `ValidationPipe`: kiểm tra DTO bằng class-validator, loại trường thừa.
  - 3 guard: Throttler, JWT, Roles.
  - `AllExceptionsFilter`: chuẩn hóa lỗi.
  - `ScheduleModule`: cron.
  - Swagger tự sinh tài liệu ở `/api/docs`.
- **Câu nói gọn**: “Mỗi miền nghiệp vụ là một module; bảo mật áp dụng toàn cục bằng guard nên không quên được.”

## 3. PostgreSQL
- **Là gì**: hệ quản trị CSDL quan hệ mã nguồn mở, hỗ trợ ACID, khóa dòng, CHECK, trigger, hàm PL/pgSQL, extension.
- **Trong dự án**: PostgreSQL 18.6 chạy nhúng ở cổng 5433, tách khỏi PostgreSQL của Odoo.
  - 108 bảng, 159 khóa ngoại, 68 CHECK, 40 trigger.
  - Extension: `citext` (email/mã không phân biệt hoa thường), `unaccent` + `pg_trgm` (tìm kiếm không dấu, gần đúng), `pgcrypto`.
- **Câu nói gọn**: “CSDL không chỉ lưu trữ mà còn là lớp bảo vệ cuối: tổng tiền sai hoặc tồn âm đều bị chính CSDL từ chối.”

## 4. Prisma
- **Là gì**: ORM cho TypeScript, sinh client có kiểu từ schema.
- **Trong dự án**:
  - Prisma 6.19. Schema SQL viết tay trong `database/init`, rồi `prisma db pull` sinh `backend/prisma/schema.prisma`.
  - Truy vấn thường dùng client có kiểu (`prisma.orders.findMany`).
  - Truy vấn đặc thù dùng `$queryRaw` dạng template tag (vẫn tham số hóa, chống SQL injection), ví dụ gọi `fn_allocate_stock_fefo`, `SELECT … FOR UPDATE`.
  - Transaction tương tác: `prisma.$transaction(async (tx) => …, { isolationLevel, timeout })`.
- **Câu nói gọn**: “Prisma cho truy vấn an toàn kiểu; những chỗ cần sức mạnh của PostgreSQL thì dùng SQL thuần có tham số.”

## 5. JWT
- **Là gì**: JSON Web Token, gồm 3 phần header.payload.signature. Server ký bằng khóa bí mật, client gửi kèm mỗi request. Server không cần lưu phiên.
- **Trong dự án** (`backend/src/modules/auth`):
  - Payload chỉ có `sub` (id người dùng); ký bằng `JWT_SECRET`; hết hạn `JWT_EXPIRES_IN` = 7 ngày.
  - Client gửi `Authorization: Bearer <token>`.
  - `JwtStrategy.validate()` **đọc lại người dùng và quyền ở mỗi request**, nên khóa tài khoản có hiệu lực ngay.
  - Mật khẩu băm bằng bcrypt (10 vòng). Token đặt lại mật khẩu lưu dạng băm SHA-256, dùng một lần.
- **Giới hạn**: token để trong `localStorage`, chưa có refresh token.

## 6. REST API
- **Là gì**: thiết kế API theo tài nguyên (URL) và động từ HTTP (GET/POST/PUT/PATCH/DELETE), trao đổi JSON, không trạng thái.
- **Trong dự án**:
  - 165 endpoint dưới `/api/v1`, ví dụ `GET /products`, `POST /orders`, `PATCH /admin/orders/:id/status`.
  - Mã trạng thái có nghĩa: 201 tạo mới, 400 dữ liệu/nghiệp vụ sai, 401 chưa xác thực, 403 thiếu quyền, 404, 409, 429.
  - Danh sách phân trang theo dạng `{data, meta}`.
- **Câu nói gọn**: “API tự mô tả bằng Swagger, và bộ E2E gọi chính API này như một client thật.”

## 7. RBAC (Role-Based Access Control)
- **Là gì**: cấp quyền theo vai trò. Người dùng → vai trò → quyền.
- **Trong dự án**:
  - Bảng `users – user_roles – roles – role_permissions – permissions`. 15 quyền (`backend/src/common/permissions.ts`), 4 vai trò nhân viên + khách hàng.
  - Endpoint khai báo `@RequirePermissions('order.update')`; `RolesGuard` kiểm tra. Super Admin luôn đạt.
  - Ma trận chỉnh được trên giao diện (`PUT /admin/roles/:code/permissions`).
  - Frontend ẩn menu/nút theo quyền, nhưng bảo mật nằm ở backend.
- **Bằng chứng**: 6 tài khoản × 11 endpoint khớp ma trận (`docs/ROLE_PERMISSION.md §4`).

## 8. Migration
- **Là gì**: các bước thay đổi schema có thứ tự, áp dụng được lặp lại trên mọi môi trường.
- **Trong dự án** (`backend/scripts/db.mjs`):
  - `01_schema.sql` + `02_seed.sql` chạy khi tạo CSDL mới.
  - Các file `03_…`, `04_…`, `05_…` là migration. Mỗi file chạy trong transaction riêng và được ghi vào bảng `_sql_migrations`, nên chạy lại `npm run db:migrate` chỉ áp dụng file mới.
  - Quy ước: migration chỉ thêm, không xóa dữ liệu (ghi chú đầu `03_upgrade_v2.sql`).
- **Ví dụ**: `05_fix_loyalty_trigger.sql` sửa trigger điểm mà không phải tạo lại CSDL.

## 9. Transaction
- **Là gì**: nhóm thao tác “tất cả hoặc không gì cả” (ACID). Khóa dòng `SELECT … FOR UPDATE` buộc giao dịch đồng thời phải chờ.
- **Trong dự án**:
  - **Tạo đơn** (`orders.service.ts › placeOrder`): ReadCommitted, timeout 30 giây. Khóa mã giảm giá, giữ hàng (hàm FEFO khóa dòng tồn), ghi mã/điểm/thanh toán. Lỗi ở bất kỳ đâu thì rollback.
  - **Đổi trạng thái** (`order-lifecycle.service.ts › transition`): khóa dòng đơn, cập nhật kho, tiền, điểm, vận đơn trong cùng transaction.
  - **Migration** và **script dọn dữ liệu kiểm thử** cũng chạy trong transaction. Lỗi SQL lần thử đầu của script dọn đã được rollback sạch.
- **Câu nói gọn**: “Không có trạng thái nửa vời: đơn đã tạo thì hàng đã giữ, mã đã tính và điểm đã trừ; ngược lại thì không có gì thay đổi.”

## 10. Luồng đặt hàng (tóm tắt)
Giỏ (server) → báo giá `POST /checkout/quote` → `POST /orders` kèm `idempotencyKey` → transaction tạo đơn (§9) → phản hồi theo phương thức: COD thành công / VietQR / chuyển sang cổng.

Chi tiết: `docs/BUSINESS_FLOWS.md §4`, `docs/diagrams/sequence-order.md`. Câu nói gọn: “Giá được tính lại ở server ngay trong transaction, và bấm hai lần vẫn chỉ ra một đơn.”

## 11. Luồng tồn kho (tóm tắt)

| Sự kiện | `on_hand` | `reserved` | `order_allocations.state` | `stock_movements` |
|---|---|---|---|---|
| Nhập kho (tạo lô) | + | | | `purchase_in` |
| Đặt hàng | | + (lô HSD sớm nhất trước) | `reserved` | |
| Đang giao | − | − | `shipped` | `sale_out` |
| Hủy | | − | `released` | |
| Hoàn trả | + | | `returned` | `return_in` |
| Xuất hủy / kiểm kê | ± | | | `expired` / `damaged` / `adjustment` |

- Tồn khả dụng = Σ(`on_hand − reserved`) của các lô còn hạn.
- Cảnh báo lấy từ `v_low_stock` và `v_near_expiry`.
- Kiểm chứng bằng E2E #16, #22, #24, #30, #37.

## 12. BMI / BMR / TDEE
Code: `backend/src/modules/nutrition/nutrition.calc.ts`. Cùng công thức với trigger `trg_health_profile_calc` trong CSDL.

| Chỉ số | Ý nghĩa | Công thức |
|---|---|---|
| BMI | Chỉ số khối cơ thể | kg / m². Ngưỡng châu Á–TBD: < 18,5 thiếu cân; 18,5–22,9 bình thường; 23–24,9 thừa cân; 25–29,9 béo phì I; ≥ 30 béo phì II |
| BMR | Năng lượng khi nghỉ hoàn toàn | **Mifflin–St Jeor**: 10·kg + 6,25·cm − 5·tuổi + s, với s = +5 (nam), −161 (nữ), −78 (khác) |
| TDEE | Tổng năng lượng tiêu hao/ngày | BMR × hệ số vận động: 1,2 (ít), 1,375 (nhẹ), 1,55 (vừa), 1,725 (nhiều), 1,9 (rất nhiều) |
| Calo mục tiêu | | Giảm cân: max(TDEE − 500, 1.200). Tăng cân: +400. Tăng cơ: +300. Khác: = TDEE |
| Macro | | Đạm 2,0 g/kg (giảm cân, tăng cơ), 1,8 (tăng cân), 1,6 (khác). Béo 25% calo. Tinh bột phần còn lại |

**Ví dụ đã kiểm thử** (E2E #38): nữ, 28 tuổi, 160 cm, 55 kg, vận động nhẹ, mục tiêu giảm cân.
- BMR = 550 + 1.000 − 140 − 161 = **1.249**.
- TDEE = 1.249 × 1,375 = **1.717**.
- Mục tiêu = **1.217 kcal**.
- Đạm = 55 × 2,0 = **110 g**.
- Béo = 1.217 × 25% / 9 ≈ **33,8 g**.
- Tinh bột = (1.217 − 440 − 304,2) / 4 ≈ **118,2 g**.

**Vì sao Mifflin–St Jeor**: được Hiệp hội Dinh dưỡng Hoa Kỳ (ADA) đánh giá là sát thực tế hơn công thức Harris–Benedict cho người trưởng thành.

**Lưu ý**: hệ thống luôn hiển thị cảnh báo kết quả chỉ để tham khảo, không thay thế tư vấn y tế.
