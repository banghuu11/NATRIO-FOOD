# Tổng quan dự án NUTRIO Food

> Tài liệu mô tả phạm vi và chức năng **đã có trong mã nguồn**. Trạng thái kiểm thử của từng chức năng nằm ở [TESTING_REPORT.md](TESTING_REPORT.md).

## 1. Giới thiệu

NUTRIO Food là website thương mại điện tử bán **hạt dinh dưỡng, granola và thực phẩm lành mạnh**, kết hợp các công cụ dinh dưỡng cá nhân hóa: BMI/BMR/TDEE, quiz tư vấn, lọc dị ứng, thực đơn 7 ngày và Nutri-Score.

Hệ thống gồm hai khu vực dùng chung một backend:

- **Cửa hàng** (`/`) cho khách vãng lai và khách hàng thành viên.
- **Quản trị** (`/admin`) cho Super Admin và 3 nhóm nhân viên (bán hàng, kho, CSKH), phân quyền theo từng quyền cụ thể.

## 2. Mục tiêu

| Mục tiêu | Cách hệ thống đáp ứng (đối chiếu mã nguồn) |
|---|---|
| Bán hàng trực tuyến đầy đủ quy trình | Giỏ hàng lưu ở server, checkout, 4 phương thức thanh toán (COD, chuyển khoản luôn bật; VNPay/MoMo bật khi có khóa sandbox), vòng đời đơn 8 trạng thái |
| Giá và tồn kho chính xác | Giá luôn tính lại ở server (`PricingService`); tồn kho giữ theo lô hết hạn sớm nhất (FEFO, hàm `fn_allocate_stock_fefo`) trong một transaction |
| Cá nhân hóa dinh dưỡng | Công thức Mifflin–St Jeor (`nutrition.calc.ts`), quiz → gợi ý sản phẩm, lọc dị ứng, thực đơn 7 ngày từ 18 công thức |
| Quản trị vận hành | Dashboard, sản phẩm, kho theo lô, đơn hàng, khách hàng, khuyến mãi, nội dung, đánh giá, báo cáo Excel, nhân viên & phân quyền |
| An toàn | JWT, bcrypt, phân quyền kiểm tra ở backend (RBAC), Helmet, giới hạn tần suất, kiểm tra dữ liệu đầu vào, khóa idempotency chống đơn trùng |

## 3. Đối tượng sử dụng

| Đối tượng | Mô tả | Tài khoản demo |
|---|---|---|
| Khách vãng lai | Xem, tìm kiếm, thêm giỏ, đặt hàng bằng email + SĐT, tra cứu đơn | — |
| Khách hàng thành viên | Thêm: tài khoản, sổ địa chỉ, lịch sử đơn, hủy/mua lại, đánh giá đã mua, điểm thưởng & hạng, voucher, hồ sơ sức khỏe, lưu thực đơn, giao định kỳ | `lan@example.com`, `minh@example.com` |
| Nhân viên bán hàng | Đơn hàng, xác nhận thanh toán, khách hàng (xem), khuyến mãi, báo cáo | `sales@nutrio.vn` |
| Nhân viên kho | Kho theo lô, cập nhật trạng thái đơn | `kho@nutrio.vn` |
| Nhân viên CSKH | Xem đơn & khách hàng, duyệt đánh giá, yêu cầu tư vấn | `cskh@nutrio.vn` |
| Super Admin | Toàn quyền, quản lý nhân viên và ma trận quyền | `admin@nutrio.vn` |

Mật khẩu demo: xem [README](../README.md#tài-khoản-demo). Đây là dữ liệu demo cục bộ, không phải tài khoản production.

## 4. Phạm vi chức năng

### 4.1 Cửa hàng
- **Trang chủ**: banner, danh mục, flash sale đếm ngược, sản phẩm nổi bật/bán chạy/mới, combo, tư vấn dinh dưỡng, công thức, đánh giá, bài viết, đăng ký nhận tin.
- **Danh mục & tìm kiếm**:
  - Danh mục cha/con. Tìm kiếm không dấu (`unaccent`, `pg_trgm`), gợi ý khi gõ, từ khóa phổ biến.
  - Lọc theo giá, mục tiêu dinh dưỡng, đánh giá, Nutri-Score, dị ứng, còn hàng, giảm giá. Có sắp xếp và phân trang.
- **Chi tiết sản phẩm**:
  - Ảnh, quy cách, tồn kho, hạn dùng lô gần nhất.
  - Bảng dinh dưỡng, thành phần, chứng nhận, cảnh báo dị ứng.
  - Gợi ý thay thế lành mạnh hơn, thường mua cùng, liên quan.
- **Tiện ích**: yêu thích + báo giảm giá, so sánh 2–3 sản phẩm.
- **Giỏ hàng**: lưu ở server cho cả khách vãng lai (token `x-cart-token`) và thành viên; gộp giỏ khi đăng nhập. Có chọn dòng để thanh toán, mã giảm giá, phí ship theo ngưỡng và widget tổng dinh dưỡng.
- **Thanh toán**:
  - Checkout nhiều bước với địa chỉ (34 tỉnh/thành), phương thức giao, phương thức thanh toán và dùng điểm.
  - Chuyển khoản hiển thị mã VietQR.
- **Sau mua**: theo dõi đơn, tra cứu đơn cho khách vãng lai (mã đơn + SĐT), hủy đơn có lý do, mua lại, thanh toán lại.
- **Tài khoản**: hồ sơ + ảnh đại diện, đổi/quên mật khẩu, sổ địa chỉ, điểm thưởng & hạng (Bronze/Silver/Gold), voucher, thông báo, đánh giá kèm ảnh (chỉ người đã mua), giao hàng định kỳ.
- **Nội dung**: blog, công thức (Shop the Recipe), trang tĩnh (giới thiệu, chính sách).

### 4.2 Dinh dưỡng
- Hồ sơ sức khỏe: BMI (ngưỡng châu Á–Thái Bình Dương), BMR, TDEE, calo mục tiêu, macro, nước. Có giải thích dễ hiểu và cảnh báo “không thay thế tư vấn y tế”.
- Quiz tư vấn → danh sách sản phẩm phù hợp.
- Bộ lọc dị ứng (lưu trong trình duyệt hoặc hồ sơ).
- Smart Meal Plan 7 ngày:
  - Chia calo theo bữa: sáng 25%, trưa 35%, tối 30%, phụ 10%.
  - Đổi món, lưu vào tài khoản, thêm nguyên liệu vào giỏ.
- Nutri-Score A–E tính bằng trigger CSDL từ dữ liệu dinh dưỡng.

### 4.3 Quản trị
- **Tổng quan**: doanh thu (chỉ tính đơn giao thành công/hoàn tất), số đơn, khách hàng, biểu đồ 30 ngày/12 tháng/năm, đơn theo trạng thái, bán chạy, sắp hết hàng, lô sắp hết hạn.
- **Sản phẩm**: CRUD, nhiều ảnh, quy cách/giá, dinh dưỡng, dị ứng, chế độ ăn, ẩn/hiện, xóa mềm.
- **Danh mục**: cha/con.
- **Đơn hàng**: lọc, chi tiết, lô đã phân bổ, chuyển trạng thái theo quy tắc, xác nhận thanh toán, hủy, hoàn trả, in hóa đơn, xuất Excel.
- **Khách hàng**: chi tiêu, lịch sử, khóa/mở.
- **Kho**: tồn theo lô, nhập kho tạo lô, xuất hủy, kiểm kê, lịch sử biến động.
- **Khuyến mãi**: mã giảm giá, combo, flash sale.
- **Nội dung**: banner, bài viết, công thức, trang tĩnh, danh sách nhận tin.
- **Đánh giá**: duyệt và phản hồi. **Yêu cầu tư vấn**: xử lý.
- **Báo cáo**: doanh thu, AOV, tỷ lệ thành công, top sản phẩm/khách; xuất Excel.
- **Nhân viên & quyền**: tạo nhân viên, gán vai trò, sửa ma trận quyền.

## 5. Công nghệ sử dụng

| Lớp | Công nghệ (phiên bản theo `package.json`) |
|---|---|
| Frontend | Next.js 16.3 (App Router, Turbopack), React 19, Tailwind CSS v4, TanStack Query 5, Zustand, React Hook Form + Zod, Recharts, lucide-react, sonner, axios |
| Backend | NestJS 11, Prisma 6.19, Passport JWT, bcryptjs, class-validator/transformer, Helmet, @nestjs/throttler, @nestjs/schedule, @nestjs/swagger, ExcelJS, Nodemailer, Multer |
| Cơ sở dữ liệu | PostgreSQL 18.6 (gói `embedded-postgres`, cổng 5433), extension `pgcrypto`, `citext`, `pg_trgm`, `unaccent` |
| Kiểm thử | Bộ kiểm thử API end-to-end `backend/test/e2e-api.mjs` (38 kịch bản), TypeScript `tsc`, ESLint (frontend), oxlint (backend), kiểm tra giao diện bằng trình duyệt tự động (puppeteer-core + Edge) |

## 6. Số liệu hệ thống (đo ngày 07/11/2026)

| Hạng mục | Số lượng | Nguồn |
|---|---|---|
| Bảng CSDL | 108 (+ 9 view, 1 materialized view) | `information_schema` |
| Khóa ngoại / chỉ mục / trigger | 159 / 229 / 40 | `pg_constraint`, `pg_indexes`, `pg_trigger` |
| API endpoint | 165 (62 công khai, 36 cần đăng nhập, 67 cần quyền quản trị) | metadata controller đã build |
| Trang frontend | 48 route (`next build`) | kết quả build |
| Sản phẩm đang bán / quy cách | 34 / 42 | CSDL demo |
| Đơn hàng demo | 151 (bao gồm 11 đơn sinh ra khi kiểm thử, xem [DATABASE_DESIGN.md](DATABASE_DESIGN.md#7-dữ-liệu-kiểm-thử-và-cách-dọn)) | CSDL demo |

## 7. Giới hạn đã biết

Xem chi tiết ở [FINAL_HANDOVER_REPORT.md](../FINAL_HANDOVER_REPORT.md#6-giới-hạn-còn-tồn-tại). Tóm tắt:

- VNPay/MoMo chưa được thử với tài khoản sandbox thật (chưa có khóa).
- Email cần SMTP.
- Vận chuyển được mô phỏng nội bộ.
- Ảnh upload lưu trên đĩa.
- Chưa có unit test và CI.
