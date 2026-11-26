# Vai trò và phân quyền (RBAC)

## 1. Mô hình

```
users ──< user_roles >── roles ──< role_permissions >── permissions
```

- Một người dùng có thể có nhiều vai trò. Quyền thực tế là **hợp** các quyền của mọi vai trò.
- Mã nguồn chính:
  - `backend/src/common/permissions.ts`: 15 mã quyền.
  - `common/decorators/roles.decorator.ts`: `@Public`, `@Roles`, `@RequirePermissions`.
  - `common/guards/jwt-auth.guard.ts`, `roles.guard.ts`.
  - `modules/auth/strategies/jwt.strategy.ts`.
- **Super Admin (`admin`) luôn qua mọi kiểm tra quyền** (`RolesGuard`). Vai trò này không chỉnh được ma trận quyền.
- Vai trò `customer` không thể được cấp quyền quản trị (API từ chối).

### 1.1 Cách kiểm tra quyền ở backend
1. `JwtAuthGuard` (toàn cục) yêu cầu token cho mọi endpoint không có `@Public()`.
   - Thiếu hoặc sai token: **401**.
   - Endpoint `@Public()` vẫn đọc token nếu có. Ví dụ: giỏ hàng, đặt hàng biết người đang đăng nhập.
2. `JwtStrategy.validate()` đọc lại user + vai trò + quyền từ CSDL **ở mỗi request**.
   - Tài khoản bị khóa: 401 ngay, kể cả khi token còn hạn.
   - Đổi quyền có hiệu lực ngay.
3. `RolesGuard` (toàn cục) so `@RequirePermissions(...)` với quyền của user. Thiếu quyền: **403** “Bạn không có quyền: …”.
4. Một số kiểm tra bổ sung trong code:
   - Chuyển đơn sang **Hoàn trả** cần thêm `payment.confirm`.
   - Chỉ Super Admin mới cấp được vai trò Super Admin.
   - Không thể tự gỡ Super Admin của chính mình.
   - Khách chỉ xem/hủy **đơn của mình**.

### 1.2 Frontend
- `app/(admin)/admin/layout.tsx`:
  - Chuyển về `/login` nếu chưa đăng nhập.
  - Menu chỉ hiện mục người dùng có quyền.
  - Mở trực tiếp trang không có quyền sẽ hiện thông báo chặn.
- Đây chỉ là lớp giao diện. **Bảo mật thật nằm ở backend**: gọi API trực tiếp vẫn bị 403 (đã kiểm thử).

## 2. Danh sách quyền

| Mã quyền | Ý nghĩa | Mục menu quản trị |
|---|---|---|
| `dashboard.view` | Xem tổng quan | Tổng quan |
| `product.read` | Xem sản phẩm, danh mục, dữ liệu catalog | Sản phẩm, Danh mục |
| `product.write` | Tạo/sửa/ẩn/xóa mềm sản phẩm | (nút trong Sản phẩm) |
| `category.write` | Tạo/sửa/xóa danh mục | (nút trong Danh mục) |
| `order.read` | Xem, lọc, xuất Excel đơn hàng | Đơn hàng |
| `order.update` | Chuyển trạng thái đơn | (nút trong Đơn hàng) |
| `payment.confirm` | Xác nhận chuyển khoản; xử lý hoàn trả/hoàn tiền | (nút trong Đơn hàng) |
| `customer.read` | Xem khách hàng, yêu cầu tư vấn | Khách hàng, Yêu cầu tư vấn |
| `customer.manage` | Khóa/mở khóa khách hàng | (nút trong Khách hàng) |
| `inventory.manage` | Tồn kho, lô, nhập/xuất/kiểm kê, lịch sử | Kho hàng |
| `coupon.manage` | Mã giảm giá, flash sale, combo | Khuyến mãi |
| `content.manage` | Banner, bài viết, công thức, trang tĩnh, nhận tin | Nội dung |
| `review.moderate` | Duyệt/phản hồi đánh giá | Đánh giá |
| `report.view` | Báo cáo, xuất Excel báo cáo | Báo cáo |
| `user.manage` | Nhân viên, vai trò, ma trận quyền, chạy giao hàng định kỳ | Nhân viên & quyền |

## 3. Ma trận quyền mặc định (từ CSDL, xác nhận qua `GET /auth/me` ngày 07/11/2026)

| Quyền | Super Admin<br>`admin@nutrio.vn` | Bán hàng<br>`sales@nutrio.vn` | Kho<br>`kho@nutrio.vn` | CSKH<br>`cskh@nutrio.vn` | Khách hàng |
|---|:-:|:-:|:-:|:-:|:-:|
| dashboard.view | ✅ | ✅ | ✅ | ✅ | — |
| product.read | ✅ | ✅ | ✅ | ✅ | — |
| product.write | ✅ | — | — | — | — |
| category.write | ✅ | — | — | — | — |
| order.read | ✅ | ✅ | ✅ | ✅ | — |
| order.update | ✅ | ✅ | ✅ | — | — |
| payment.confirm | ✅ | ✅ | — | — | — |
| customer.read | ✅ | ✅ | — | ✅ | — |
| customer.manage | ✅ | — | — | — | — |
| inventory.manage | ✅ | — | ✅ | — | — |
| coupon.manage | ✅ | ✅ | — | — | — |
| content.manage | ✅ | — | — | — | — |
| review.moderate | ✅ | — | — | ✅ | — |
| report.view | ✅ | ✅ | — | — | — |
| user.manage | ✅ | — | — | — | — |
| **Tổng** | 15 | 8 | 5 | 5 | 0 |

Ma trận có thể chỉnh tại **Quản trị → Nhân viên & quyền** (`PUT /admin/roles/:code/permissions`, cần `user.manage`). Bảng trên là cấu hình hiện tại của CSDL demo.

## 4. Kết quả kiểm tra thực tế

### 4.1 Gọi API bằng từng tài khoản (07/11/2026)
Mỗi ô là mã HTTP khi gọi `GET` endpoint đại diện của quyền đó.

| Endpoint (quyền) | admin | sales | kho | cskh | lan (khách) | minh (khách) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Đăng nhập | 200 | 200 | 200 | 200 | 200 | 200 |
| `/admin/dashboard` (dashboard.view) | 200 | 200 | 200 | 200 | 403 | 403 |
| `/admin/products` (product.read) | 200 | 200 | 200 | 200 | 403 | 403 |
| `/admin/categories` (product.read) | 200 | 200 | 200 | 200 | 403 | 403 |
| `/admin/orders` (order.read) | 200 | 200 | 200 | 200 | 403 | 403 |
| `/admin/customers` (customer.read) | 200 | 200 | 403 | 200 | 403 | 403 |
| `/admin/inventory/stock` (inventory.manage) | 200 | 403 | 200 | 403 | 403 | 403 |
| `/admin/promotions/coupons` (coupon.manage) | 200 | 200 | 403 | 403 | 403 | 403 |
| `/admin/posts` (content.manage) | 200 | 403 | 403 | 403 | 403 | 403 |
| `/admin/reviews` (review.moderate) | 200 | 403 | 403 | 200 | 403 | 403 |
| `/admin/reports` (report.view) | 200 | 200 | 403 | 403 | 403 | 403 |
| `/admin/staff` (user.manage) | 200 | 403 | 403 | 403 | 403 | 403 |

Kết quả khớp 100% với ma trận ở §3.

### 4.2 Kiểm tra trong bộ E2E (`npm run test:e2e`)
- Khách gọi API quản trị → 403; không đăng nhập → 401.
- Kho không quản lý được mã giảm giá, nhưng xem được tồn kho; bán hàng không vào được kho.
- CSKH duyệt được đánh giá nhưng **không** đổi được trạng thái đơn.
- Bán hàng không quản lý được nhân viên.
- Kho **không** xác nhận được thanh toán; bán hàng xác nhận được.

### 4.3 Giao diện
- Ảnh [admin-warehouse-role.jpg](screenshots/admin-warehouse-role.jpg): tài khoản kho chỉ thấy 5 mục menu (Tổng quan, Đơn hàng, Sản phẩm, Danh mục, Kho hàng).
- Super Admin thấy đủ 12 mục.

## 5. Thống kê endpoint theo mức truy cập

Lấy từ metadata của controller đã build (165 endpoint):

| Mức | Số endpoint |
|---|---|
| Công khai (`@Public`) | 62 |
| Cần đăng nhập (mọi vai trò) | 36 |
| Cần quyền quản trị | 67: content.manage 16, coupon.manage 12, inventory.manage 6, user.manage 6, product.read 5, product.write 4, customer.read 4, category.write 3, order.read 3, review.moderate 2, report.view 2, dashboard.view 1, order.update 1, payment.confirm 1, customer.manage 1 |

Danh sách đầy đủ: [API_DOCUMENTATION.md](API_DOCUMENTATION.md).
