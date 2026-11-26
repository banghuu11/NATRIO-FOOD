# Báo cáo kiểm thử

- **Ngày chạy**: 07/11/2026.
- **Môi trường**: Windows 11, Node.js 24.18, PostgreSQL 18.6 (embedded, cổng 5433), API `node dist/main.js` (cổng 5001), Next.js dev (cổng 3000), Microsoft Edge 157.
- Mọi kết quả dưới đây là kết quả **chạy thật** trong phiên đóng gói. Hạng mục nào chưa kiểm thử được ghi rõ ở §6.

## 1. Tổng hợp

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| TypeScript backend | `cd backend && npx tsc --noEmit` | ✅ 0 lỗi |
| Build backend | `npx nest build` | ✅ thành công |
| Lint backend | `npx oxlint -c oxlint.json src` | ✅ 0 cảnh báo, 0 lỗi |
| TypeScript frontend | `cd frontend && npx tsc --noEmit` | ✅ 0 lỗi |
| Lint frontend | `npx eslint .` | ✅ 0 lỗi, 2 cảnh báo (§4) |
| Build production frontend | `npx next build` | ✅ thành công, 48 route (42 trang sinh tĩnh) |
| Kiểm thử API end-to-end | `cd backend && npm run test:e2e` | ✅ **41/41 đạt** |
| Kiểm thử giao diện (trình duyệt tự động) | puppeteer-core + Edge, 25 trang với 4 tài khoản | ✅ 0 lỗi console sau khi sửa 1 lỗi (§5) |
| Phân quyền thực tế 6 tài khoản demo | gọi 11 endpoint quản trị bằng từng tài khoản | ✅ khớp ma trận ([ROLE_PERMISSION.md §4](ROLE_PERMISSION.md#4-kết-quả-kiểm-tra-thực-tế)) |
| Sao lưu CSDL | `npm run db:backup` + mở bản sao trên cổng 5434 | ✅ |
| Công cụ dọn dữ liệu kiểm thử | `cleanup-test-data.mjs --apply` trên **bản sao** CSDL | ✅ sau khi sửa 1 lỗi SQL ([DATABASE_DESIGN.md §7.2](DATABASE_DESIGN.md#72-công-cụ-dọn-npm-run-dbcleanup-test)) |
| Unit test | — | ⚠️ **Không có** (xem §6) |

## 2. Kiểm thử API end-to-end (`backend/test/e2e-api.mjs`)

- **Điều kiện**: CSDL đã seed, API chạy ở `http://localhost:5001` (đổi bằng biến `API_URL`).
- Script gọi API thật (không mock) và kiểm tra cả dữ liệu trong hệ thống sau mỗi bước: tồn kho, điểm, trạng thái thanh toán.

| # | Kịch bản | Kết quả |
|---|---|---|
| 1 | Đăng nhập 5 tài khoản demo (admin, sales, kho, cskh, lan) | PASS |
| 2 | Sai mật khẩu → 401 | PASS |
| 3 | Khách gọi API quản trị → 403 | PASS |
| 4 | Không đăng nhập gọi API quản trị → 401 | PASS |
| 5 | Nhân viên kho không quản lý được mã giảm giá | PASS |
| 6 | Nhân viên kho xem được tồn kho | PASS |
| 7 | Nhân viên bán hàng không vào được kho | PASS |
| 8 | CSKH duyệt được đánh giá | PASS |
| 9 | CSKH không đổi được trạng thái đơn | PASS |
| 10 | Bán hàng không quản lý được nhân viên | PASS |
| 11 | Dashboard trả KPI và chuỗi 30 ngày (doanh thu 68.645.230đ) | PASS |
| 12 | Xuất Excel báo cáo (content-type spreadsheet) | PASS |
| 13 | Xuất Excel đơn hàng bằng tài khoản bán hàng | PASS |
| 14 | Tạo sản phẩm; Nutri-Score được trigger tính (hạng C) | PASS |
| 15 | Giá so sánh nhỏ hơn giá bán → 400 | PASS |
| 16 | Nhân viên kho nhập 5 sản phẩm (tạo lô `LOT-TEST-…`) | PASS |
| 17 | Thêm 6 sản phẩm khi tồn chỉ có 5 → 400 “chỉ còn 5 sản phẩm” | PASS |
| 18 | Báo giá áp dụng 50 điểm | PASS |
| 19 | Đặt hàng có dùng điểm (kiểm chứng trigger điểm đã sửa) | PASS |
| 20 | Gửi lại cùng `idempotencyKey` → trả cùng đơn | PASS |
| 21 | Điểm bị trừ đúng (5315 → 5265) | PASS |
| 22 | Đặt hàng giữ 3 sản phẩm (`reserved = 3`) | PASS |
| 23 | Chuyển `pending → shipping` → 400 | PASS |
| 24 | Chuyển sang Đang giao trừ kho (`on_hand = 2`) | PASS |
| 25 | Khách không hủy được đơn đang giao | PASS |
| 26 | Giao thành công → COD thành “đã thanh toán” | PASS |
| 27 | Người đã mua đánh giá được | PASS |
| 28 | Người chưa mua không đánh giá được | PASS |
| 29 | Hoàn trả → hoàn tiền + thu hồi điểm (giao dịch âm) | PASS |
| 30 | Hoàn trả cộng lại kho (`on_hand = 5`) | PASS |
| 31 | Khách vãng lai đặt hàng chuyển khoản → có mã QR | PASS |
| 32 | Tra cứu đơn khách vãng lai bằng mã đơn + SĐT | PASS |
| 33 | Tra cứu với SĐT sai → 404 | PASS |
| 34 | Nhân viên kho không xác nhận được thanh toán → 403 | PASS |
| 35 | Nhân viên bán hàng xác nhận chuyển khoản → `paid` | PASS |
| 36 | Hủy đơn đã thanh toán → `refunded` | PASS |
| 37 | Hủy đơn nhả toàn bộ hàng đang giữ | PASS |
| 38 | BMR/TDEE: nữ 28 tuổi, 160 cm, 55 kg, vận động nhẹ → 1249 / 1717 kcal | PASS |
| 39 | Thực đơn 7 ngày (trung bình 1773 kcal cho mục tiêu 1800) | PASS |
| 40 | Gửi quiz → 8 sản phẩm gợi ý | PASS |
| 41 | Lọc dị ứng “hạt cây” → 5 sản phẩm an toàn | PASS |

**Kết quả: 41 passed, 0 failed.**

- Kịch bản 34–36 được thêm trong phiên đóng gói để kiểm chứng luồng xác nhận chuyển khoản.
- Các phiên trước chạy 38/38 kịch bản.

> Bộ kiểm thử tạo dữ liệu thật trong CSDL, gắn dấu hiệu `TEST-*`, `e2e-*`, `guest-e2e-*`. Dọn bằng `npm run db:cleanup-test -- --apply` (xem [DATABASE_DESIGN.md §7](DATABASE_DESIGN.md#7-dữ-liệu-kiểm-thử-và-cách-dọn)).

## 3. Kiểm thử giao diện

- Script puppeteer-core điều khiển Edge, mở từng trang, chờ mạng rảnh và chụp màn hình.
- Script **ghi lại mọi lỗi console và lỗi JavaScript chưa bắt**.
- Ảnh lưu ở [docs/screenshots/](screenshots/).

| Tài khoản | Trang | Lỗi console |
|---|---|---|
| Khách (không đăng nhập) | `/`, `/products`, `/products/[slug]`, `/health`, `/meal-plan`, `/quiz`, `/recipes`, `/track-order`, `/products` (mobile 390 px) | 0 (sau khi sửa lỗi §5) |
| `lan@example.com` | `/cart`, `/checkout`, `/account`, `/account/orders`, `/account/loyalty`, `/meal-plan` | 0 |
| `admin@nutrio.vn` | `/admin`, `/admin/orders`, `/admin/products`, `/admin/inventory`, `/admin/promotions`, `/admin/reports`, `/admin/staff`, `/admin/reviews`, `/admin/customers` | 0 |
| `kho@nutrio.vn` | `/admin` (menu chỉ còn 5 mục theo quyền) | 0 |

Các trang được kiểm tra lại vì có refactor trong phiên đóng gói: health, meal-plan, staff, hộp xác nhận, cart, checkout success, product detail, account profile.

## 4. Cảnh báo lint còn lại (không phải lỗi)

| File | Quy tắc | Giải thích |
|---|---|---|
| `frontend/src/app/(shop)/checkout/checkout.tsx:137` | `react-hooks/incompatible-library` | `watch()` của React Hook Form không tương thích React Compiler. Compiler bỏ qua tối ưu component này; chức năng không bị ảnh hưởng |
| `frontend/src/app/(shop)/register/page.tsx:41` | `react-hooks/incompatible-library` | Như trên |

## 5. Lỗi phát hiện và đã sửa trong phiên đóng gói

| # | Lỗi | Nguyên nhân | Cách sửa | Kiểm tra lại |
|---|---|---|---|---|
| 1 | Trang `/meal-plan` lỗi “Cannot read properties of undefined (reading 'find')” với người dùng đã đăng nhập nhưng chưa lưu thực đơn | API trả thân rỗng (`''`) khi không có thực đơn. `'' ?? null` vẫn là `''` nên `plan.days` là `undefined`. Lỗi phát sinh khi refactor bỏ `useEffect` để sửa cảnh báo lint | Chỉ coi là thực đơn đã lưu khi có `days` (`meal-plan/page.tsx`) | Chụp lại 3 trường hợp: khách, có `?kcal=`, đăng nhập → 0 lỗi |
| 2 | `cleanup-test-data.mjs --apply` báo `column reference "quantity" is ambiguous` | Truy vấn JOIN `order_allocations` và `order_items` (cả hai đều có cột `quantity`) | Ghi rõ `oa.quantity`, `oa.inventory_id` | Chạy lại trên bản sao CSDL: dọn đúng 7 đơn/3 sản phẩm/4 giỏ, các chỉ số toàn vẹn = 0 |
| 3 | Các lỗi ESLint frontend (setState trong effect, gọi `Date.now()` khi render, biến không dùng…) và 1 cảnh báo oxlint backend | Quy tắc React Compiler mới của `eslint-plugin-react-hooks` | Chuyển sang state suy diễn, lazy `useState`, `useSyncExternalStore`, `key` để reset form… | ESLint 0 lỗi; build, E2E và giao diện chạy lại đạt |

## 6. Chưa kiểm thử / giới hạn kiểm thử

| Hạng mục | Lý do |
|---|---|
| Thanh toán VNPay, MoMo | Chưa có khóa sandbox (`VNPAY_*`, `MOMO_*` trống). Hai phương thức tự ẩn ở checkout. Mã ký/xác minh chữ ký chưa được chạy với cổng thật |
| Gửi email thật | Chưa cấu hình SMTP. Email chỉ được ghi log |
| Cron tự hủy đơn online quá 60 phút | Phụ thuộc VNPay/MoMo; chưa có đơn online để kiểm tra |
| Giao hàng định kỳ (`/admin/subscriptions/run`) | Chưa có trong bộ E2E |
| Lệnh `db:restore` trên thư mục dữ liệu thật | Chưa chạy, để tránh rủi ro. Bản sao lưu đã được mở thử thành công |
| `docker-compose.yml`, `Dockerfile` | Máy không có Docker |
| Unit test | Dự án chưa có unit test. `backend/test/app.e2e-spec.ts` và `vitest.config*.ts` là file mẫu của khung NestJS (kiểm tra “Hello World”), vitest chưa được cài nên không chạy được |
| Hiệu năng, tải, bảo mật chuyên sâu (pentest) | Ngoài phạm vi |
| Trình duyệt khác Edge, thiết bị di động thật | Chỉ thử Edge desktop và giả lập màn hình 390 px |

## 7. Cách chạy lại

```bash
# Terminal 1
cd backend && npm run db:start
# Terminal 2
cd backend && npm run build && npm run start:prod      # hoặc npm run start:dev
# Terminal 3
cd backend && npx tsc --noEmit && npx oxlint -c oxlint.json src && npm run test:e2e
cd ../frontend && npx tsc --noEmit && npx eslint . && npx next build
```
