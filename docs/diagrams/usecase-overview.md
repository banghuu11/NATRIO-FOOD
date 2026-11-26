# Use case tổng quan

Mermaid không có ký hiệu use case UML chuẩn. Sơ đồ dùng `flowchart`: tác nhân là hình chữ nhật, use case là hình bo tròn, mũi tên nét đứt là quan hệ «include»/«extend».

```mermaid
flowchart LR
  Guest["👤 Khách vãng lai"]
  Customer["👤 Khách hàng thành viên"]
  Staff["👤 Nhân viên<br/>(Bán hàng / Kho / CSKH)"]
  Admin["👤 Super Admin"]
  VNPay["🏦 Cổng VNPay / MoMo<br/>(tùy chọn)"]
  Cron["⏱ Bộ lập lịch<br/>(cron 10 phút)"]

  subgraph Shop["Cửa hàng NUTRIO"]
    UC1([Xem, tìm kiếm, lọc sản phẩm])
    UC2([So sánh sản phẩm])
    UC3([Quản lý giỏ hàng])
    UC4([Đặt hàng / Checkout])
    UC5([Thanh toán])
    UC6([Tra cứu đơn bằng mã + SĐT])
    UC7([Công cụ dinh dưỡng:<br/>BMI/BMR/TDEE, quiz, thực đơn 7 ngày])
    UC8([Đăng ký / Đăng nhập / Quên mật khẩu])
    UC9([Quản lý tài khoản, sổ địa chỉ])
    UC10([Theo dõi, hủy, mua lại đơn])
    UC11([Đánh giá sản phẩm đã mua])
    UC12([Điểm thưởng, hạng, voucher])
    UC13([Yêu thích, báo giảm giá])
    UC14([Giao hàng định kỳ])
    UC15([Lưu hồ sơ sức khỏe, thực đơn])
  end

  subgraph AdminArea["Khu vực quản trị"]
    A1([Xem tổng quan])
    A2([Quản lý đơn hàng])
    A3([Xác nhận thanh toán])
    A4([Quản lý sản phẩm, danh mục])
    A5([Quản lý kho theo lô])
    A6([Quản lý khách hàng])
    A7([Quản lý khuyến mãi])
    A8([Quản lý nội dung])
    A9([Duyệt đánh giá])
    A10([Báo cáo, xuất Excel])
    A11([Quản lý nhân viên & phân quyền])
  end

  Guest --> UC1 & UC2 & UC3 & UC4 & UC6 & UC7 & UC8
  Customer --> UC1 & UC3 & UC4 & UC7 & UC9 & UC10 & UC11 & UC12 & UC13 & UC14 & UC15
  UC4 -. include .-> UC5
  UC5 -. extend .-> VNPay
  Cron -->|hủy đơn online quá 60 phút| A2

  Staff --> A1 & A2 & A3 & A4 & A5 & A6 & A7 & A9 & A10
  Admin --> A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8 & A9 & A10 & A11
```

Nhân viên chỉ thực hiện được những use case thuộc quyền của vai trò mình. Chi tiết ở [usecase-by-role.md](usecase-by-role.md).
