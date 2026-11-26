# Danh sách dữ liệu kiểm thử dự kiến xóa (xem trước)

- Sinh lúc 2026-11-14 14:09 (giờ Việt Nam).
- Truy vấn **chỉ đọc** (`BEGIN READ ONLY`) trên CSDL `nutrio_db`, cổng 5433. Không có thay đổi nào được thực hiện.
- Tiêu chí chọn giống hệt `backend/scripts/cleanup-test-data.mjs`.
- Chỉ xóa khi chạy `npm run db:cleanup-test -- --apply` **sau khi được đồng ý**.

## 1. Đơn hàng (11)

| ID | Mã đơn | Trạng thái | Thanh toán | Tổng | Đặt lúc | Khách | Dấu hiệu | Dòng hàng | Phân bổ kho |
|---|---|---|---|---|---|---|---|---|---|
| 34 | NT261031000034 | pending | bank_transfer / unpaid | 366.000đ | 2026-10-31 14:01 | guest@test.vn | key `idem-key-*` | MILK-1L ×2, GRA-400 ×2 | reserved |
| 174 | NT261107000174 | returned | cod / refunded | 137.500đ | 2026-11-07 13:25 | lan@example.com | key `e2e-*` | TEST-MW60RDGX ×3 | returned |
| 175 | NT261107000175 | cancelled | bank_transfer / unpaid | 125.000đ | 2026-11-07 13:25 | guest@test.vn | guest@test.vn | TEST-MW60RDGX ×2 | released |
| 176 | NT261107000176 | returned | cod / refunded | 137.500đ | 2026-11-07 13:26 | lan@example.com | key `e2e-*` | TEST-MW60SI2G ×3 | returned |
| 177 | NT261107000177 | cancelled | bank_transfer / unpaid | 125.000đ | 2026-11-07 13:26 | guest@test.vn | guest@test.vn | TEST-MW60SI2G ×2 | released |
| 178 | NT261107000178 | returned | cod / refunded | 137.500đ | 2026-11-07 14:03 | lan@example.com | key `e2e-*` | TEST-MW624KUF ×3 | returned |
| 179 | NT261107000179 | cancelled | bank_transfer / unpaid | 125.000đ | 2026-11-07 14:03 | guest@test.vn | key `e2e-guest-*` | TEST-MW624KUF ×2 | released |
| 180 | NT261107000180 | returned | cod / refunded | 137.500đ | 2026-11-07 14:51 | lan@example.com | key `e2e-*` | TEST-MW63U0SC ×3 | returned |
| 181 | NT261107000181 | cancelled | bank_transfer / refunded | 125.000đ | 2026-11-07 14:51 | guest@test.vn | key `e2e-guest-*` | TEST-MW63U0SC ×2 | released |
| 182 | NT261114000182 | returned | cod / refunded | 137.500đ | 2026-11-14 13:59 | lan@example.com | key `e2e-*` | TEST-MWG22FIW ×3 | returned |
| 183 | NT261114000183 | cancelled | bank_transfer / refunded | 125.000đ | 2026-11-14 13:59 | guest@test.vn | key `e2e-guest-*` | TEST-MWG22FIW ×2 | released |

### Bản ghi phụ thuộc của các đơn trên

| Bảng | Số dòng | Cách xử lý |
|---|---|---|
| `order_items` | 12 | CASCADE theo `orders` |
| `order_allocations` | 12 | CASCADE theo `order_items` (sau khi đã hoàn tác tồn kho) |
| `order_status_history` | 41 | CASCADE |
| `payments` | 11 | CASCADE |
| `payment_transactions` | 2 | CASCADE theo `payments` |
| `refunds` | 7 | CASCADE theo `payments` |
| `shipments` | 5 | CASCADE |
| `shipment_events` | 15 | CASCADE theo `shipments` |
| `returns` | 0 | CASCADE |
| `coupon_usages` | 1 | Xóa trực tiếp (trigger trả lại lượt dùng mã) |
| `loyalty_transactions` | 15 | Hoàn tác số dư / điểm tích lũy / hạng, rồi xóa |
| `reviews` | 5 | Xóa trực tiếp (trigger tính lại điểm trung bình sản phẩm) |
| `notifications` | 30 | Xóa trực tiếp (khớp `data.orderId`) |
| `stock_movements` | 10 | Xóa trực tiếp (`reference_type = order`) |

### Tồn kho được hoàn tác

| SKU | Phân bổ | SL | Tồn thực (hiện tại → sau) | Đang giữ (hiện tại → sau) |
|---|---|---|---|---|
| GRA-400 | reserved | 2 | 7 → 7 | 2 → 0 |
| MILK-1L | reserved | 2 | 90 → 90 | 2 → 0 |

### Suất flash sale được trả lại

- GRA-400 (giá 119.000đ): đã bán 11 → 9

### Điểm thưởng được hoàn tác

- **lan@example.com**: số dư 5165 → 5415; điểm tích lũy 5415 → 5415; hạng Gold → Gold.
  - Giao dịch bị xóa: redeem -50, earn 205, adjust -205, redeem -50, earn 205, adjust -205, redeem -50, earn 205, adjust -205, redeem -50, earn 205, adjust -205, redeem -50, earn 205, adjust -205.

## 2. Sản phẩm kiểm thử (5)

| ID | Tên | SKU | Trạng thái | Xóa mềm lúc | Lô | Tồn (thực / giữ) | Nhật ký kho |
|---|---|---|---|---|---|---|---|
| 62 | Hạt test E2E | TEST-MW60RDGX | discontinued | 2026-11-07 13:25 | 1 | 5 / 0 | 3 |
| 63 | Hạt test E2E | TEST-MW60SI2G | discontinued | 2026-11-07 13:26 | 1 | 5 / 0 | 3 |
| 64 | Hạt test E2E | TEST-MW624KUF | discontinued | 2026-11-07 14:03 | 1 | 5 / 0 | 3 |
| 65 | Hạt test E2E | TEST-MW63U0SC | discontinued | 2026-11-07 14:51 | 1 | 5 / 0 | 3 |
| 66 | Hạt test E2E | TEST-MWG22FIW | discontinued | 2026-11-14 13:59 | 1 | 5 / 0 | 3 |

- Các bảng con theo sản phẩm/quy cách (ảnh, dinh dưỡng, dị ứng, chế độ ăn, lịch sử giá, yêu thích…) xóa theo CASCADE.
- Lô, tồn và nhật ký kho của sản phẩm test được xóa trực tiếp trước, vì `stock_movements → product_batches` và `product_batches → product_variants` là RESTRICT.

## 3. Giỏ hàng khách vãng lai kiểm thử (6)

| ID | Session token | Tạo lúc | Số dòng |
|---|---|---|---|
| 1 | `guest-test-token-1234567890` | 2026-10-31 14:01 | 0 |
| 3 | `guest-e2e-1794032719783-xyz` | 2026-11-07 13:25 | 0 |
| 4 | `guest-e2e-1794032772271-xyz` | 2026-11-07 13:26 | 0 |
| 5 | `guest-e2e-1794035015420-xyz` | 2026-11-07 14:03 | 0 |
| 6 | `guest-e2e-1794037882003-xyz` | 2026-11-07 14:51 | 0 |
| 7 | `guest-e2e-1794639577033-xyz` | 2026-11-14 13:59 | 0 |

## 4. Kiểm tra khóa ngoại và an toàn (phải bằng 0)

| Kiểm tra | Kết quả |
|---|---|
| Quy cách test nằm trong combo (`bundle_items`, RESTRICT, sẽ chặn xóa) | **0** ✅ |
| Quy cách test nằm trong gói định kỳ (`subscription_items`, RESTRICT, sẽ chặn xóa) | **0** ✅ |
| Đơn **không** phải test chứa sản phẩm test | **0** ✅ |
| Đơn không phải test giữ hàng ở lô test (NO ACTION, sẽ chặn xóa) | **0** ✅ |
| Đơn do seed tạo (`seed-*`) bị chọn nhầm | **0** ✅ |
| Đơn của khách thật khác ngoài tài khoản dùng để test (`lan@example.com`) | **0** ✅ |

Lưu ý: các trigger audit (`trg_audit_orders`, `trg_audit_products`, `trg_audit_variants`) sẽ **thêm** dòng vào `audit_logs` khi xóa. Đây là nhật ký kiểm toán bình thường, không phải dữ liệu nghiệp vụ.

## 5. Chạy thử `--apply` trên bản sao (14/11/2026)

- Lệnh `--apply` được chạy trên **bản sao** của bản sao lưu `backend/backups/pgdata-20261114-070924`, ở một cụm PostgreSQL tạm, cổng 5434, thư mục tạm ngoài repo.
- Bản sao lưu này chụp đúng trạng thái của danh sách trên, sau khi server được dừng sạch bằng `pg_ctl stop -m fast`.
- **CSDL thật không bị thay đổi** (vẫn 151 đơn).

| Chỉ số | Trước | Sau |
|---|---|---|
| Đơn hàng | 151 | 140 |
| Sản phẩm (gồm đã xóa mềm) | 39 | 34 |
| Sản phẩm đang bán | 34 | 34 |
| Người dùng | 18 | 18 |
| Mã giảm giá | 8 | 8 |
| Doanh thu đơn giao thành công + hoàn tất | 68.645.230đ | 68.645.230đ |
| Đánh giá | 124 | 119 |
| Điểm của `lan@example.com` (số dư / tích lũy, hạng) | 5165 / 5415, Gold | 5415 / 5415, Gold |
| Giỏ test | 6 | 0 |
| Tồn đang giữ lệch với phân bổ | 0 | 0 |
| Số dư điểm lệch với tổng giao dịch | 0 | 0 |
| Dòng đơn mồ côi | 0 | 0 |

Chạy dry-run lần hai sau khi dọn: 0 đơn, 0 sản phẩm, 0 giỏ.

## 6. Khôi phục nếu cần

```bash
cd backend
# dừng API và PostgreSQL trước
npm run db:restore -- pgdata-20261114-070924
npm run db:start
```

Dữ liệu hiện tại sẽ được đổi tên thành `backend/.pgdata.before-restore-<thời điểm>`, không bị xóa.
