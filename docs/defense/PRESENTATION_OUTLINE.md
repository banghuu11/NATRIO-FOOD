# Dàn ý thuyết trình (12–14 phút)

Tổng thời lượng mục tiêu là 13 phút, chừa 1–2 phút dự phòng. Mỗi slide ghi **ý chính cần nói** và **bằng chứng có thể chỉ ra** (file, ảnh, số liệu). Mọi số liệu đều lấy từ [TESTING_REPORT.md](../TESTING_REPORT.md) và [DATABASE_DESIGN.md](../DATABASE_DESIGN.md).

| # | Slide | Thời gian | Ý chính | Bằng chứng |
|---|---|---|---|---|
| 1 | Tiêu đề | 0:20 | NUTRIO Food – TMĐT hạt dinh dưỡng & granola cá nhân hóa theo calo. Tên nhóm, thành viên | — |
| 2 | Bài toán | 0:50 | Người mua thực phẩm dinh dưỡng cần biết **ăn bao nhiêu, có hợp mục tiêu/dị ứng không**. Shop phải quản lý **hạn dùng theo lô** | — |
| 3 | Mục tiêu & phạm vi | 0:50 | 2 khu vực: cửa hàng + quản trị. 5 vai trò. Chức năng bán hàng + dinh dưỡng + vận hành | [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) |
| 4 | Công nghệ | 0:50 | Next.js 16 + React 19 / NestJS 11 + Prisma 6 / PostgreSQL 18. Lý do chọn: TypeScript hai đầu, REST rõ ràng, CSDL quan hệ có transaction | [TECHNICAL_EXPLANATION.md](TECHNICAL_EXPLANATION.md) |
| 5 | Kiến trúc | 1:00 | 3 lớp. Pipeline guard: Throttler → JWT → Roles. Hai “trung tâm nghiệp vụ”: `PricingService` và `OrderLifecycleService` | [component-diagram](../diagrams/component-diagram.md) |
| 6 | CSDL | 1:00 | 108 bảng, 159 FK, 68 CHECK, 40 trigger. CHECK tổng tiền đơn, CHECK tồn không âm. FEFO bằng hàm SQL | [erd.md](../diagrams/erd.md) |
| 7 | Quy trình đặt hàng | 1:20 | Một transaction: khóa mã → định giá lại → giữ hàng FEFO → ghi mã/điểm → thanh toán. Khóa idempotency chống đơn trùng | [sequence-order](../diagrams/sequence-order.md) |
| 8 | Vòng đời đơn & kho | 1:00 | 8 trạng thái, bảng chuyển hợp lệ. Mỗi bước có tác động kho/tiền/điểm trong cùng transaction | [sequence-order-management](../diagrams/sequence-order-management.md) |
| 9 | Phân quyền | 0:50 | 15 quyền, 4 vai trò nhân viên. Kiểm tra ở backend, mỗi request đọc lại quyền. Ma trận 6 tài khoản đã kiểm tra | [ROLE_PERMISSION.md](../ROLE_PERMISSION.md) |
| 10 | Dinh dưỡng | 0:50 | Mifflin–St Jeor, ngưỡng BMI châu Á, quiz, thực đơn 7 ngày, lọc dị ứng, Nutri-Score bằng trigger | [BUSINESS_FLOWS.md §10](../BUSINESS_FLOWS.md#10-dinh-dưỡng-cá-nhân-hóa) |
| 11 | **Demo trực tiếp** | 3:30 | Theo [DEMO_SCRIPT.md](DEMO_SCRIPT.md) (bản rút gọn) | ứng dụng chạy thật |
| 12 | Kiểm thử | 0:40 | E2E 41/41, tsc/ESLint/oxlint/build đạt, 25 trang không lỗi console, 2 lỗi phát hiện & đã sửa | [TESTING_REPORT.md](../TESTING_REPORT.md) |
| 13 | Giới hạn & hướng phát triển | 0:30 | VNPay/MoMo chưa thử cổng thật; chưa có unit test/CI; vận chuyển mô phỏng. Hướng: GHN/GHTK, CI, unit test cho Pricing/Lifecycle | [FINAL_HANDOVER_REPORT.md](../../FINAL_HANDOVER_REPORT.md) |
| 14 | Kết luận & hỏi đáp | 0:20 | Tóm tắt 3 điểm mạnh: giá/tồn chính xác (transaction + FEFO), RBAC chặt, dinh dưỡng cá nhân hóa | — |

## Ghi chú trình bày
- **Nói đúng sự thật về giới hạn**. Không nói “tích hợp VNPay hoàn chỉnh”. Nói: “có mã ký và xác minh chữ ký, nhưng chưa thử với cổng sandbox vì chưa có khóa”.
- Khi nói về số liệu doanh thu/đơn hàng, nhấn mạnh đây là **dữ liệu demo do seed sinh ra**.
- Slide 7 và 8 là phần dễ bị hỏi sâu nhất. Chuẩn bị mở sẵn file [orders.service.ts](../../backend/src/modules/orders/orders.service.ts) và [order-lifecycle.service.ts](../../backend/src/modules/orders/order-lifecycle.service.ts).
- Ảnh có sẵn cho slide: [docs/screenshots/](../screenshots/) (trang chủ, chi tiết sản phẩm, giỏ, checkout, dashboard, kho, phân quyền kho).

## Phân công gợi ý (nhóm điền tên)
| Phần | Người trình bày |
|---|---|
| Slide 1–4 | |
| Slide 5–8 | |
| Slide 9–10, 12–14 | |
| Demo (slide 11) | |
