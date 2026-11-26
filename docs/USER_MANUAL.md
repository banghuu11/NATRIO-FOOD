# Hướng dẫn sử dụng

Tên nút và mục menu dưới đây lấy đúng theo giao diện. Ảnh minh họa nằm trong [screenshots/](screenshots/). Tài khoản demo xem ở [README](../README.md#tài-khoản-demo).

---

## Phần A – Khách hàng

### A1. Tìm và chọn sản phẩm
1. Vào trang chủ `http://localhost:3000` ([home.jpg](screenshots/home.jpg)). Thanh menu gồm: **Danh mục**, **Cửa hàng**, **Combo**, **Công thức**, **Thực đơn 7 ngày**, **Hồ sơ sức khỏe**, **Quiz tư vấn**, **Kiến thức**, **Khuyến mãi**.
2. Tìm kiếm bằng ô tìm kiếm trên đầu trang:
   - Gõ có dấu hoặc không dấu đều được. Ví dụ “hat dieu”, “giàu đạm”, “keto”.
   - Gợi ý hiện ngay khi gõ.
3. Trong **Cửa hàng** ([products.jpg](screenshots/products.jpg)):
   - Lọc theo danh mục, khoảng giá, chế độ ăn, đánh giá, Nutri-Score, “tránh dị ứng”, còn hàng, đang giảm giá.
   - Sắp xếp theo mới nhất, bán chạy, giá…
4. Mở một sản phẩm ([product-detail.jpg](screenshots/product-detail.jpg)):
   - Chọn quy cách, xem giá, tồn kho, hạn dùng lô gần nhất, bảng dinh dưỡng, cảnh báo dị ứng.
   - Bấm **Thêm vào giỏ** hoặc biểu tượng trái tim để lưu yêu thích.
5. **So sánh**: chọn 2–3 sản phẩm để so sánh dinh dưỡng và giá trên trang `/compare`.

### A2. Giỏ hàng và đặt hàng
1. Mở **Giỏ hàng** ([cart.jpg](screenshots/cart.jpg)):
   - Đánh dấu sản phẩm muốn mua và chỉnh số lượng. Không vượt quá tồn kho; hệ thống báo “Chỉ còn N sản phẩm”.
   - Nhập **Mã giảm giá** hoặc bấm **Dùng** ở voucher gợi ý.
   - Khung **Tóm tắt đơn hàng** hiển thị tạm tính, ưu đãi hạng, giảm giá, phí vận chuyển và tổng dinh dưỡng của giỏ.
2. Bấm **Thanh toán (n)**. Checkout có 4 bước ([checkout.jpg](screenshots/checkout.jpg)):
   1. **Thông tin nhận hàng**: họ tên, SĐT, email (bắt buộc nếu chưa đăng nhập), Tỉnh/Thành, Quận/Huyện, Phường/Xã, địa chỉ chi tiết.
   2. **Vận chuyển**: Giao tiêu chuẩn / Giao nhanh 2 giờ / Giao lạnh trong ngày. Miễn phí khi đạt ngưỡng.
   3. **Thanh toán**: COD hoặc Chuyển khoản. VNPay/MoMo chỉ hiện khi đã cấu hình. Thành viên có thể dùng điểm, tối đa 50% giá trị đơn.
   4. **Xác nhận**: kiểm tra lại và bấm đặt hàng.
3. **Chuyển khoản**: trang kết quả hiển thị mã VietQR với nội dung là mã đơn. Đơn chỉ được tính “Đã thanh toán” khi nhân viên xác nhận đã nhận tiền.
4. **Khách vãng lai**: dùng **Tra cứu đơn hàng** (trên đầu trang, [track-order.jpg](screenshots/track-order.jpg)), nhập mã đơn và SĐT đặt hàng.

### A3. Tài khoản
Đăng nhập rồi bấm vào tên ở góc phải.

| Mục | Chức năng |
|---|---|
| Thông tin tài khoản | Sửa họ tên, SĐT, giới tính, ngày sinh, ảnh đại diện; đổi mật khẩu; mã giới thiệu |
| Đơn hàng ([account_orders.jpg](screenshots/account_orders.jpg)) | Lịch sử đơn, chi tiết, hành trình giao. **Hủy đơn** (khi còn Chờ xác nhận/Đã xác nhận, phải nhập lý do), **Mua lại**, thanh toán lại |
| Địa chỉ | Sổ địa chỉ, chọn địa chỉ mặc định |
| Điểm thưởng ([account_loyalty.jpg](screenshots/account_loyalty.jpg)) | Số dư, hạng Bronze/Silver/Gold, tiến độ lên hạng, lịch sử điểm |
| Yêu thích | Danh sách yêu thích, bật thông báo giảm giá |
| Đánh giá | Đánh giá sản phẩm đã nhận (1–5 sao, nội dung ≥ 10 ký tự, tối đa 5 ảnh) |
| Giao định kỳ | Đăng ký gói tuần/2 tuần/tháng; tạm dừng, bỏ qua kỳ, hủy |
| Thông báo | Thông báo đơn hàng, khuyến mãi |

Quên mật khẩu: trang **Đăng nhập → Quên mật khẩu?**, nhập email.

### A4. Công cụ dinh dưỡng
- **Hồ sơ sức khỏe** ([health.jpg](screenshots/health.jpg)):
  - Nhập giới tính, tuổi, chiều cao, cân nặng, mức vận động, mục tiêu.
  - Nhận BMI, BMR, TDEE, calo mục tiêu, lượng đạm/tinh bột/chất béo, lượng nước, kèm giải thích và gợi ý sản phẩm.
  - Thành viên có thể lưu hồ sơ.
  - Kết quả chỉ để tham khảo, không thay thế tư vấn y tế.
- **Quiz tư vấn** ([quiz.jpg](screenshots/quiz.jpg)): trả lời 5 câu để nhận danh sách sản phẩm phù hợp.
- **Thực đơn 7 ngày** ([meal-plan.jpg](screenshots/meal-plan.jpg)):
  - Nhập calo mục tiêu (hoặc **Tính TDEE**), chọn chế độ ăn và thành phần cần tránh, bấm **Tạo thực đơn**.
  - Có thể đổi từng món, lưu vào tài khoản, hoặc thêm nguyên liệu NUTRIO đang bán vào giỏ.
- **Công thức** ([recipes.jpg](screenshots/recipes.jpg)): xem cách làm, mua nguyên liệu (Shop the Recipe).

---

## Phần B – Quản trị

Truy cập `http://localhost:3000/admin`.

- Menu bên trái **chỉ hiện mục bạn có quyền** (xem [ROLE_PERMISSION.md](ROLE_PERMISSION.md)).
- Super Admin thấy đủ 12 mục: Tổng quan, Đơn hàng, Sản phẩm, Danh mục, Kho hàng, Khách hàng, Khuyến mãi, Đánh giá, Nội dung, Yêu cầu tư vấn, Báo cáo, Nhân viên & quyền.

### B1. Tổng quan ([admin.jpg](screenshots/admin.jpg), [admin-dashboard-full.jpg](screenshots/admin-dashboard-full.jpg))
- **KPI**: tổng doanh thu (chỉ đơn giao thành công/hoàn tất), tổng đơn, khách hàng, sản phẩm đang bán, đơn chờ xác nhận, đơn đang xử lý/giao.
- **Biểu đồ**: doanh thu và số đơn theo **30 ngày / 12 tháng / Theo năm**; đơn hàng theo trạng thái; sản phẩm bán chạy.
- **Cảnh báo**: **Sắp hết hàng** và **Lô sắp hết hạn (30 ngày)**, kèm liên kết sang Kho; đơn hàng mới nhất.

### B2. Đơn hàng (quyền `order.read`, [admin_orders.jpg](screenshots/admin_orders.jpg))
1. Lọc theo trạng thái, trạng thái thanh toán, phương thức, khoảng ngày; tìm theo mã đơn, tên, SĐT, email.
2. Bấm **Xuất Excel** để tải danh sách đang lọc.
3. Mở đơn để xem sản phẩm, lô hàng đã phân bổ, lịch sử trạng thái, thông tin giao hàng, thanh toán.
4. Khung **Xử lý đơn hàng** (quyền `order.update`): chỉ hiện các bước hợp lệ tiếp theo, ví dụ Chờ xác nhận → Đã xác nhận / Đã hủy. Có thể ghi chú. Khi chuyển sang:
   - **Đang giao**: hệ thống trừ kho và tạo mã vận đơn.
   - **Giao thành công**: đơn COD được tính đã thanh toán và cộng điểm cho khách.
   - **Đã hủy**: nhả hàng, hoàn điểm và lượt mã giảm giá.
   - **Hoàn trả / Hoàn tiền**: cần thêm quyền `payment.confirm`; nhập lại kho, hoàn tiền, thu hồi điểm.
5. **Xác nhận thanh toán** (quyền `payment.confirm`): với đơn chuyển khoản, chỉ bấm sau khi đã thấy tiền về đúng số tiền và nội dung mã đơn.
6. **In hóa đơn**: in hoặc lưu PDF từ trình duyệt.

### B3. Sản phẩm & Danh mục ([admin_products.jpg](screenshots/admin_products.jpg))
- `product.read` để xem; `product.write` để tạo, sửa, ẩn/hiện, xóa (xóa mềm).
- Form sản phẩm gồm:
  - Tên, danh mục, mô tả, nhiều ảnh (upload), các quy cách (SKU, khối lượng, giá, giá so sánh ≥ giá bán).
  - Dinh dưỡng/100 g (Nutri-Score tự tính), chất gây dị ứng, chế độ ăn.
- Danh mục cha/con: quyền `category.write`. Không xóa được danh mục còn sản phẩm.

### B4. Kho hàng (quyền `inventory.manage`, [admin_inventory.jpg](screenshots/admin_inventory.jpg))
Ba tab: **Tồn kho**, **Lô hàng & hạn dùng**, **Lịch sử nhập / xuất**.

- **Nhập kho**: chọn sản phẩm/quy cách, kho, số lượng, NSX/HSD, nhà cung cấp, rồi **Tạo phiếu nhập**. Hệ thống tạo lô mới kèm mã lô và mã QR truy xuất.
- **Xuất** (hủy hàng hết hạn/hỏng) và **Kiểm kê** (điều chỉnh theo số thực tế) thực hiện trên từng lô, phải ghi lý do.
- Hàng được giữ/xuất theo nguyên tắc **lô hết hạn trước xuất trước (FEFO)**, tự động khi khách đặt hàng.

### B5. Khách hàng (quyền `customer.read`, [admin_customers.jpg](screenshots/admin_customers.jpg))
- Danh sách khách với tổng chi tiêu, số đơn, hạng. Chi tiết gồm lịch sử đơn và địa chỉ.
- **Khóa/mở khóa** tài khoản (quyền `customer.manage`). Tài khoản bị khóa bị đăng xuất ngay ở request tiếp theo.
- **Yêu cầu tư vấn**: xem và đánh dấu đã xử lý tin nhắn từ form liên hệ/tư vấn.

### B6. Khuyến mãi (quyền `coupon.manage`, [admin_promotions.jpg](screenshots/admin_promotions.jpg))
- **Mã giảm giá**:
  - Loại %, số tiền cố định, miễn phí ship.
  - Điều kiện: đơn tối thiểu, giảm tối đa, tổng lượt, lượt/người, chỉ đơn đầu, hạng tối thiểu, thời gian hiệu lực.
- **Flash sale**: khung giờ, sản phẩm, giá sale, số suất.
- **Combo**: nhóm sản phẩm bán theo giá combo.

### B7. Đánh giá, Nội dung, Báo cáo
- **Đánh giá** (`review.moderate`, [admin_reviews.jpg](screenshots/admin_reviews.jpg)): duyệt, từ chối, phản hồi.
- **Nội dung** (`content.manage`): banner trang chủ, bài viết, công thức, trang Giới thiệu/Chính sách, danh sách đăng ký nhận tin.
- **Báo cáo** (`report.view`, [admin_reports.jpg](screenshots/admin_reports.jpg)): doanh thu, số đơn, giá trị đơn trung bình, tỷ lệ thành công, top sản phẩm và khách theo khoảng thời gian; **Xuất Excel** hoặc in.

### B8. Nhân viên & quyền (quyền `user.manage`, [admin_staff.jpg](screenshots/admin_staff.jpg))
- Tạo tài khoản nhân viên, gán vai trò (Bán hàng, Kho, CSKH, Super Admin). Chỉ Super Admin mới cấp được vai trò Super Admin.
- Sửa **ma trận quyền** cho từng vai trò nhân viên (Super Admin luôn toàn quyền). Thay đổi có hiệu lực ngay.

---

## Phần C – Lưu ý vận hành
- Đơn VNPay/MoMo không thanh toán trong 60 phút sẽ tự hủy (khi đã bật hai cổng này).
- Doanh thu chỉ tính đơn **Giao thành công** và **Hoàn tất**.
- Sao lưu dữ liệu định kỳ: [DATABASE_DESIGN.md §9](DATABASE_DESIGN.md#9-sao-lưu-và-khôi-phục).
