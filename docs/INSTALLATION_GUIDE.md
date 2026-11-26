# Hướng dẫn cài đặt và chạy

## 1. Yêu cầu

| Thành phần | Yêu cầu |
|---|---|
| Hệ điều hành | Windows 10/11, macOS hoặc Linux (đã chạy thực tế trên Windows 11) |
| Node.js | ≥ 20.9 (đã dùng 24.18). Kèm npm |
| PostgreSQL | **Không cần cài.** Gói `embedded-postgres` tự tải PostgreSQL 18 và chạy riêng ở cổng 5433 |
| Cổng trống | 3000 (frontend), 5001 (API), 5433 (CSDL) |
| Dung lượng | khoảng 1,5 GB cho `node_modules` và khoảng 80 MB cho dữ liệu |

> Máy đã có PostgreSQL khác (ví dụ Odoo ở cổng 5432) vẫn chạy bình thường. NUTRIO dùng cổng và thư mục dữ liệu riêng (xem [DATABASE_DESIGN.md §8](DATABASE_DESIGN.md#8-tách-biệt-với-postgresql-của-odoo)).

## 2. Cài đặt lần đầu

```bash
git clone https://github.com/banghuu11/NATRIO-FOOD.git
cd NATRIO-FOOD

# ---- Backend ----
cd backend
npm install
npm run setup
```

`npm run setup` làm các việc sau:

1. Tạo `backend/.env` từ `.env.example` nếu chưa có. **Không ghi đè** file đã có.
2. Khởi tạo cụm PostgreSQL trong `backend/.pgdata`, tạo CSDL `nutrio_db`, chạy `database/init/01..05`.
3. Sinh Prisma client.
4. Build và nạp dữ liệu demo (`db:seed`).

Trước khi dùng thật, mở `backend/.env` và đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
# ---- Frontend ----
cd ../frontend
npm install
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
```

`.env.local` chỉ có một biến: `NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1`.

> Nếu npm 11 cảnh báo *allow-scripts* hoặc Prisma báo thiếu client, chạy `npx prisma generate` trong `backend`.
> Nếu `prisma generate` báo `EPERM`, hãy dừng API đang chạy rồi chạy lại.

## 3. Chạy hằng ngày (3 cửa sổ terminal)

```bash
# Terminal 1 – CSDL (giữ cửa sổ mở, Ctrl+C để dừng)
cd backend && npm run db:start

# Terminal 2 – API
cd backend && npm run start:dev          # hoặc: npm run build && npm run start:prod

# Terminal 3 – Frontend
cd frontend && npm run dev               # hoặc: npm run build && npm run start
```

| Địa chỉ | Nội dung |
|---|---|
| http://localhost:3000 | Cửa hàng |
| http://localhost:3000/admin | Trang quản trị |
| http://localhost:5001/api/v1/health | Kiểm tra API |
| http://localhost:5001/api/docs | Swagger |

Tài khoản demo: xem [README](../README.md#tài-khoản-demo).

## 4. Biến môi trường

### `backend/.env` (không commit)
| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `PORT` | | Cổng API, mặc định 5001 |
| `DATABASE_URL` | ✅ | `postgresql://postgres:<mật khẩu dev>@localhost:5433/nutrio_db?schema=public`. Cổng trong URL quyết định cổng của PostgreSQL nhúng |
| `JWT_SECRET` | ✅ | Khóa ký JWT, phải đổi |
| `JWT_EXPIRES_IN` | | Mặc định `7d` |
| `FRONTEND_URL` | | CORS, link trong email, URL quay về sau thanh toán |
| `PUBLIC_API_URL` | | Dùng tạo URL tuyệt đối cho ảnh upload |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | | Gửi email. Để trống thì chỉ ghi log |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL` | | Bật VNPay sandbox. Để trống thì ẩn VNPay |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT` | | Bật MoMo sandbox. Để trống thì ẩn MoMo |
| `BANK_NAME`, `BANK_BIN`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` | | Thông tin hiển thị trong mã VietQR |

### `frontend/.env.local` (không commit)
| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL API, mặc định `http://localhost:5001/api/v1` |

## 5. Lệnh quản lý CSDL (`cd backend`)

| Lệnh | Tác dụng | Xóa dữ liệu? |
|---|---|---|
| `npm run db:start` | Chạy PostgreSQL cục bộ | Không |
| `npm run db:stop` | Dừng PostgreSQL an toàn bằng `pg_ctl stop -m fast` (kể cả khi cửa sổ `db:start` đã bị đóng) | Không |
| `npm run db:setup` | Tạo CSDL nếu chưa có; nếu có rồi thì chỉ chạy migration mới | Không |
| `npm run db:migrate` | Chạy các file `03_*.sql` trở đi chưa áp dụng | Không |
| `npm run db:seed` | Nạp dữ liệu demo (chỉ chạy một lần; `-- --force` để thêm một đợt đơn hàng) | Không |
| `npm run db:refresh-demo` | Chạy thử việc mở lại flash sale đã hết hạn; thêm `-- --apply` để thực hiện | Không (chỉ đổi ngày) |
| `npm run db:backup` / `db:backups` | Sao lưu nguội `.pgdata` (chạy `db:stop` trước) / liệt kê | Không |
| `npm run db:restore -- <tên>` | Khôi phục bản sao lưu. Dữ liệu hiện tại được đổi tên, không xóa | Không |
| `npm run db:cleanup-test` | Chạy thử dọn dữ liệu kiểm thử; `-- --apply` để thực hiện | Có, **chỉ dữ liệu kiểm thử** |
| `npm run db:reset -- --yes` | DROP và tạo lại `nutrio_db` | **Có, toàn bộ** |

## 6. Kiểm thử

```bash
cd backend && npm run test:e2e        # cần CSDL + API đang chạy
```

Chi tiết: [TESTING_REPORT.md](TESTING_REPORT.md).

## 7. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| `ECONNREFUSED 127.0.0.1:5433` | Chưa chạy `npm run db:start` |
| Cổng 5433 đã bị dùng | Đổi cổng trong `DATABASE_URL` (ví dụ 5435). Script đọc cổng từ đây |
| Frontend báo lỗi mạng | Kiểm tra API ở `http://localhost:5001/api/v1/health` và `NEXT_PUBLIC_API_URL` |
| `prisma generate` báo `EPERM` | Dừng API rồi chạy lại |
| Đăng nhập báo 429 | Vượt 10 lần/phút; chờ 1 phút |
| Mục Flash sale trên trang chủ trống | Flash sale demo đã hết hạn: `npm run db:refresh-demo -- --apply` |
| `db:backup` báo PostgreSQL đang chạy | Dừng API rồi chạy `npm run db:stop` |
| Cổng 5433 mở nhưng mọi kết nối bị treo | Cửa sổ `db:start` bị đóng đột ngột để lại tiến trình con. Chạy `npm run db:stop`; nếu vẫn treo, kết thúc tiến trình `postgres.exe` có đường dẫn nằm trong `backend/node_modules/@embedded-postgres` (không đụng PostgreSQL của Odoo) |
| Dữ liệu dashboard 30 ngày gần đây trống | Đơn demo sinh theo ngày chạy seed. Xem [DATABASE_DESIGN.md §6, §9.3](DATABASE_DESIGN.md#93-tạo-lại-csdl-demo-từ-đầu-xóa-dữ-liệu) |

## 8. Docker (chưa kiểm thử)

Repo có sẵn `docker-compose.yml` và Dockerfile từ trước, nhưng **chưa được chạy thử** trong dự án này. Nếu dùng:

- Đặt `POSTGRES_PORT` khác 5432 khi máy có Odoo.
- Bổ sung `JWT_SECRET` cho service backend (file hiện chưa khai báo).
- Sau khi CSDL lên, chạy `npm run db:seed`. Lưu ý: các file `03..05` được Docker chạy lúc khởi tạo nhưng không được ghi vào `_sql_migrations`.
