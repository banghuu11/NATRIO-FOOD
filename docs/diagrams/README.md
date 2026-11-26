# Sơ đồ hệ thống (Mermaid)

Các sơ đồ được vẽ theo mã nguồn và CSDL thực tế (07/11/2026). Có thể xem trực tiếp trên GitHub, trong VS Code (extension *Markdown Preview Mermaid Support*), hoặc dán vào https://mermaid.live để xuất PNG/SVG.

| Sơ đồ | File | Căn cứ trong mã nguồn |
|---|---|---|
| Use case tổng quan | [usecase-overview.md](usecase-overview.md) | Các controller, `ADMIN_NAV` |
| Use case theo vai trò | [usecase-by-role.md](usecase-by-role.md) | `role_permissions` trong CSDL, `@RequirePermissions` |
| Hoạt động – Đặt hàng | [activity-order.md](activity-order.md) | `orders.service.ts` |
| Hoạt động – Quản lý kho | [activity-inventory.md](activity-inventory.md) | `admin-inventory.controller.ts`, `order-lifecycle.service.ts`, `fn_allocate_stock_fefo` |
| Tuần tự – Đăng nhập | [sequence-login.md](sequence-login.md) | `auth.service.ts`, `jwt.strategy.ts`, guards |
| Tuần tự – Đặt hàng | [sequence-order.md](sequence-order.md) | `orders.service.ts`, `pricing.service.ts` |
| Tuần tự – Thanh toán | [sequence-payment.md](sequence-payment.md) | `payments.service.ts`, `admin-orders.controller.ts`, `orders.cron.ts` |
| Tuần tự – Quản lý đơn | [sequence-order-management.md](sequence-order-management.md) | `order-lifecycle.service.ts`, `order-status.ts` |
| ERD | [erd.md](erd.md) | `database/init/01_schema.sql`, `03_upgrade_v2.sql` |
| Component | [component-diagram.md](component-diagram.md) | `app.module.ts`, `frontend/src` |
| Deployment | [deployment-diagram.md](deployment-diagram.md) | `scripts/db.mjs`, `.env.example` |
