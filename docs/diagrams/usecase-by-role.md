# Use case theo vai trò

Căn cứ: bảng `role_permissions` trong CSDL (đã kiểm tra qua `GET /auth/me`) và `@RequirePermissions` trên từng endpoint.

## 1. Khách vãng lai và khách hàng thành viên

```mermaid
flowchart LR
  G["👤 Khách vãng lai"]
  C["👤 Khách hàng"]
  G -. kế thừa .-> C

  subgraph P["Không cần đăng nhập (@Public)"]
    g1([Xem / tìm kiếm / lọc sản phẩm])
    g2([Giỏ hàng theo x-cart-token])
    g3([Checkout bằng email + SĐT])
    g4([Chuyển khoản VietQR])
    g5([Tra cứu đơn: mã đơn + SĐT])
    g6([Tính BMI/BMR/TDEE, quiz, tạo thực đơn])
    g7([Đăng ký / đăng nhập])
  end
  subgraph M["Cần đăng nhập"]
    c1([Gộp giỏ khi đăng nhập])
    c2([Lịch sử đơn, hủy khi Chờ xác nhận/Đã xác nhận])
    c3([Mua lại, thanh toán lại])
    c4([Đánh giá dòng đơn đã giao])
    c5([Dùng điểm ≤ 50% đơn, xem hạng])
    c6([Sổ địa chỉ, hồ sơ, đổi mật khẩu])
    c7([Yêu thích + báo giảm giá])
    c8([Lưu hồ sơ sức khỏe & thực đơn])
    c9([Giao hàng định kỳ])
  end
  G --> g1 & g2 & g3 & g4 & g5 & g6 & g7
  C --> c1 & c2 & c3 & c4 & c5 & c6 & c7 & c8 & c9
```

## 2. Nhân viên bán hàng (`staff_sales`, 8 quyền)

```mermaid
flowchart LR
  S["👤 Nhân viên bán hàng"]
  S --> s1([Xem tổng quan<br/>dashboard.view])
  S --> s2([Xem sản phẩm<br/>product.read])
  S --> s3([Xem, lọc, xuất Excel đơn<br/>order.read])
  S --> s4([Chuyển trạng thái đơn<br/>order.update])
  S --> s5([Xác nhận chuyển khoản, xử lý hoàn trả<br/>payment.confirm])
  S --> s6([Xem khách hàng, yêu cầu tư vấn<br/>customer.read])
  S --> s7([Mã giảm giá, flash sale, combo<br/>coupon.manage])
  S --> s8([Báo cáo, xuất Excel<br/>report.view])
```

## 3. Nhân viên kho (`staff_warehouse`, 5 quyền)

```mermaid
flowchart LR
  K["👤 Nhân viên kho"]
  K --> k1([Xem tổng quan<br/>dashboard.view])
  K --> k2([Xem sản phẩm<br/>product.read])
  K --> k3([Xem đơn hàng<br/>order.read])
  K --> k4([Chuyển trạng thái đơn<br/>order.update])
  K --> k5([Tồn kho, nhập lô, xuất hủy, kiểm kê, lịch sử<br/>inventory.manage])
  K -. bị chặn 403 .-> x1([Xác nhận thanh toán])
  K -. bị chặn 403 .-> x2([Mã giảm giá])
```

## 4. Nhân viên CSKH (`staff_support`, 5 quyền)

```mermaid
flowchart LR
  H["👤 Nhân viên CSKH"]
  H --> h1([Xem tổng quan<br/>dashboard.view])
  H --> h2([Xem sản phẩm<br/>product.read])
  H --> h3([Xem đơn hàng<br/>order.read])
  H --> h4([Xem khách hàng, xử lý yêu cầu tư vấn<br/>customer.read])
  H --> h5([Duyệt / phản hồi đánh giá<br/>review.moderate])
  H -. bị chặn 403 .-> y1([Đổi trạng thái đơn])
```

## 5. Super Admin (`admin`, toàn quyền)

```mermaid
flowchart LR
  A["👤 Super Admin"]
  A --> a1([Toàn bộ use case của nhân viên])
  A --> a2([Tạo/sửa/xóa mềm sản phẩm<br/>product.write])
  A --> a3([Quản lý danh mục<br/>category.write])
  A --> a4([Khóa / mở khóa khách hàng<br/>customer.manage])
  A --> a5([Quản lý nội dung<br/>content.manage])
  A --> a6([Tạo nhân viên, gán vai trò, sửa ma trận quyền<br/>user.manage])
  A --> a7([Chạy giao hàng định kỳ<br/>user.manage])
```
