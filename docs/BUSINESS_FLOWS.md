# Quy trình nghiệp vụ

Mỗi quy trình ghi rõ file mã nguồn chịu trách nhiệm. Sơ đồ hoạt động/tuần tự nằm trong [diagrams/](diagrams/). Ký hiệu **[E2E]** nghĩa là bước đó được bộ kiểm thử `backend/test/e2e-api.mjs` kiểm tra (xem [TESTING_REPORT.md](TESTING_REPORT.md)).

## 1. Đăng ký, đăng nhập, phiên làm việc
`modules/auth`

1. **Đăng ký** (`POST /auth/register`):
   - Kiểm tra email/SĐT chưa tồn tại, băm mật khẩu bằng bcrypt (10 vòng), tạo `users` + vai trò `customer`.
   - Trigger `trg_user_bootstrap` tạo tài khoản điểm (hạng Bronze) và cấu hình thông báo.
   - Có thể kèm mã giới thiệu.
2. **Đăng nhập** (`POST /auth/login`):
   - So khớp bcrypt. Sai thì trả 401 “Email hoặc mật khẩu không chính xác” **[E2E]**.
   - Tài khoản bị khóa hoặc xóa thì trả 401.
   - Thành công trả JWT (hết hạn theo `JWT_EXPIRES_IN`, mặc định 7 ngày) và thông tin người dùng, vai trò, quyền.
3. **Mỗi request có token**:
   - `JwtStrategy.validate()` đọc lại người dùng, vai trò, quyền từ CSDL.
   - Khóa tài khoản hoặc đổi quyền **có hiệu lực ngay**, không cần chờ token hết hạn.
4. **Quên mật khẩu**:
   - Tạo token một lần trong `verification_tokens`, gửi email.
   - Nếu chưa cấu hình SMTP, liên kết được ghi log; ở môi trường dev, trang Quên mật khẩu hiển thị liên kết.
   - Đặt lại mật khẩu bằng token.
5. **Giới hạn tần suất**: đăng nhập/đăng ký/đặt lại tối đa 10 lần/phút, quên mật khẩu 5 lần/phút.
6. **Gộp giỏ**: frontend gọi `POST /cart/merge` sau khi đăng nhập để gộp giỏ khách vãng lai vào giỏ thành viên.

## 2. Giỏ hàng
`modules/carts`, `modules/pricing`

- Giỏ lưu ở server:
  - Thành viên: theo `user_id`.
  - Khách vãng lai: theo header `x-cart-token` (giá trị `guest-<uuid>` do trình duyệt sinh).
- Thêm hoặc sửa số lượng luôn kiểm tra tồn khả dụng (`on_hand − reserved` của các lô còn hạn). Vượt tồn thì trả 400 kèm số còn lại **[E2E]**.
- `GET /cart?selected=…` trả giỏ và **báo giá cho các dòng được chọn**, dùng chung `PricingService.quote()`.

## 3. Báo giá (PricingService)
`modules/pricing/pricing.service.ts`. Thứ tự tính:

1. **Đơn giá**: giá flash sale nếu đang diễn ra và còn suất, ngược lại là giá quy cách. Combo dùng giá combo.
2. **Tạm tính** = Σ đơn giá × số lượng.
3. **Ưu đãi hạng** = tạm tính × % hạng (Bronze 0%, Silver 3%, Gold 5%).
4. **Mã giảm giá**:
   - Kiểm tra còn hiệu lực, đơn tối thiểu, tổng lượt, lượt mỗi người, đơn đầu tiên, hạng tối thiểu.
   - Loại `percent` có trần `max_discount_amount`; loại `fixed_amount` trừ thẳng; loại `free_shipping` miễn phí ship.
5. **Tổng giảm** = min(tạm tính, ưu đãi hạng + mã).
6. **Phí ship**:
   - Phí cơ bản: Giao tiêu chuẩn 25.000đ, Giao nhanh 2 giờ 35.000đ, Giao lạnh trong ngày 45.000đ.
   - Miễn phí nếu tạm tính ≥ ngưỡng của phương thức (300.000đ / 500.000đ / 500.000đ).
   - Với giao tiêu chuẩn còn xét ngưỡng theo hạng: Bronze 300.000đ, Silver 200.000đ, Gold 0đ.
7. **Điểm dùng** ≤ min(số dư, ⌊(tạm tính − giảm) × 50% / 100⌋). 1 điểm = 100đ **[E2E]**.
8. **Tổng** = tạm tính − giảm − tiền điểm + phí ship. CSDL có CHECK đảm bảo đẳng thức này.
9. **Điểm sẽ nhận** = ⌊⌊tổng / 1.000⌋ × hệ số hạng⌋ (1,0 / 1,2 / 1,5). Chỉ cộng khi đơn giao thành công.

## 4. Đặt hàng
`modules/orders/orders.service.ts` → `placeOrder()`. Sơ đồ: [activity-order.md](diagrams/activity-order.md), [sequence-order.md](diagrams/sequence-order.md).

**Kiểm tra trước transaction**:
- Khách vãng lai phải có email.
- Phương thức thanh toán phải đang bật.
- Nếu `idempotency_key` đã tồn tại, **trả lại đơn cũ** thay vì tạo mới **[E2E]**.

**Trong một transaction** (`ReadCommitted`, timeout 30 giây):

1. Ghi người thực hiện vào `app.current_user_id` (cho audit).
2. Nếu có mã giảm giá: `SELECT … FROM coupons WHERE code = … FOR UPDATE` để khóa mã, chống vượt lượt dùng khi nhiều người đặt cùng lúc.
3. Định giá lại các dòng (đọc giá và tồn mới nhất). Thiếu hàng thì trả 400 “Không đủ hàng: …”.
4. Báo giá ở chế độ `strict`: mã hoặc phương thức giao không hợp lệ sẽ **chặn đơn** thay vì bỏ qua.
5. (Tùy chọn) lưu địa chỉ vào sổ địa chỉ.
6. Tạo `orders`:
   - `status = pending`.
   - `payment_status` là `pending` với VNPay/MoMo, `unpaid` với COD/chuyển khoản.
7. Với mỗi dòng: tạo `order_items`, gọi `fn_allocate_stock_fefo` để **giữ hàng theo lô hết hạn sớm nhất**, ghi `order_allocations (state = reserved)` **[E2E]**.
   - Dòng flash sale: tăng `sold_count` có điều kiện `sold_count + qty ≤ quantity_limit`. Hết suất thì rollback.
8. Ghi `coupon_usages`; ghi `loyalty_transactions (redeem, −điểm)`. Trigger trừ số dư **[E2E]**.
9. Tạo `payments (pending)`, xóa các dòng giỏ đã đặt, tạo thông báo.

**Sau transaction**:
- Gửi email xác nhận (nếu có SMTP).
- Trả `redirectUrl` cho VNPay/MoMo, hoặc thông tin VietQR cho chuyển khoản **[E2E]**.

## 5. Thanh toán
`modules/payments`, `OrderLifecycleService.markPaid()`. Sơ đồ: [sequence-payment.md](diagrams/sequence-payment.md).

| Phương thức | Khi nào “đã thanh toán” | Trạng thái kiểm thử |
|---|---|---|
| COD | Tự động khi đơn chuyển sang **Giao thành công** | **[E2E]** |
| Chuyển khoản (VietQR) | Nhân viên có quyền `payment.confirm` bấm xác nhận (`POST /admin/orders/:id/confirm-payment`) | **[E2E]** tạo đơn + QR; nhân viên kho bị chặn (403); nhân viên bán hàng xác nhận → `paid`; hủy đơn đã trả → `refunded` |
| VNPay | Khi `vnp_SecureHash` (HMAC-SHA512) hợp lệ và mã phản hồi thành công, qua `GET /payments/vnpay/verify` (sau redirect) hoặc IPN | **Chưa kiểm thử** – chưa có khóa sandbox |
| MoMo | Khi chữ ký HMAC-SHA256 hợp lệ, qua verify/IPN | **Chưa kiểm thử** – chưa có khóa sandbox |

- `markPaid()` bỏ qua nếu đơn đã trả tiền, và từ chối nếu đơn đã hủy hoặc hoàn trả.
- Mỗi lần xác nhận ghi `payment_transactions`.
- **Hủy tự động**: cron mỗi 10 phút hủy đơn VNPay/MoMo còn `pending` quá 60 phút, với lý do “Quá hạn thanh toán online (60 phút)”.
- **Thanh toán lại**: `POST /payments/retry/:orderNumber` tạo URL mới cho đơn chưa thanh toán.

## 6. Xử lý đơn hàng (vòng đời)
`modules/orders/order-status.ts`, `order-lifecycle.service.ts`. Sơ đồ: [sequence-order-management.md](diagrams/sequence-order-management.md).

```
pending ──▶ confirmed ──▶ processing ──▶ shipping ──▶ delivered ──▶ completed
   │            │              │             │            │             │
   └────────────┴──────────────┴─▶ cancelled └────────────┴─────────────┴─▶ returned
```

| Chuyển sang | Tác động (cùng transaction, đơn bị khóa `FOR UPDATE`) |
|---|---|
| `confirmed`, `processing` | Chỉ đổi trạng thái; trigger ghi lịch sử và đóng dấu thời gian |
| `shipping` | Phân bổ `reserved → shipped`: giảm `on_hand` và `reserved` **[E2E]**; ghi `stock_movements (sale_out)`; tạo vận đơn `NTR…` + 2 sự kiện hành trình |
| `delivered` | COD → `paid` **[E2E]**; tăng `products.sold_count`; vận đơn → delivered; cộng điểm `earn` |
| `completed` | Chỉ đổi trạng thái |
| `cancelled` | Phân bổ `reserved → released`, nhả hàng **[E2E]**; hoàn điểm đã dùng (`refund`); xóa `coupon_usages` (trả lượt mã); thanh toán `paid → refunded` và tạo `refunds` |
| `returned` | Phân bổ `shipped → returned`, cộng lại kho **[E2E]**; ghi `stock_movements (return_in)`; nếu đã giao thì giảm `sold_count` và thu hồi điểm đã cộng (`adjust` âm, không vượt số dư) **[E2E]**; hoàn tiền |

**Quy tắc chuyển trạng thái**:
- Chuyển không có trong bảng thì trả 400, ví dụ `pending → shipping` **[E2E]**.
- Khách chỉ tự hủy khi đơn ở `pending` hoặc `confirmed` **[E2E: không hủy được đơn đang giao]**.
- Chuyển sang `returned` cần thêm quyền `payment.confirm` (hoặc Super Admin), vì có hoàn tiền.
- Mỗi lần đổi trạng thái: thông báo trong tài khoản khách. Có SMTP thì gửi email ở các trạng thái `confirmed`, `shipping`, `delivered`, `cancelled`.

## 7. Kho theo lô (FEFO)
`modules/admin/admin-inventory.controller.ts`, `products/stock.service.ts`, hàm `fn_allocate_stock_fefo`. Sơ đồ: [activity-inventory.md](diagrams/activity-inventory.md).

- **Nhập kho** (`POST /admin/inventory/receive`): tạo `product_batches` (mã lô, NSX/HSD, mã QR truy xuất), cộng `inventory`, ghi `stock_movements (purchase_in)` **[E2E]**.
- **Xuất hủy** (`/issue`): giảm tồn có lý do hết hạn/hỏng (`expired`/`damaged`). **Kiểm kê** (`/adjust`): điều chỉnh về số thực tế (`adjustment`).
- **Tồn khả dụng** = Σ(`on_hand − reserved`) của các lô **còn hạn** ở kho đang hoạt động.
- **Cảnh báo**: `v_low_stock` (dưới ngưỡng tối thiểu), `v_near_expiry` (sắp hết hạn), hiển thị trên dashboard và trang kho.
- **Truy xuất nguồn gốc**: `GET /products/traceability/:qrCode` trả lô, nông trại, nhà cung cấp, chứng nhận.

## 8. Đánh giá sản phẩm
`modules/reviews`

- Chỉ người đã mua và có dòng đơn **giao thành công/hoàn tất** mới được đánh giá dòng đó, mỗi dòng một lần (UNIQUE) **[E2E: người chưa mua bị chặn]**.
- Nội dung được làm sạch thẻ HTML và ký tự điều khiển. Tối đa 5 ảnh.
- Nhân viên có `review.moderate` duyệt, từ chối hoặc phản hồi. Trigger cập nhật điểm trung bình sản phẩm.

## 9. Khuyến mãi và thành viên
- **Mã giảm giá**, **flash sale** (khung giờ, suất giới hạn), **combo** do người có `coupon.manage` quản lý.
- **Hạng**:
  - Bronze 0 điểm, Silver ≥ 1.000, Gold ≥ 5.000 điểm tích lũy (`lifetime_points`).
  - Hạng được trigger tính lại sau mỗi giao dịch `earn`/`adjust`.
- Ưu đãi hạng: % giảm, ngưỡng freeship, hệ số điểm, mã riêng (`SILVER8`, `GOLD15`).

## 10. Dinh dưỡng cá nhân hóa
`modules/nutrition/nutrition.calc.ts` (trùng công thức với trigger `trg_health_profile_calc`).

| Đại lượng | Công thức |
|---|---|
| BMI | kg / m². Phân loại châu Á–TBD: < 18,5 thiếu cân; < 23 bình thường; < 25 thừa cân; < 30 béo phì I; ≥ 30 béo phì II |
| BMR (Mifflin–St Jeor) | 10 × kg + 6,25 × cm − 5 × tuổi + s, với s = +5 (nam), −161 (nữ), −78 (khác) |
| TDEE | BMR × hệ số vận động 1,2 / 1,375 / 1,55 / 1,725 / 1,9 |
| Calo mục tiêu | Giảm cân: max(TDEE − 500, 1.200). Tăng cân: TDEE + 400. Tăng cơ: TDEE + 300. Còn lại: TDEE |
| Đạm | 2,0 g/kg (giảm cân, tăng cơ), 1,8 g/kg (tăng cân), 1,6 g/kg (khác) |
| Béo / tinh bột | Béo = 25% calo / 9. Tinh bột = phần calo còn lại / 4 |
| Nước | 35 ml × kg |

- Ví dụ đã kiểm thử: nữ, 28 tuổi, 160 cm, 55 kg, vận động nhẹ, mục tiêu giảm cân → BMR 1.249, TDEE 1.717, calo mục tiêu 1.217 **[E2E]**.
- **Quiz** (5 câu) → điểm theo hiệu ứng từng lựa chọn → gợi ý sản phẩm **[E2E]**.
- **Thực đơn 7 ngày**: chia calo sáng 25%, trưa 35%, tối 30%, phụ 10%; chọn công thức phù hợp bữa, loại công thức chứa chất gây dị ứng; đổi món, lưu, thêm nguyên liệu vào giỏ **[E2E]**.
- **Lọc dị ứng**: loại sản phẩm `contains`/`may_contain` chất đã chọn **[E2E]**.

## 11. Giao hàng định kỳ
`modules/subscriptions`

- Khách chọn gói (tuần / 2 tuần / tháng, có % giảm), sản phẩm, địa chỉ. Có thể tạm dừng, bỏ qua kỳ, hủy.
- Admin có `user.manage` chạy `POST /admin/subscriptions/run` để tạo đơn cho các kỳ đến hạn. Lệnh dùng lại `placeOrder()` với `extraDiscountPercent`.
- Chức năng này **chưa có trong bộ E2E**.
