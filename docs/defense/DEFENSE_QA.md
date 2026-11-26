# Câu hỏi bảo vệ dự kiến (45 câu)

Mỗi câu trả lời đều dẫn tới file mã nguồn hoặc số liệu kiểm thử để nhóm có thể mở ra chứng minh khi hội đồng hỏi sâu. Đường dẫn tính từ thư mục gốc repo.

---

## A. Tổng quan và phạm vi

**1. Dự án giải quyết vấn đề gì?**
Bán hạt dinh dưỡng, granola và thực phẩm lành mạnh trực tuyến, kèm công cụ giúp khách biết **ăn bao nhiêu và có hợp với mình không**: BMI/BMR/TDEE, quiz, lọc dị ứng, thực đơn 7 ngày, Nutri-Score. Phía cửa hàng, hệ thống quản lý tồn kho **theo lô và hạn dùng**, vì thực phẩm có HSD.

**2. Hệ thống có những vai trò nào?**
Khách vãng lai, khách hàng, nhân viên bán hàng, nhân viên kho, nhân viên CSKH, Super Admin. Vai trò nằm trong bảng `roles`; quyền nằm trong `permissions` và `role_permissions`. Chi tiết: `docs/ROLE_PERMISSION.md`.

**3. Điểm khác biệt so với một website bán hàng thông thường?**
(1) Giữ hàng theo lô hết hạn sớm nhất (FEFO) ngay khi đặt. (2) Giá tính lại hoàn toàn ở server, trong cùng transaction tạo đơn. (3) Công cụ dinh dưỡng cá nhân hóa gắn với gợi ý sản phẩm. (4) Phân quyền chi tiết theo 15 quyền thay vì chỉ admin/user.

**4. Chức năng nào chưa hoàn thiện?**
- VNPay/MoMo đã có mã ký và xác minh chữ ký nhưng **chưa thử với cổng sandbox** vì chưa có khóa.
- Email cần SMTP.
- Vận chuyển là mô phỏng nội bộ.
- Chưa có unit test và CI.
- Docker chưa kiểm thử.

Danh sách đầy đủ ở `FINAL_HANDOVER_REPORT.md`.

**5. Dữ liệu demo lấy từ đâu, có dữ liệu cá nhân thật không?**
Sinh bởi `backend/src/seed/seed.ts`. Tên và email là dữ liệu giả (`@example.com`, `@nutrio.vn`). Ảnh sản phẩm lấy từ Wikimedia Commons (`frontend/public/images/IMAGE_CREDITS.md`). Dữ liệu dinh dưỡng là giá trị tham khảo.

## B. Kiến trúc và công nghệ

**6. Kiến trúc tổng thể?**
Client–server 3 lớp: Next.js (giao diện) → NestJS REST API `/api/v1` → PostgreSQL. Frontend không truy cập CSDL trực tiếp, mọi thứ đi qua API. Sơ đồ: `docs/diagrams/component-diagram.md`.

**7. Vì sao tách frontend và backend thay vì dùng API route của Next.js?**
- Nghiệp vụ (transaction, cron, phân quyền) tập trung một chỗ, có thể dùng chung cho app di động sau này.
- NestJS có sẵn module/DI/guard/pipe, phù hợp nghiệp vụ nhiều tầng.
- Hai phần build, chạy và kiểm thử độc lập. Bộ E2E gọi thẳng API.

**8. Vì sao chọn PostgreSQL?**
Cần transaction ACID, khóa dòng (`SELECT … FOR UPDATE`), ràng buộc CHECK/FK chặt, trigger/hàm PL/pgSQL. Có extension tìm kiếm không dấu (`unaccent`, `pg_trgm`) và kiểu `citext` cho email/mã giảm giá không phân biệt hoa thường.

**9. Prisma đóng vai trò gì, vì sao không dùng `prisma migrate`?**
Prisma là client truy vấn có kiểu (type-safe). Schema được viết bằng SQL thuần (`database/init/*.sql`) vì có nhiều trigger/hàm/view mà Prisma migrate không quản lý tốt. Sau đó dùng `prisma db pull` để sinh `schema.prisma`. Migration được theo dõi bằng bảng `_sql_migrations` (`backend/scripts/db.mjs`).

**10. Vì sao dùng PostgreSQL nhúng (embedded-postgres)?**
Máy phát triển đã có PostgreSQL 12 của Odoo ở cổng 5432, không được đụng vào. `embedded-postgres` chạy một cụm PostgreSQL 18 riêng ở cổng 5433, dữ liệu trong `backend/.pgdata`, không cần cài đặt và không ảnh hưởng Odoo.

**11. State phía frontend quản lý thế nào?**
- Dữ liệu từ server: TanStack Query (cache, refetch, invalidation).
- Trạng thái client: Zustand. `auth` lưu người dùng/quyền; `prefs` lưu dị ứng và calo mục tiêu trong localStorage; `ui` quản lý hộp xác nhận.
- Form: React Hook Form + Zod.

**12. Request đi qua những lớp nào ở backend?**
Helmet → CORS → `ValidationPipe` (whitelist, chặn trường thừa) → `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard` → controller → service → Prisma. Lỗi được chuẩn hóa bởi `AllExceptionsFilter`. Xem `backend/src/main.ts`, `app.module.ts`.

## C. Cơ sở dữ liệu

**13. CSDL có bao nhiêu bảng, ràng buộc?**
108 bảng, 9 view + 1 materialized view, 159 khóa ngoại, 48 UNIQUE, 68 CHECK, 229 chỉ mục, 40 trigger. Số liệu truy vấn từ `information_schema`/`pg_constraint` ngày 07/11/2026.

**14. Làm sao đảm bảo tổng tiền đơn hàng không sai?**
Hai lớp:
1. Server tự tính (`PricingService.quote`), không nhận giá từ client.
2. Bảng `orders` có `CHECK (total_amount = subtotal − discount_amount − points_discount + shipping_fee + tax_amount)`. Nếu code có lỗi, CSDL vẫn từ chối ghi.

**15. Làm sao không bao giờ âm kho?**
- `inventory` có `CHECK quantity_on_hand ≥ 0`, `quantity_reserved ≥ 0`, `quantity_reserved ≤ quantity_on_hand`.
- Hàm `fn_allocate_stock_fefo` khóa dòng tồn (`FOR UPDATE OF i`) và `RAISE EXCEPTION` khi thiếu hàng.
- Xuất hủy trong trang quản trị chỉ cho xuất tối đa phần chưa bị giữ (`admin-inventory.controller.ts`).

**16. FEFO là gì, cài đặt thế nào?**
First Expired, First Out: lô hết hạn sớm nhất được xuất trước. `fn_allocate_stock_fefo(variant, qty)` (`database/init/01_schema.sql`) duyệt các lô còn hạn theo `ORDER BY expires_on NULLS LAST`, tăng `quantity_reserved` từng lô cho đến đủ số lượng. Kết quả ghi vào `order_allocations` để biết đơn lấy hàng từ lô nào.

**17. Trigger được dùng vào việc gì?**
- Cộng/trừ điểm và tính hạng (`trg_loyalty_apply`).
- Lịch sử và dấu thời gian trạng thái đơn.
- Nutri-Score, điểm đánh giá trung bình, lịch sử giá.
- Audit log.
- Tạo tài khoản điểm cho người dùng mới.
- `updated_at`.

Tổng cộng 40 trigger. Danh sách ở `docs/DATABASE_DESIGN.md §5`.

**18. Xóa sản phẩm có làm mất lịch sử đơn hàng không?**
Không.
- Trang quản trị chỉ **xóa mềm** (`deleted_at`, `status = discontinued`).
- `order_items` lưu bản chụp tên, SKU, đơn giá tại thời điểm đặt.
- Khóa ngoại `order_allocations → inventory/product_batches` là NO ACTION, nên không xóa được lô đang có đơn tham chiếu.

**19. Vì sao lưu điểm bằng bảng giao dịch thay vì chỉ một cột số dư?**
Để có lịch sử (`loyalty_transactions`: earn/redeem/refund/adjust) và hoàn tác được. Số dư trong `loyalty_accounts` do trigger cập nhật. Đã kiểm tra: tổng giao dịch luôn bằng số dư (0 tài khoản lệch, kiểm tra trên bản sao CSDL).

**20. Đã sửa lỗi gì ở trigger điểm?**
Bản gốc dùng `INSERT … ON CONFLICT DO UPDATE`. PostgreSQL kiểm tra CHECK (`points_balance ≥ 0`) trên dòng INSERT dự kiến trước khi xét xung đột, nên giao dịch trừ điểm (số âm) luôn lỗi. File `05_fix_loyalty_trigger.sql` đổi thành UPDATE trước, chỉ INSERT khi chưa có dòng. Kịch bản E2E #19 kiểm chứng.

**21. Sao lưu và khôi phục thế nào?**
- Sao lưu nguội: dừng server, rồi `npm run db:backup` sao chép `backend/.pgdata`. Lý do: bản nhúng không có `pg_dump`, còn `pg_dump` của Odoo là v12 không dump được server v18.
- Khôi phục: `npm run db:restore -- <tên>`. Dữ liệu hiện tại được đổi tên, không xóa.
- Đã kiểm thử: mở bản sao lưu trên cổng 5434 đọc đủ dữ liệu.

## D. Nghiệp vụ

**22. Mô tả luồng đặt hàng.**
`OrdersService.placeOrder` chạy trong một transaction:
1. Khóa mã giảm giá.
2. Định giá lại và kiểm tồn.
3. Báo giá chế độ strict.
4. Tạo đơn.
5. Giữ hàng FEFO cho từng dòng; tăng suất flash sale có điều kiện.
6. Ghi lượt dùng mã, trừ điểm.
7. Tạo bản ghi thanh toán, xóa dòng giỏ, tạo thông báo.

Lỗi ở bất kỳ bước nào sẽ rollback toàn bộ. Sơ đồ: `docs/diagrams/sequence-order.md`.

**23. Bấm “Đặt hàng” hai lần có tạo hai đơn không?**
Không.
- Frontend sinh `idempotencyKey` cho mỗi lần đặt; cột này UNIQUE.
- Backend tìm thấy khóa đã tồn tại thì trả lại đơn cũ.
- Hai request đồng thời: request sau vi phạm UNIQUE và bị từ chối.

Kịch bản E2E #20 kiểm chứng.

**24. Hai người cùng dùng mã giảm giá còn 1 lượt thì sao?**
Transaction tạo đơn khóa dòng mã (`SELECT … FROM coupons … FOR UPDATE`). Người thứ hai phải chờ người thứ nhất commit; khi kiểm tra lại, mã đã hết lượt nên báo lỗi. Trigger `trg_coupon_usage_count` đồng bộ số lượt.

**25. Hai người cùng mua món cuối cùng thì sao?**
`fn_allocate_stock_fefo` khóa các dòng `inventory` bằng `FOR UPDATE`. Transaction thứ hai chờ, sau đó thấy không đủ hàng và `RAISE EXCEPTION`. Đơn thứ hai rollback và khách nhận thông báo “Không đủ hàng”.

**26. Giá được tính theo thứ tự nào?**
Đơn giá (flash sale nếu còn suất) → tạm tính → ưu đãi hạng (0/3/5%) → mã giảm giá → phí ship (theo ngưỡng của phương thức và hạng) → điểm (tối đa 50% đơn, 1 điểm = 100đ) → tổng → điểm sẽ nhận (1 điểm/1.000đ × hệ số hạng 1,0/1,2/1,5). Code: `backend/src/modules/pricing/pricing.service.ts`.

**27. Khi nào trừ kho thật?**
- Lúc đặt chỉ **giữ** (`quantity_reserved`).
- Khi chuyển sang **Đang giao** mới trừ `quantity_on_hand` và ghi `stock_movements (sale_out)`.
- Hủy thì nhả phần giữ; hoàn trả thì cộng lại kho (`return_in`).

E2E #22, #24, #30, #37 kiểm chứng.

**28. Có những trạng thái đơn nào, chuyển thế nào?**
8 trạng thái: pending, confirmed, processing, shipping, delivered, completed, cancelled, returned. Bảng chuyển hợp lệ ở `backend/src/modules/orders/order-status.ts` (`ORDER_TRANSITIONS`). Chuyển sai, ví dụ pending → shipping, bị 400 (E2E #23). Mọi chuyển đổi đi qua `OrderLifecycleService.transition`.

**29. Hủy đơn hoàn lại những gì?**
Nhả hàng đang giữ, hoàn điểm đã dùng, trả lượt mã giảm giá (xóa `coupon_usages`), đánh dấu thanh toán `refunded` và tạo `refunds` nếu đã trả tiền (E2E #36). Khách chỉ tự hủy được khi đơn còn Chờ xác nhận hoặc Đã xác nhận.

**30. Khi nào COD và chuyển khoản được tính là đã thanh toán?**
- COD: khi đơn chuyển sang **Giao thành công**.
- Chuyển khoản: chỉ khi nhân viên có quyền `payment.confirm` bấm xác nhận sau khi kiểm tra tài khoản.

Hệ thống không có “thanh toán giả”. E2E #26, #35.

**31. VNPay xác minh thế nào để chống giả mạo?**
Backend tính lại HMAC-SHA512 trên các tham số trả về bằng `VNPAY_HASH_SECRET` và so với `vnp_SecureHash`. Ngoài ra kiểm tra `vnp_Amount` khớp tổng đơn, `vnp_ResponseCode` và `vnp_TransactionStatus` bằng `00`. Có cả đường IPN server-to-server. **Lưu ý: chưa thử với cổng thật.**

**32. Đơn thanh toán online bỏ dở thì hàng bị giữ mãi?**
Không. `OrdersCron` chạy mỗi 10 phút, hủy đơn VNPay/MoMo còn `pending` quá 60 phút; việc hủy sẽ nhả hàng, hoàn điểm và lượt mã (`backend/src/modules/orders/orders.cron.ts`).

**33. Ai được đánh giá sản phẩm?**
Chỉ người có dòng đơn đã **giao thành công/hoàn tất**, mỗi dòng đơn một lần (`UNIQUE(user_id, order_item_id)`). Nội dung được lọc thẻ HTML và ký tự điều khiển. E2E #27, #28.

**34. Tính BMR/TDEE thế nào? Cho ví dụ.**
Mifflin–St Jeor: BMR = 10·kg + 6,25·cm − 5·tuổi + s (s = +5 nam, −161 nữ); TDEE = BMR × hệ số vận động (1,2…1,9).

Ví dụ (đúng tham số của kịch bản E2E #38): nữ, 28 tuổi, 160 cm, 55 kg, vận động nhẹ, mục tiêu giảm cân.
- BMR = 10·55 + 6,25·160 − 5·28 − 161 = 550 + 1000 − 140 − 161 = **1.249 kcal**.
- TDEE = 1.249 × 1,375 = 1.717,4 → **1.717 kcal**.
- Calo mục tiêu = max(1.717 − 500, 1.200) = **1.217 kcal**.

Code: `backend/src/modules/nutrition/nutrition.calc.ts`.

**35. Vì sao dùng ngưỡng BMI châu Á?**
Người châu Á có tỷ lệ mỡ cao hơn ở cùng BMI. WHO khu vực Tây Thái Bình Dương đề xuất: thừa cân từ 23, béo phì từ 25. Code dùng 18,5 / 23 / 25 / 30.

**36. Thực đơn 7 ngày tạo ra thế nào?**
Chia calo mục tiêu theo bữa: sáng 25%, trưa 35%, tối 30%, phụ 10%. Với mỗi bữa, chọn công thức phù hợp loại bữa, gần mức calo và không chứa chất gây dị ứng đã chọn. Có thể đổi từng món (`/meal-plans/swap`) và thêm nguyên liệu NUTRIO đang bán vào giỏ. Code: `backend/src/modules/recipes/recipes.service.ts`. E2E #39.

## E. Bảo mật và phân quyền

**37. Xác thực bằng gì?**
- JWT Bearer, ký bằng `JWT_SECRET`, hết hạn 7 ngày (`JWT_EXPIRES_IN`).
- Mật khẩu băm bằng bcrypt (10 vòng).
- Token đặt lại mật khẩu lưu dạng băm SHA-256 và chỉ dùng một lần.

**38. Phân quyền kiểm tra ở đâu? Nếu sửa frontend để hiện nút thì sao?**
Ở backend. `RolesGuard` toàn cục so `@RequirePermissions` với quyền của user. Frontend chỉ ẩn/hiện giao diện. Gọi API trực tiếp vẫn bị 403: đã kiểm tra 6 tài khoản × 11 endpoint, và E2E #3–#10, #34.

**39. Khóa tài khoản hoặc bớt quyền thì token cũ còn dùng được không?**
Không. `JwtStrategy.validate()` đọc lại người dùng, `is_active`, vai trò và quyền **ở mỗi request**, nên thay đổi có hiệu lực ngay ở request tiếp theo. Đánh đổi: thêm một truy vấn mỗi request.

**40. Hệ thống chống những tấn công nào?**
- **SQL injection**: Prisma tham số hóa, `$queryRaw` dùng template tag.
- **XSS**: React tự escape; nội dung đánh giá được lọc thẻ.
- **Mass assignment**: `ValidationPipe` với whitelist + `forbidNonWhitelisted`.
- **Brute force**: Throttler, 10 lần đăng nhập/phút.
- **Header bảo mật**: Helmet. **CORS** chỉ cho `FRONTEND_URL`.
- **Giả giá**: giá tính ở server và có CHECK trong CSDL.

**41. Điểm yếu bảo mật còn lại?**
- Token lưu trong `localStorage` nên dễ bị đánh cắp nếu có XSS. Cookie httpOnly sẽ tốt hơn.
- Chưa có refresh token hay thu hồi token theo phiên.
- Chưa có 2FA.
- Ảnh upload lưu trên đĩa máy chủ.

## F. Kiểm thử và chất lượng

**42. Kiểm thử như thế nào?**
- `backend/test/e2e-api.mjs`: 41 kịch bản gọi API thật, kiểm tra cả dữ liệu sau mỗi bước (tồn kho, điểm, trạng thái thanh toán). Kết quả **41/41**.
- TypeScript, ESLint/oxlint và `next build` đều đạt.
- Kiểm thử giao diện tự động 25 trang, không lỗi console.

Báo cáo: `docs/TESTING_REPORT.md`.

**43. Vì sao không có unit test?**
Thời gian tập trung vào kiểm thử end-to-end vì rủi ro lớn nhất nằm ở sự phối hợp transaction–trigger–CSDL, mà unit test với mock không bắt được (ví dụ lỗi trigger điểm). Đây là giới hạn đã ghi nhận. Bước tiếp theo nên viết unit test cho `PricingService` và `nutrition.calc.ts`.

**44. Kiểm thử phát hiện lỗi gì?**
- Lỗi trigger điểm (câu 20).
- Trang thực đơn bị lỗi khi API trả thân rỗng: `'' ?? null` vẫn là `''`.
- Script dọn dữ liệu bị lỗi cột `quantity` mơ hồ: phát hiện khi chạy thử trên bản sao CSDL, nhờ transaction nên không ảnh hưởng gì.

Tất cả đã sửa và chạy lại đạt. Xem `docs/TESTING_REPORT.md §5`.

**45. Dữ liệu sinh ra khi kiểm thử xử lý thế nào?**
Dữ liệu kiểm thử có dấu hiệu riêng (`TEST-*`, `e2e-*`, `guest-e2e-*`). `npm run db:cleanup-test` mặc định chỉ liệt kê; thêm `--apply` mới xóa, trong một transaction, có đảo ngược tồn kho/điểm/lượt bán. Đã chạy thử `--apply` trên bản sao CSDL: dọn 7 đơn, 3 sản phẩm, 4 giỏ; doanh thu và các chỉ số toàn vẹn không đổi.
