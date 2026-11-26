# Sơ đồ triển khai (Deployment)

## 1. Môi trường đã chạy và kiểm thử: máy phát triển Windows 11

Căn cứ: `backend/scripts/db.mjs`, `backend/.env.example`, `frontend/.env.example`, `backend/src/main.ts`.

```mermaid
flowchart TB
  subgraph PC["Máy tính Windows 11 (localhost)"]
    direction TB
    subgraph Browser["Trình duyệt (Edge/Chrome)"]
      Tab["http://localhost:3000"]
    end

    subgraph NodeFE["Tiến trình Node.js – Next.js 16"]
      Next["next dev / next start<br/>cổng 3000<br/>frontend/.env.local: NEXT_PUBLIC_API_URL"]
      Static["public/images (ảnh sản phẩm)"]
    end

    subgraph NodeBE["Tiến trình Node.js – NestJS 11"]
      Nest["node dist/main.js<br/>cổng 5001 · /api/v1 · /api/docs<br/>backend/.env"]
      Uploads[("backend/uploads")]
      Cron["@nestjs/schedule<br/>cron 10 phút"]
    end

    subgraph PGNutrio["PostgreSQL 18.6 – embedded-postgres (npm run db:start)"]
      PG5433["cổng 5433 · CSDL nutrio_db"]
      PGData[("backend/.pgdata")]
      Backups[("backend/backups<br/>sao lưu nguội")]
    end

    subgraph PGOdoo["PostgreSQL 12 – dịch vụ của Odoo (không liên quan)"]
      PG5432["cổng 5432"]
    end

    Tab -- "HTTP :3000" --> Next
    Tab -- "REST/JSON :5001<br/>(CORS: FRONTEND_URL)" --> Nest
    Tab -- "GET /uploads/*" --> Nest
    Next --- Static
    Nest -- "Prisma / pg · TCP :5433<br/>DATABASE_URL" --> PG5433
    Nest --- Uploads
    Nest --- Cron
    PG5433 --- PGData
    PGData -. "npm run db:backup<br/>(khi server dừng)" .-> Backups
    PG5432 ~~~ PG5433
  end

  Internet(("Internet – tùy chọn"))
  Nest -. "SMTP · VNPay/MoMo sandbox" .-> Internet
  Tab -. "ảnh VietQR (img.vietqr.io)" .-> Internet
```

- **3 tiến trình** chạy song song trong 3 terminal: `npm run db:start`, `npm run start:dev` (hoặc `start:prod`), `npm run dev`.
- NUTRIO **không kết nối** tới PostgreSQL của Odoo. Hai cụm khác phiên bản, khác cổng và khác thư mục dữ liệu.

## 2. Triển khai đề xuất (chưa thực hiện)

Phương án tham khảo nếu đưa lên máy chủ. Phương án này **chưa được triển khai hay kiểm thử** trong dự án.

```mermaid
flowchart LR
  User((Người dùng)) -- HTTPS --> Proxy["Reverse proxy (Nginx/Caddy)<br/>TLS"]
  Proxy -- "/" --> FE["Next.js (next start)"]
  Proxy -- "/api, /uploads" --> BE["NestJS (node dist/main.js)<br/>NODE_ENV=production"]
  BE --> PG[("PostgreSQL ≥ 14<br/>máy chủ CSDL riêng")]
  BE --> Store[("Lưu trữ ảnh<br/>ổ đĩa hoặc object storage")]
  BE -. HTTPS .-> GW["VNPay/MoMo · SMTP"]
```

Việc cần làm khi triển khai thật:

- Đặt `JWT_SECRET` mạnh.
- Đặt `FRONTEND_URL`/`PUBLIC_API_URL` theo tên miền.
- Dùng PostgreSQL có `pg_dump` để sao lưu định kỳ.
- Cấu hình SMTP và khóa cổng thanh toán.
- Bật HTTPS.
