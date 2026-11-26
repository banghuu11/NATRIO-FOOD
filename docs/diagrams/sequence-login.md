# Sơ đồ tuần tự – Đăng nhập và gọi API có bảo vệ

Căn cứ: `frontend/src/stores/auth.ts`, `lib/api.ts`; `backend/src/modules/auth/auth.service.ts`, `strategies/jwt.strategy.ts`, `common/guards/*.ts`.

```mermaid
sequenceDiagram
  autonumber
  actor U as Người dùng
  participant FE as Next.js (trang /login)
  participant API as NestJS AuthController
  participant TG as ThrottlerGuard
  participant AS as AuthService
  participant DB as PostgreSQL

  U->>FE: Nhập email + mật khẩu
  FE->>FE: Kiểm tra định dạng (Zod)
  FE->>API: POST /api/v1/auth/login
  API->>TG: Giới hạn 10 lần/phút/IP
  alt Vượt giới hạn
    TG-->>FE: 429 Too Many Requests
  end
  API->>AS: login(dto) (ValidationPipe đã kiểm tra DTO)
  AS->>DB: SELECT users WHERE email = ? (citext)
  AS->>AS: bcrypt.compare(password, password_hash)
  alt Sai email/mật khẩu
    AS-->>FE: 401 "Email hoặc mật khẩu không chính xác"
  else Tài khoản bị khóa / đã xóa
    AS-->>FE: 401 "Tài khoản của bạn đã bị khóa…"
  else Hợp lệ
    AS->>DB: UPDATE users SET last_login_at
    AS->>DB: Đọc vai trò + quyền (user_roles → role_permissions)
    AS->>AS: Ký JWT {sub: userId}, hết hạn JWT_EXPIRES_IN (7d)
    AS-->>FE: 201 {accessToken, user{roles, permissions, isStaff}}
    FE->>FE: Lưu token (localStorage nutrio_token)
    FE->>API: POST /cart/merge (gộp giỏ khách vãng lai)
    FE-->>U: Chuyển về trang trước / trang quản trị
  end

  Note over FE,DB: Các request sau
  U->>FE: Mở /admin/orders
  FE->>API: GET /admin/orders + Authorization: Bearer JWT
  API->>API: JwtAuthGuard: xác minh chữ ký và hạn token
  API->>DB: JwtStrategy.validate: đọc lại user, is_active, vai trò, quyền
  alt User bị khóa
    API-->>FE: 401 → frontend đăng xuất
  end
  API->>API: RolesGuard: cần quyền order.read (Super Admin luôn đạt)
  alt Thiếu quyền
    API-->>FE: 403 "Bạn không có quyền: order.read"
  else Đủ quyền
    API->>DB: Truy vấn đơn hàng
    API-->>FE: 200 {data, meta}
  end
```
