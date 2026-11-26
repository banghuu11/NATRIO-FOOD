# Sơ đồ thành phần (Component)

Căn cứ: `backend/src/app.module.ts` (danh sách module, guard toàn cục), `backend/src/modules/*`, `frontend/src/*`.

```mermaid
flowchart LR
  subgraph Browser["Trình duyệt"]
    subgraph FE["Next.js 16 – frontend/src"]
      direction TB
      ShopPages["app/(shop)<br/>~30 trang cửa hàng & tài khoản"]
      AdminPages["app/(admin)/admin<br/>16 trang quản trị"]
      UI["components/ui · layout · shop · home · admin"]
      Stores["stores (Zustand)<br/>auth · prefs · ui"]
      Hooks["hooks<br/>use-cart · use-wishlist · use-order-actions"]
      Query["TanStack Query (cache)"]
      ApiClient["lib/api.ts (axios)<br/>Bearer JWT + x-cart-token"]
      ShopPages & AdminPages --> UI
      ShopPages & AdminPages --> Hooks --> Query --> ApiClient
      ShopPages & AdminPages --> Stores
    end
  end

  subgraph BE["NestJS 11 – backend/src (cổng 5001, /api/v1)"]
    direction TB
    subgraph Common["common + main.ts"]
      Pipe["Helmet · CORS · ValidationPipe"]
      Guards["ThrottlerGuard → JwtAuthGuard → RolesGuard"]
      Filter["AllExceptionsFilter"]
    end
    subgraph Sales["Bán hàng"]
      Auth[auth]
      Users["users (/account)"]
      Products["products + stock.service"]
      Categories[categories]
      Carts[carts]
      Pricing["pricing<br/>(báo giá dùng chung)"]
      Orders["orders<br/>+ order-lifecycle + orders.cron"]
      Payments["payments<br/>COD · Bank · VNPay · MoMo"]
      Reviews[reviews]
      Subs[subscriptions]
    end
    subgraph Nutri["Dinh dưỡng"]
      Nutrition["nutrition (nutrition.calc)"]
      Quiz[quiz]
      Recipes["recipes + meal plans"]
    end
    Content[content]
    Admin["admin<br/>dashboard · catalog · orders · customers ·<br/>inventory · promotions · content · staff · excel"]
    subgraph Core["core"]
      Mail[MailService]
      Notif[NotificationsService]
      Upload["UploadsController (multer)"]
    end
    Prisma["PrismaService (Prisma Client 6)"]
    Seed["seed/ (npm run db:seed)"]

    Pipe --> Guards --> Sales & Nutri & Content & Admin
    Carts --> Pricing
    Orders --> Pricing
    Orders --> Payments
    Orders --> Notif
    Orders --> Mail
    Admin --> Orders
    Admin --> Payments
    Sales & Nutri & Content & Admin & Core --> Prisma
    Seed --> Prisma
  end

  subgraph DB["PostgreSQL 18 (cổng 5433)"]
    Tables["108 bảng · 9 view · 1 materialized view"]
    Funcs["Hàm: fn_allocate_stock_fefo, fn_calc_*, fn_nutri_score_*…"]
    Trg["40 trigger: điểm, lịch sử đơn, audit, Nutri-Score…"]
  end

  Ext["Dịch vụ ngoài (tùy chọn)<br/>SMTP · VNPay sandbox · MoMo sandbox · img.vietqr.io"]
  Files[("backend/uploads<br/>ảnh tải lên")]

  ApiClient -- "REST/JSON" --> Pipe
  Prisma -- "TCP 5433" --> Tables
  Tables --- Funcs --- Trg
  Mail -.-> Ext
  Payments -.-> Ext
  Upload --> Files
```

| Thành phần | Trách nhiệm chính |
|---|---|
| `PricingService` | Nơi duy nhất tính giá, giảm giá, phí ship và điểm |
| `OrdersService.placeOrder` | Tạo đơn nguyên tử, giữ hàng FEFO |
| `OrderLifecycleService` | Nơi duy nhất đổi trạng thái đơn và xử lý tác động phụ |
| `RolesGuard` + `permissions.ts` | RBAC theo quyền |
| `OrdersCron` | Hủy đơn online quá hạn thanh toán |
| `admin/excel.ts` | Xuất Excel bằng ExcelJS |
