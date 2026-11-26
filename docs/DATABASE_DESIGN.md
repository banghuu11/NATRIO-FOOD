# Thiết kế cơ sở dữ liệu

- **Hệ quản trị**: PostgreSQL 18.6, chạy nhúng qua `embedded-postgres`. Cổng **5433**, dữ liệu ở `backend/.pgdata`, CSDL `nutrio_db`.
- **ERD**: [diagrams/erd.md](diagrams/erd.md).
- Mọi số liệu dưới đây được truy vấn trực tiếp từ CSDL ngày 07/11/2026.

## 1. Thống kê

| Đối tượng | Số lượng |
|---|---|
| Bảng (gồm `_sql_migrations`) | 108 |
| View / materialized view | 9 / 1 (`mv_frequently_bought`) |
| Khóa chính / khóa ngoại | 108 / 159 |
| Ràng buộc UNIQUE / CHECK | 48 / 68 |
| Chỉ mục (gồm chỉ mục của PK/UNIQUE) | 229 |
| Trigger (không tính trigger nội bộ) | 40 |
| Kiểu ENUM | 25 |
| Extension | `pgcrypto` 1.4, `citext` 1.8, `pg_trgm` 1.6, `unaccent` 1.1 |

## 2. File SQL và migration

| File | Nội dung | Cách chạy |
|---|---|---|
| `database/init/01_schema.sql` | Toàn bộ schema: bảng, ENUM, view, hàm, trigger | `db:setup` (chỉ khi tạo DB mới) |
| `database/init/02_seed.sql` | Dữ liệu nền: vai trò, quyền, hạng thành viên, dị ứng, chế độ ăn, phương thức giao… | `db:setup` |
| `03_upgrade_v2.sql` | Chống đơn trùng (`idempotency_key`), bảng `order_allocations` (FEFO), trang tĩnh, nhận tin, cột banner/công thức | migration |
| `04_nutrition_v2.sql` | Bổ sung mục tiêu `gain_weight`, cập nhật hàm tính calo | migration |
| `05_fix_loyalty_trigger.sql` | Sửa trigger điểm: `UPDATE` trước, chỉ `INSERT` khi chưa có dòng. Bản cũ dùng `INSERT … ON CONFLICT` nên vi phạm CHECK khi điểm âm | migration |

- `node scripts/db.mjs migrate` chạy các file `03_*.sql` trở đi chưa có trong bảng `_sql_migrations`.
- Mỗi file chạy trong một transaction riêng. Lỗi thì rollback file đó.
- Trạng thái hiện tại: đã áp dụng `03`, `04`, `05`.
- Prisma schema (`backend/prisma/schema.prisma`) được introspect từ CSDL (`prisma db pull`). **Không dùng `prisma migrate`**: lệnh `prisma:migrate` còn lại trong `package.json` từ khung dự án, không nên chạy.

## 3. Nhóm bảng chính

| Nhóm | Bảng |
|---|---|
| Người dùng & phân quyền | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `user_sessions`, `verification_tokens`, `oauth_accounts`, `addresses`, `audit_logs` |
| Sản phẩm | `categories` (cha/con tự tham chiếu), `brands`, `farms`, `suppliers`, `products`, `product_variants`, `product_images`, `nutrition_facts`, `ingredients`, `product_ingredients`, `allergens`, `product_allergens`, `diets`, `product_diets`, `certifications`, `product_certifications`, `tags`, `product_tags`, `product_substitutes`, `variant_price_history` |
| Kho | `warehouses`, `product_batches` (lô, HSD, mã QR), `inventory` (tồn theo lô × kho), `stock_movements` (nhật ký nhập/xuất) |
| Giỏ & đơn | `carts`, `cart_items`, `orders`, `order_items`, `order_allocations` (lô đã giữ cho từng dòng), `order_status_history`, `shipping_methods`, `shipments`, `shipment_events`, `returns`, `return_items` |
| Thanh toán | `payments`, `payment_transactions` (phản hồi cổng), `refunds` |
| Khuyến mãi & thành viên | `coupons`, `coupon_usages`, `flash_sales`, `flash_sale_items`, `bundles`, `bundle_items`, `membership_tiers`, `loyalty_accounts`, `loyalty_transactions`, `referrals` |
| Tương tác | `reviews`, `review_media`, `review_votes`, `wishlists`, `product_alerts`, `product_views`, `search_logs`, `notifications`, `notification_preferences` |
| Dinh dưỡng | `health_profiles`, `user_allergens`, `user_diets`, `quiz_questions`, `quiz_options`, `quiz_option_effects`, `quiz_sessions`, `quiz_answers`, `quiz_recommendations`, `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_diets`, `recipe_favorites`, `meal_plans`, `meal_plan_items`, `user_meal_plans`, `food_diary`, `water_logs`, `weight_logs` |
| Nội dung | `banners`, `blog_categories`, `blog_posts`, `blog_post_tags`, `blog_comments`, `cms_pages`, `contact_messages`, `newsletter_subscribers`, `settings` |
| Định kỳ | `subscription_plans`, `subscriptions`, `subscription_items`, `subscription_skips` |
| Có trong schema, chưa dùng ở giao diện | `chat_sessions`, `chat_messages`, `challenges`, `challenge_checkins`, `user_challenges`, `badges`, `user_badges` |

## 4. Ràng buộc toàn vẹn tiêu biểu

| Bảng | Ràng buộc | Ý nghĩa |
|---|---|---|
| `orders` | `UNIQUE(order_number)`, `UNIQUE(idempotency_key)` | Mã đơn duy nhất; chống tạo đơn trùng khi bấm nhiều lần |
| `orders` | `CHECK total_amount = subtotal − discount_amount − points_discount + shipping_fee + tax_amount` | CSDL tự chặn tổng tiền sai |
| `orders` | `CHECK user_id IS NOT NULL OR guest_email IS NOT NULL OR guest_phone IS NOT NULL` | Đơn luôn có người nhận liên hệ được |
| `order_items` | `CHECK line_total = unit_price × quantity − discount_amount`, `quantity > 0` | |
| `inventory` | `quantity_on_hand ≥ 0`, `quantity_reserved ≥ 0`, `quantity_reserved ≤ quantity_on_hand`, `UNIQUE(warehouse_id, batch_id)` | Không âm kho, không giữ quá số đang có |
| `product_variants` | `UNIQUE(sku)`, `compare_at_price ≥ price`, `net_weight_g > 0` | |
| `product_batches` | `UNIQUE(batch_code)`, `UNIQUE(qr_code)`, `expires_on > manufactured_on` | |
| `coupons` | `UNIQUE(code)` (citext, không phân biệt hoa thường), `percent ≤ 100`, `ends_at > starts_at` | |
| `flash_sale_items` | `sold_count ≤ quantity_limit` | Không bán vượt suất flash sale |
| `loyalty_accounts` | `points_balance ≥ 0`, `lifetime_points ≥ 0` | |
| `reviews` | `rating 1..5`, `UNIQUE(user_id, order_item_id)` | Mỗi dòng đơn chỉ được đánh giá một lần |
| `carts` | `user_id IS NOT NULL OR session_token IS NOT NULL` | Giỏ của thành viên hoặc của khách vãng lai |
| `users` | `UNIQUE(email)` (citext), `UNIQUE(phone)`, `date_of_birth < CURRENT_DATE` | |
| `order_allocations` | `state IN ('reserved','shipped','released','returned')`, `quantity > 0` | |

**Hành vi xóa của khóa ngoại** (lấy từ `pg_constraint.confdeltype`):

- `orders` → `order_items`, `payments`, `shipments`, `order_status_history`, `coupon_usages`: **CASCADE**.
- `order_allocations` → `inventory`, `product_batches`: **NO ACTION**. Không xóa được lô/tồn đang được đơn tham chiếu.
- `products` → `categories`: **NO ACTION**. Không xóa được danh mục còn sản phẩm.
- `stock_movements` → `product_batches`: **RESTRICT**.
- `reviews` → `order_items`: **SET NULL**.
- `orders` → `users`: **SET NULL**. Giữ lịch sử đơn khi xóa người dùng.
- Sản phẩm xóa từ trang quản trị là **xóa mềm**: `deleted_at`, chuyển `status = discontinued`.

**Chỉ mục tìm kiếm**: `idx_products_search` (tsvector, cập nhật bằng trigger `trg_products_search`) và `idx_products_name_trgm` (pg_trgm) phục vụ tìm kiếm không dấu/gần đúng. Chỉ mục theo `status`, `placed_at`, `user_id` của `orders` phục vụ lọc và báo cáo.

## 5. Hàm và trigger nghiệp vụ

| Đối tượng | Vai trò |
|---|---|
| `fn_allocate_stock_fefo(variant, qty)` | Duyệt tồn theo lô còn hạn, `ORDER BY expires_on NULLS LAST`, khóa dòng `FOR UPDATE OF i`, tăng `quantity_reserved`. Thiếu hàng thì `RAISE EXCEPTION` |
| `trg_loyalty_apply` (trên `loyalty_transactions`) | Cộng/trừ `points_balance`; `earn`/`adjust` cập nhật `lifetime_points` và hạng |
| `trg_order_status_history`, `trg_order_status_stamp` | Ghi lịch sử mỗi lần đổi trạng thái; đóng dấu `confirmed_at`, `shipped_at`, `delivered_at`… |
| `trg_coupon_usage_count` | Đồng bộ số lượt dùng mã |
| `trg_nutrition_score` (+ `fn_nutri_score_points/grade`) | Tính Nutri-Score A–E khi lưu dữ liệu dinh dưỡng |
| `trg_reviews_rating`, `trg_review_votes_count` | Cập nhật điểm trung bình sản phẩm, số lượt “hữu ích” |
| `trg_variant_price_history` | Lưu lịch sử giá |
| `trg_health_profile_calc` (+ `fn_calc_bmi/bmr/target_calories`) | Tính BMI/BMR/calo trong CSDL, cùng công thức với `nutrition.calc.ts` |
| `trg_user_bootstrap` | Tạo `loyalty_accounts` (hạng thấp nhất) và `notification_preferences` cho người dùng mới |
| `trg_audit` (trên `orders`, `products`, `product_variants`, `coupons`) | Ghi `audit_logs`, lấy người thực hiện từ `app.current_user_id` do backend đặt trong transaction |
| `fn_generate_order_number` | Sinh mã đơn dạng `NTyyMMdd` + số thứ tự (ví dụ `NT261107000174`) |
| 9 view `v_*` | `v_low_stock`, `v_near_expiry`, `v_variant_stock`, `v_daily_revenue`, `v_top_selling_products`, `v_customer_stats`, `v_order_status_summary`, `v_product_catalog`, `v_traceability` |

## 6. Dữ liệu demo hiện có

Dữ liệu sinh bởi `npm run db:seed` (`backend/src/seed`). Tên và email người dùng là **dữ liệu giả** (`@example.com`, `@nutrio.vn`), không có dữ liệu cá nhân thật. Ảnh sản phẩm lấy từ Wikimedia Commons (`frontend/public/images/IMAGE_CREDITS.md`).

| Hạng mục | Giá trị thực tế trong CSDL |
|---|---|
| Danh mục | 3 danh mục gốc có sản phẩm (Các loại hạt, Dinh dưỡng chuyên biệt, Granola) + Combo; 8 danh mục con. 5 danh mục cũ từ `02_seed.sql` để ẩn (`is_active = false`) |
| Sản phẩm | 34 đang bán, 42 quy cách, 100% có ảnh. 5 sản phẩm “Hạt test E2E” đã xóa mềm (dữ liệu kiểm thử) |
| Kho | 2 kho (Kho trung tâm TP.HCM, Kho lạnh TP.HCM). 5 quy cách dưới ngưỡng tồn tối thiểu (`v_low_stock`, 4 quy cách hết hàng). 7 lô sắp hết hạn trong 30 ngày |
| Mã giảm giá | 8: `WELCOME10`, `FREESHIP`, `GIAM30K`, `NUTRIO50K`, `KETO20`, `SILVER8`, `GOLD15`, `HETHAN10` (đã hết hạn, dùng để minh họa) |
| Flash sale | 2 chương trình (4 sản phẩm). **Đã hết hạn lại từ 11/11/2026**; chạy `npm run db:refresh-demo -- --apply` ngay trước buổi demo |
| Đơn hàng | 151 (trong đó 11 đơn kiểm thử, §7), từ 03/08/2026 đến 14/11/2026 (đơn seed đến 31/10). Theo trạng thái: giao thành công 102, đã hủy 25, hoàn tất 10, hoàn trả 5, chờ xác nhận 3, đang giao 3, đã xác nhận 2, đang chuẩn bị 1. Sau khi dọn dữ liệu kiểm thử còn 140 đơn seed |
| Doanh thu (đơn giao thành công + hoàn tất) | 68.645.230đ trên 112 đơn |
| Khách hàng | 14 khách có lịch sử mua (5–17 đơn/khách) |
| Đánh giá | 122 (121 đã duyệt, điểm trung bình 4,48; 1 chờ duyệt) |
| Nội dung | 18 công thức, bài viết blog, banner, combo, quiz, trang tĩnh, gói giao định kỳ |

Lưu ý khi demo: đơn demo được sinh theo ngày chạy seed (31/10/2026). Vì vậy biểu đồ “30 ngày” trên dashboard gần như phẳng từ 31/10 đến nay. Muốn dữ liệu trải đều đến ngày bảo vệ thì phải seed lại (xem §9.3). Bước này xóa dữ liệu hiện có nên **chỉ làm khi đã sao lưu và được nhóm đồng ý**.

## 7. Dữ liệu kiểm thử và cách dọn

### 7.1 Nhận diện
Bộ kiểm thử E2E tạo dữ liệu có **dấu hiệu riêng**. Seed không bao giờ tạo các dấu hiệu này:

| Loại | Dấu hiệu |
|---|---|
| Đơn hàng | `idempotency_key` bắt đầu bằng `e2e-` (gồm `e2e-guest-`) hoặc `idem-key-`; email khách `guest@test.vn`; hoặc chứa sản phẩm SKU `TEST-*` |
| Sản phẩm | Quy cách có SKU bắt đầu bằng `TEST-` |
| Giỏ hàng | `session_token` bắt đầu bằng `guest-e2e-` hoặc `guest-test-token` |

Hiện tại (14/11/2026 14:09, sau lần chạy E2E cuối) có:

- **11 đơn**: #34 (chờ xác nhận, đang giữ hàng), #174–#183 (hoàn trả/hủy).
- **5 sản phẩm**: #62–#66, đã xóa mềm.
- **6 giỏ khách**, 15 giao dịch điểm và 5 đánh giá gắn với các đơn đó.

Danh sách chi tiết từng dòng, kèm kiểm tra khóa ngoại: [release/CLEANUP_PREVIEW.md](release/CLEANUP_PREVIEW.md).

Đơn seed #1 có `idempotency_key = NULL` nên không bị nhận nhầm.

### 7.2 Công cụ dọn: `npm run db:cleanup-test`
Script: `backend/scripts/cleanup-test-data.mjs`.

- **Mặc định chỉ chạy thử (dry run)**: liệt kê dữ liệu sẽ bị dọn, sau đó `ROLLBACK`.
- `npm run db:cleanup-test -- --apply` thực hiện trong **một transaction**. Script đảo ngược tác động phụ trước khi xóa, theo thứ tự:
  1. Nhả hàng đang giữ và cộng lại hàng đã xuất.
  2. Giảm `sold_count` của flash sale và sản phẩm.
  3. Hoàn tác điểm: số dư, điểm tích lũy, tính lại hạng.
  4. Xóa đánh giá, lượt dùng mã, thông báo, nhật ký kho của các đơn đó.
  5. Xóa đơn. Dòng đơn, phân bổ, thanh toán, lịch sử và vận đơn được xóa theo CASCADE.
  6. Xóa lô, tồn và sản phẩm `TEST-*`.
  7. Xóa giỏ test.
- Gặp lỗi bất kỳ thì toàn bộ được hoàn tác.

**Đã kiểm thử ngày 07/11/2026 trên bản sao của bản sao lưu** (cụm PostgreSQL tạm trên cổng 5434, không phải CSDL thật):

| Chỉ số | Trước | Sau |
|---|---|---|
| Đơn hàng | 147 | 140 |
| Sản phẩm | 37 | 34 |
| Doanh thu đơn giao thành công | 68.645.230đ | 68.645.230đ (không đổi) |
| Tồn đang giữ lệch với phân bổ | 0 | 0 |
| Số dư điểm lệch với tổng giao dịch | 0 | 0 |
| Giỏ test | 4 | 0 |

Lần chạy thử thứ hai sau khi dọn không còn gì để dọn. Lần thử đầu tiên phát hiện một lỗi SQL (cột `quantity` mơ hồ); transaction đã tự hoàn tác, lỗi đã được sửa và chạy lại thành công.

**Chưa chạy `--apply` trên CSDL thật.** Đây là việc nhóm cần quyết định trước khi nộp (xem [FINAL_HANDOVER_REPORT.md](../FINAL_HANDOVER_REPORT.md)). Thứ tự khuyến nghị:

```bash
cd backend
# dừng API, rồi dừng PostgreSQL an toàn
npm run db:stop
npm run db:backup
npm run db:start              # cửa sổ riêng
npm run db:cleanup-test       # xem danh sách
npm run db:cleanup-test -- --apply
```

Lưu ý: chạy lại `npm run test:e2e` sẽ sinh thêm dữ liệu kiểm thử mới (có cùng dấu hiệu, dọn lại được bằng lệnh trên).

## 8. Tách biệt với PostgreSQL của Odoo

Máy phát triển có sẵn PostgreSQL 12 phục vụ Odoo, chạy trên cổng **5432**. NUTRIO không dùng và không chạm vào cụm đó:

| | Odoo | NUTRIO |
|---|---|---|
| Phiên bản | PostgreSQL 12 (dịch vụ Windows) | PostgreSQL 18.6 (`embedded-postgres`, tiến trình do `npm run db:start` khởi động) |
| Cổng | 5432 | 5433 (đọc từ `DATABASE_URL`) |
| Thư mục dữ liệu | thư mục của Odoo | `backend/.pgdata` |
| Tài khoản | của Odoo | `postgres` / mật khẩu dev cục bộ trong `backend/.env` |

- `scripts/db.mjs` chỉ khởi tạo/khởi động cụm tại `backend/.pgdata` với cổng trong `DATABASE_URL`.
- Mọi lệnh `reset`, `backup`, `restore` chỉ thao tác trên CSDL/thư mục của NUTRIO.
- Trong quá trình phát triển không có thao tác nào kết nối tới cổng 5432.
- `docker-compose.yml` (từ repo gốc, chưa kiểm thử) mặc định dùng cổng 5432. Nếu chạy Docker trên máy có Odoo, đặt `POSTGRES_PORT=5434` (hoặc cổng trống khác) và cập nhật `DATABASE_URL`.

## 9. Sao lưu và khôi phục

Bản PostgreSQL nhúng không kèm `pg_dump`. Bản `pg_dump` của Odoo là v12, không dump được server v18. Vì vậy dự án dùng **sao lưu nguội (cold backup)**: sao chép nguyên thư mục dữ liệu khi server đã dừng.

### 9.1 Sao lưu
```bash
cd backend
# 1) Dừng API (Ctrl+C), rồi dừng PostgreSQL an toàn:
npm run db:stop              # pg_ctl stop -m fast
npm run db:backup            # → backend/backups/pgdata-YYYYMMDD-HHMMSS
npm run db:backups           # liệt kê các bản sao lưu
```

- Lệnh từ chối chạy nếu cổng 5433 còn mở, để tránh bản sao không nhất quán.
- Thư mục `backend/backups/` đã nằm trong `.gitignore`.
- **Đã kiểm thử 07/11/2026**: sao lưu 76 MB trong khoảng 1 giây. Khởi động một PostgreSQL tạm trên bản sao (cổng 5434) đọc được đủ 147 đơn, 37 sản phẩm, 18 người dùng, 3 migration.

### 9.2 Khôi phục
```bash
cd backend
# dừng API, rồi: npm run db:stop
npm run db:restore -- pgdata-20261114-070924
npm run db:start
```

- Thư mục dữ liệu hiện tại **không bị xóa**: nó được đổi tên thành `backend/.pgdata.before-restore-<thời điểm>`. Thư mục này cũng đã được gitignore và có thể xóa thủ công khi chắc chắn không cần.
- Lệnh `restore` **chưa được chạy trên thư mục dữ liệu thật**. Cơ chế sao chép đã được kiểm chứng gián tiếp qua bước mở bản sao ở §9.1.

### 9.3 Tạo lại CSDL demo từ đầu (xóa dữ liệu)
```bash
npm run db:backup                 # bắt buộc sao lưu trước
npm run db:reset -- --yes         # DROP và tạo lại nutrio_db, chạy 01..05
npm run db:seed                   # nạp dữ liệu demo, ngày tháng tính theo thời điểm chạy
```

Lệnh này chỉ xóa CSDL `nutrio_db` trong cụm NUTRIO (cổng 5433), không ảnh hưởng Odoo.

### 9.4 Dùng PostgreSQL khác (tùy chọn)
Nếu chạy NUTRIO trên một PostgreSQL ≥ 14 riêng (không phải của Odoo):

1. Sửa `DATABASE_URL`.
2. Chạy các file `database/init/01..05` theo thứ tự.
3. Chạy `npx prisma generate && npm run db:seed`.

Với cách này có thể dùng `pg_dump`/`pg_restore` cùng phiên bản server để sao lưu.
