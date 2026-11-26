# Đề xuất bổ sung dữ liệu demo cho biểu đồ doanh thu 30 ngày

Ngày lập: 14/11/2026. **Chưa thực hiện thay đổi nào trên CSDL thật.** Mọi số liệu “sau khi làm” đều đo trên **bản sao** của bản sao lưu `pgdata-20261114-065755`, chạy ở một cụm PostgreSQL tạm (cổng 5434) ngoài repo.

## 1. Hiện trạng

Truy vấn chỉ đọc trên CSDL thật, giờ Việt Nam:

| Chỉ số | Giá trị |
|---|---|
| Đơn seed sớm nhất / muộn nhất | 03/08/2026 / 31/10/2026 (seed chạy ngày 31/10, sinh đơn lùi 90 ngày) |
| Đơn theo tháng (gồm đơn hủy/hoàn) | 08: 34 · 09: 40 · 10: 67 · 11: 10 (toàn bộ 10 đơn tháng 11 là đơn kiểm thử, không có doanh thu) |
| Đơn trong 30 ngày gần nhất | 47; trong đó 26 đơn có doanh thu |
| Số ngày có doanh thu trong 30 ngày | **10** (16/10 – 27/10) |
| Doanh thu 30 ngày | 14.437.360đ |
| Khoảng trống không có doanh thu | **28/10 – 14/11 (18 ngày)**, sẽ dài thêm mỗi ngày cho tới buổi bảo vệ |
| Giá trị đơn trung bình (AOV) | 612.904đ, khoảng 3 sản phẩm/đơn |

→ Ở chế độ “30 ngày”, nửa phải của biểu đồ dashboard là đường phẳng bằng 0. Chế độ “12 tháng” vẫn hiển thị bình thường.

## 2. Các phương án

### Phương án A – Giữ nguyên, chỉ thay đổi cách trình bày (rủi ro: không có)
- Khi demo, chuyển biểu đồ sang **“12 tháng”**. Nói rõ dữ liệu demo được sinh ngày 31/10.
- Ưu điểm: không đụng dữ liệu.
- Nhược điểm: biểu đồ 30 ngày vẫn phẳng nếu hội đồng tự bấm.

### Phương án B – Thêm một đợt đơn bằng `npm run db:seed -- --force` (khuyến nghị nếu muốn biểu đồ đầy)
Lệnh có sẵn trong dự án (`backend/src/seed/seed.ts`):
- Tạo 140 lượt đặt hàng ngẫu nhiên trong 90 ngày, đi qua **đúng quy trình nghiệp vụ thật**: `OrdersService.placeOrder` (giá, FEFO, mã giảm giá, điểm) và `OrderLifecycleService.transition` (trừ kho, COD, cộng điểm, hoàn trả).
- Sau đó lùi mốc thời gian để rải đều trên biểu đồ.
- Thêm đánh giá Verified Buyer cho các dòng đơn đã giao.
- **Không** sửa tài khoản, sản phẩm, danh mục, mã giảm giá, nội dung.

Kết quả đo trên bản sao:

| Chỉ số | Trước | Sau |
|---|---|---|
| Tổng đơn | 149 | 259 (+110; 30 lượt bị bỏ qua do hết hàng/không đủ điều kiện mã) |
| Đơn trong 30 ngày | 45 | 91 |
| **Số ngày có doanh thu trong 30 ngày** | **10** | **26** |
| Doanh thu 30 ngày | 14.437.360đ | 31.843.050đ |
| Doanh thu toàn bộ | 68.645.230đ | 116.108.370đ |
| Quy cách dưới ngưỡng tồn (`v_low_stock`) | 6 | 6 |
| Quy cách hết hàng | 2 | 3 |
| Điểm `lan@example.com` (số dư / tích lũy, hạng) | 5215 / 5415, Gold | 13702 / 13902, Gold |
| Đánh giá | 123 | 257 |
| Người dùng / sản phẩm đang bán | 18 / 34 | 18 / 34 |

**Lưu ý**:
- Đây là dữ liệu sinh tự động, không phải giao dịch thật. Khi bảo vệ cần nói đúng như vậy, giống như đợt seed ban đầu.
- Tồn kho bị tiêu hao thêm, nhiều khả năng có thêm quy cách hết hàng.
- Điểm và hạng của khách demo tăng. Lan vẫn là Gold nhưng số điểm lớn hơn nhiều.
- Phân bố ngày là ngẫu nhiên, nên một số ngày vẫn có thể bằng 0.
- Muốn hoàn tác thì chỉ có cách khôi phục bản sao lưu.

Thứ tự thực hiện nếu được đồng ý:

```bash
cd backend
# 1. Dừng API (Ctrl+C), rồi
npm run db:stop
npm run db:backup
npm run db:start                         # cửa sổ riêng
# 2. (khuyến nghị) dọn dữ liệu kiểm thử trước – xem CLEANUP_PREVIEW.md
npm run db:cleanup-test -- --apply
# 3. thêm đợt đơn demo
npm run db:seed -- --force
# 4. mở lại flash sale ngay trước buổi demo
npm run db:refresh-demo -- --apply
```

### Phương án C – Seed lại toàn bộ (không đề xuất vì đã có yêu cầu “không seed lại toàn bộ”)
- Đã thử `npm run setup` từ đầu trên thư mục tạm: hoàn tất trong khoảng 23 giây, cho 63 đơn trong 30 ngày rải trên 25 ngày.
- Đổi lại, phương án này xóa toàn bộ dữ liệu hiện có. Chỉ ghi lại để tham khảo.

### Phương án D – Viết thêm tham số cho seed (chưa làm)
- Thêm tham số, ví dụ `--days=30 --count=50`, để chỉ sinh đơn trong 30 ngày gần nhất và chỉ đánh giá các đơn mới.
- Ưu điểm: kiểm soát tốt hơn phương án B, ít ảnh hưởng điểm, tồn kho và số đánh giá cũ.
- Nhược điểm: cần sửa code seed và kiểm thử lại. Thời gian còn lại có thể không đủ.

## 3. Những gì không nên làm
- **Không** sửa trực tiếp ngày (`placed_at`) của đơn cũ để “kéo” về gần hiện tại. Cách này phải đổi đồng bộ hơn 8 bảng (lịch sử trạng thái, thanh toán, vận đơn, điểm, nhật ký kho, đánh giá…) và dễ tạo dữ liệu mâu thuẫn, ví dụ đơn giao trước khi đặt, đánh giá trước khi nhận hàng.
- **Không** chèn doanh thu trực tiếp vào bảng `orders` mà bỏ qua quy trình đặt hàng. Như vậy tồn kho, điểm và thanh toán sẽ không khớp, và vi phạm CHECK tổng tiền.

## 4. Khuyến nghị
- Muốn an toàn tuyệt đối: chọn **A**.
- Muốn dashboard đẹp: chọn **B**, làm theo đúng thứ tự trên, sau khi đã có bản sao lưu.
- Trong cả hai trường hợp, nên dọn dữ liệu kiểm thử ([CLEANUP_PREVIEW.md](CLEANUP_PREVIEW.md)) để dashboard không còn đơn “Hạt test E2E”.
