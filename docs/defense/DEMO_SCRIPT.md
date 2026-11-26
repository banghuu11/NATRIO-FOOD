# Kịch bản demo (khoảng 7 phút, bản rút gọn 3,5 phút đánh dấu ⭐)

## 0. Chuẩn bị trước buổi bảo vệ (khoảng 10 phút, làm trước khi lên)

```bash
# Terminal 1
cd backend && npm run db:start
# Terminal 2
cd backend && npm run build && npm run start:prod
# Terminal 3
cd frontend && npm run build && npm run start     # bản production, không có nút "N" của dev
```

Checklist:

- [ ] `http://localhost:5001/api/v1/health` trả `"status":"ok"`.
- [ ] Flash sale còn hạn. Nếu mục Flash sale trên trang chủ trống, chạy `cd backend && npm run db:refresh-demo -- --apply`.
- [ ] (Khuyến nghị, nhóm quyết định) Dọn dữ liệu kiểm thử để dashboard không hiện đơn “Hạt test E2E”: `npm run db:backup` rồi `npm run db:cleanup-test -- --apply` (xem [DATABASE_DESIGN.md §7](../DATABASE_DESIGN.md#7-dữ-liệu-kiểm-thử-và-cách-dọn)).
  - **Không chạy `npm run test:e2e` sau bước này.** Lệnh đó sinh lại dữ liệu kiểm thử.
- [ ] Mở 3 cửa sổ trình duyệt **khác phiên** (thường / InPrivate / trình duyệt khác):
  - **A** – khách hàng `lan@example.com` / `User@123`.
  - **B** – nhân viên kho `kho@nutrio.vn` / `Staff@123`.
  - **C** – Super Admin `admin@nutrio.vn` / `Admin@123`. Dùng thêm `sales@nutrio.vn` khi cần.
- [ ] Giỏ của Lan nên trống. Phóng to trình duyệt 110–125% để hội đồng dễ nhìn.
- [ ] Mở sẵn trong VS Code: `orders.service.ts`, `order-lifecycle.service.ts`, `pricing.service.ts`, `permissions.ts`.

## 1. ⭐ Cửa hàng và dinh dưỡng (1 phút) – cửa sổ A, chưa đăng nhập
1. Trang chủ: chỉ banner, **Flash sale có đếm ngược**, combo.
2. Gõ `hat dieu` (không dấu) vào ô tìm kiếm. Gợi ý hiện ngay.
3. **Cửa hàng** → bật lọc “tránh dị ứng: Hạt cây”. Danh sách chỉ còn sản phẩm an toàn.
4. **Hồ sơ sức khỏe**: nữ, 28 tuổi, 160 cm, 55 kg, vận động nhẹ, mục tiêu Giảm cân.
   - Kết quả: **BMR 1.249 kcal, TDEE 1.717 kcal**. Con số này trùng với kịch bản E2E #38.
   - Nhấn mạnh: công thức Mifflin–St Jeor, ngưỡng BMI châu Á.
5. (Nếu còn thời gian) **Thực đơn 7 ngày** → **Tạo thực đơn**, đổi một món.

## 2. ⭐ Đặt hàng (1,5 phút) – cửa sổ A, đăng nhập Lan (hạng Gold)
1. Mở sản phẩm **Hạt Macca Đắk Lắk nứt vỏ sấy mộc**: chỉ HSD lô gần nhất, bảng dinh dưỡng, Nutri-Score. Bấm **Thêm vào giỏ**.
2. Trong giỏ, tăng số lượng vượt tồn (ví dụ sản phẩm sắp hết hàng): hệ thống báo “Chỉ còn N sản phẩm”. → *Tồn kiểm tra ở server.*
3. Nhập mã `GIAM30K` (đơn từ 200.000đ).
   - Chỉ **Ưu đãi hạng Gold −5%**, giảm giá mã, phí ship Miễn phí (Gold), widget dinh dưỡng của giỏ.
4. **Thanh toán** → 4 bước → dùng một ít điểm → chọn **COD** → Đặt hàng. **Ghi lại mã đơn** `NT…`.
5. Nói: “Cả đơn được tạo trong **một transaction**. Bấm 2 lần cũng chỉ ra 1 đơn nhờ `idempotencyKey`.” (Có thể mở `placeOrder()`.)

## 3. ⭐ Xử lý đơn và kho (1,5 phút) – cửa sổ B, nhân viên kho
1. Chỉ menu: kho chỉ thấy **5 mục**. So sánh với ảnh `admin-warehouse-role.jpg`.
2. **Kho hàng → Tồn kho**: tìm sản phẩm vừa đặt. Cột **Đang giữ** tăng đúng số lượng, **Khả dụng** giảm tương ứng.
3. **Đơn hàng** → mở đơn vừa đặt. Khung **Xử lý đơn hàng** chỉ hiện bước hợp lệ.
   - Chuyển Chờ xác nhận → Đã xác nhận → Đang chuẩn bị hàng → **Đang giao**.
   - Có mã vận đơn `NTR…`. Quay lại Kho: **Tồn thực** giảm, **Đang giữ** về 0.
4. Chuyển **Giao thành công**: thanh toán COD thành “Đã thanh toán”.
5. Quay lại cửa sổ A → **Tài khoản → Điểm thưởng / Thông báo**: điểm được cộng và có thông báo trạng thái đơn.

## 4. Chuyển khoản và phân quyền (1,5 phút)
1. Cửa sổ A (đăng xuất hoặc InPrivate, **khách vãng lai**): đặt một đơn chọn **Chuyển khoản**. Trang hiển thị **VietQR**. Ghi mã đơn.
2. Cửa sổ B (kho): mở đơn đó. **Không có** nút Xác nhận thanh toán, vì kho thiếu `payment.confirm`.
3. Cửa sổ C, đăng nhập `sales@nutrio.vn`: mở đơn → **Xác nhận thanh toán** → hộp xác nhận → trạng thái “Đã thanh toán”.
4. Chỉ **Tra cứu đơn hàng** bằng mã đơn + SĐT. Nhập SĐT sai thì không tìm thấy.
5. Nói: “Ẩn nút chỉ là giao diện. Gọi API trực tiếp cũng bị **403**; bộ E2E kiểm tra đúng trường hợp này (#34).”

## 5. ⭐ Quản trị (1 phút) – cửa sổ C, Super Admin
1. **Tổng quan**: KPI, biểu đồ, **Sắp hết hàng**, **Lô sắp hết hạn (30 ngày)**.
2. **Nhân viên & quyền**: ma trận 15 quyền × vai trò. Super Admin không chỉnh được (luôn toàn quyền).
3. **Báo cáo → Xuất Excel**: mở file tải về.
4. (Nếu được hỏi) **Kho → Nhập kho** tạo lô mới với HSD → lô xuất hiện trong “Lô hàng & hạn dùng”.

## 6. Kết thúc (15 giây)
“Toàn bộ luồng vừa demo đều có trong bộ kiểm thử API 41 kịch bản, chạy lại bằng `npm run test:e2e`.”

---

## Phương án dự phòng
| Sự cố | Xử lý |
|---|---|
| API không chạy | Kiểm tra Terminal 1 (CSDL) trước, rồi Terminal 2 |
| Flash sale trống | `npm run db:refresh-demo -- --apply`, tải lại trang |
| Đăng nhập báo 429 | Đã thử quá 10 lần/phút. Chờ 1 phút hoặc dùng cửa sổ đã đăng nhập sẵn |
| Mạng chậm / không có Internet | Ứng dụng chạy cục bộ. Chỉ ảnh VietQR (img.vietqr.io) cần Internet; nói rõ nếu ảnh QR không tải |
| Mất dữ liệu / dữ liệu rối | `npm run db:restore -- <bản sao lưu>` (dừng API và CSDL trước) |
| Không demo trực tiếp được | Dùng ảnh trong `docs/screenshots/` theo đúng thứ tự trên |
