# FINAL RELEASE CHECKLIST – NUTRIO Food

- **Ngày kiểm tra**: 14/11/2026, Windows 11, Node.js 24.18, PostgreSQL 18.6 (embedded, cổng 5433).
- **Ký hiệu**: **PASS** = đã kiểm tra thật và đạt · **WARNING** = chạy được nhưng còn lưu ý hoặc đang chờ quyết định · **NOT READY** = phải xử lý trước khi nộp/push.
- **Không có thao tác nào xóa dữ liệu, seed lại, làm mới flash sale, commit hay push.** Các thao tác thay đổi dữ liệu chỉ được chạy trên **bản sao** CSDL ở thư mục tạm ngoài repo (cổng 5434).

## Tóm tắt

| Nhóm | Trạng thái |
|---|---|
| 1. An toàn CSDL | **PASS**, với một việc chờ quyết định (dọn dữ liệu kiểm thử) |
| 2. Dữ liệu demo | **WARNING**: biểu đồ 30 ngày phẳng 18 ngày gần nhất; đã có đề xuất |
| 3. Flash sale | **WARNING**: đã hết hạn; lệnh làm mới đã kiểm chứng, chờ yêu cầu |
| 4. Git release | **NOT READY**: `origin/main` đã có 6 commit mới, chồng lấn khoảng 40 file |
| 5. Kiểm tra cuối | **PASS** (41/41 test, 2 build, setup, README, 6 tài khoản) |

**Kết luận**: ứng dụng đã sẵn sàng để demo và nộp mã nguồn. **Chưa sẵn sàng để push lên `main`** cho tới khi nhóm quyết định cách tích hợp với các commit mới trên GitHub (§4).

---

## 1. An toàn CSDL

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1.1 | Rà soát `backend/scripts/cleanup-test-data.mjs` | **PASS** | Chỉ chọn dữ liệu có dấu hiệu test (`e2e-*`, `idem-key-*`, `guest@test.vn`, SKU `TEST-*`, giỏ `guest-e2e-*`). Mặc định dry run. `--apply` chạy trong 1 transaction và đảo ngược tồn kho, suất flash sale, lượt bán, điểm/hạng trước khi xóa |
| 1.2 | Trigger có thể gây sai lệch khi xóa | **PASS** | `trg_loyalty_apply` chỉ chạy khi INSERT, nên không bị trừ điểm hai lần. `trg_coupon_usage_count` và `trg_reviews_rating` chạy khi DELETE và trả lượt mã / tính lại điểm sao, đúng mong muốn. Trigger audit sẽ thêm dòng vào `audit_logs` (bình thường) |
| 1.3 | Quan hệ khóa ngoại | **PASS** | Đã liệt kê 48 khóa ngoại trỏ tới các bảng bị xóa. 6 kiểm tra chặn/nhầm lẫn đều = 0: combo, gói định kỳ, đơn thật chứa sản phẩm test, phân bổ của đơn thật trên lô test, đơn seed bị chọn, đơn của khách khác ([CLEANUP_PREVIEW.md §4](docs/release/CLEANUP_PREVIEW.md#4-kiểm-tra-khóa-ngoại-và-an-toàn-phải-bằng-0)) |
| 1.4 | `db:backup` | **PASS** | `pgdata-20261114-065755` (trước kiểm thử), `pgdata-20261114-070924` (trạng thái cuối, dừng sạch bằng `pg_ctl`), `pgdata-20261114-071049` (bản thừa do mình chạy nhầm thêm một lần, cùng dữ liệu với 070924, có thể xóa). Bản cũ `pgdata-20261107-070721` vẫn còn |
| 1.5 | Dry-run cleanup | **PASS** | 11 đơn (#34, #174–#183), 5 sản phẩm (#62–#66), 6 giỏ, 15 giao dịch điểm, 5 đánh giá |
| 1.6 | Danh sách chính xác dữ liệu dự kiến xóa | **PASS** | [docs/release/CLEANUP_PREVIEW.md](docs/release/CLEANUP_PREVIEW.md): từng đơn, từng bảng phụ thuộc, tồn kho/điểm/flash sale trước → sau |
| 1.7 | Chạy thử `--apply` trên bản sao của bản sao lưu cuối | **PASS** | 151 → 140 đơn, 39 → 34 sản phẩm. Doanh thu, người dùng, sản phẩm đang bán, mã giảm giá không đổi. Lệch tồn kho, lệch điểm, dòng đơn mồ côi: 0. Dry-run lần 2 trả về 0 |
| 1.8 | `--apply` trên CSDL thật | **WARNING** (chờ đồng ý) | **Chưa chạy.** Lệnh: `npm run db:cleanup-test -- --apply` |
| 1.9 | Không seed lại toàn bộ | **PASS** | Không chạy `db:reset` hay seed trên CSDL thật |
| 1.10 | Tách biệt PostgreSQL của Odoo | **PASS** | Chỉ thao tác cổng 5433/5434 và thư mục của NUTRIO; không kết nối cổng 5432 |

**Sự cố trong quá trình kiểm tra (đã xử lý)**:
- Khi dừng tác vụ chạy `db:start`, một tiến trình con `postgres.exe` (io_worker, PID 12528) bị mồ côi, giữ cổng 5433 khiến mọi kết nối bị treo.
- Mình đã xác định nó chạy từ `backend/node_modules/@embedded-postgres` (không phải Odoo) rồi kết thúc nó. PostgreSQL khởi động lại và tự phục hồi bình thường. Không mất dữ liệu: 151 đơn vẫn đủ.
- Để tránh lặp lại, mình thêm lệnh **`npm run db:stop`** (`pg_ctl stop -m fast`). Đã kiểm thử: dừng sạch, không còn file pid. Tài liệu sao lưu đã chuyển sang dùng lệnh này.

## 2. Dữ liệu demo

| # | Hạng mục | Trạng thái | Chi tiết |
|---|---|---|---|
| 2.1 | Phân tích đơn hàng | **PASS** | Đơn seed 03/08 – 31/10. Trong 30 ngày gần nhất chỉ 10 ngày có doanh thu (16–27/10); **28/10 – 14/11 không có doanh thu** |
| 2.2 | Biểu đồ doanh thu 30 ngày có ý nghĩa | **WARNING** | Nửa phải biểu đồ phẳng; khoảng trống dài thêm mỗi ngày |
| 2.3 | Đề xuất bổ sung | **PASS** | [docs/release/DEMO_DATA_PROPOSAL.md](docs/release/DEMO_DATA_PROPOSAL.md). Phương án B (`db:seed -- --force`) đã đo trên bản sao: số ngày có doanh thu 10 → 26. Có nêu rõ tác động tới tồn kho, điểm, số đánh giá |
| 2.4 | Giữ nguyên tài khoản demo, sản phẩm, dữ liệu quan trọng | **PASS** | Không thay đổi gì trên CSDL thật |

## 3. Flash sale

| # | Hạng mục | Trạng thái | Chi tiết |
|---|---|---|---|
| 3.1 | Trạng thái | **WARNING** | #1 “Flash sale cuối tuần” hết hạn 09/11; #34 “Flash Sale cuối tuần – Hạt cao cấp” hết hạn 11/11. `GET /promotions/flash-sale` trả về rỗng |
| 3.2 | `db:refresh-demo` hoạt động đúng | **PASS** | Trên bản sao: mở lại cả 2, thời lượng giữ nguyên (48 giờ / 96 giờ), cả 2 đang chạy. Lần chạy thứ hai báo “Không có flash sale nào hết hạn”. Chỉ đổi `starts_at`/`ends_at`, không đổi giá hay suất |
| 3.3 | Làm mới trên CSDL thật | **Chờ yêu cầu** | Nên chạy `npm run db:refresh-demo -- --apply` **ngay trước buổi demo** (chương trình #1 chỉ kéo dài 48 giờ) |

## 4. Git release

| # | Hạng mục | Trạng thái | Chi tiết |
|---|---|---|---|
| 4.1 | Đồng bộ với GitHub | **NOT READY** | Local `main` = `02fb04b`. `origin/main` = `5f5784f`, **đi trước 6 commit** của `banghuu11` (15/10 – 10/11; 80 file, +13.308/−1.574 dòng): frontend kiến trúc cũ (services, shadcn, 3D, `/profile`, `/about`, `/contact`, `/products`), backend module `dashboard`, `inventory` |
| 4.2 | Chồng lấn | **NOT READY** | Khoảng 40 file bị sửa ở cả hai phía hoặc bị bản local xóa (`app.module.ts`, `orders/products/users` service/controller, `package.json`, `layout.tsx`, `globals.css`, `components/common/*`, `services/*`…). **Xung đột route**: upstream `app/products/page.tsx` và local `app/(shop)/products/page.tsx` cùng URL `/products`, nên Next.js sẽ lỗi build nếu gộp nguyên trạng |
| 4.3 | Bí mật trong file sẽ commit (364 file) | **PASS** | Không có khóa API, khóa riêng, token. `JWT_SECRET` thật không xuất hiện. `DATABASE_URL` thật trùng giá trị mẫu dev trong `.env.example` (mật khẩu CSDL cục bộ đã công khai trong tài liệu, không phải bí mật production) |
| 4.4 | `.env`, dữ liệu CSDL, file build | **PASS** | Bị gitignore và không nằm trong bộ commit: `backend/.env`, `frontend/.env.local`, `backend/.pgdata/`, `backend/backups/`, `backend/uploads/`, `backend/dist/`, `frontend/.next/`, `node_modules/`, `*.tsbuildinfo`, `next-env.d.ts` |
| 4.5 | Mật khẩu demo trong mã nguồn | **WARNING** | `Admin@123` / `Staff@123` / `User@123` có trong seed, e2e, tài liệu và **khung “Tài khoản demo” trên trang đăng nhập** (`frontend/src/app/(shop)/login/page.tsx`). Phù hợp cho buổi bảo vệ, nhưng phải ẩn/đổi nếu triển khai công khai. `docker-compose.yml` (từ repo gốc) có mật khẩu mặc định dev |
| 4.6 | Line ending | **WARNING** (nhẹ) | Git cảnh báo LF → CRLF với 55 file (do `core.autocrlf`). Không ảnh hưởng chạy |

### 4.7 Phân loại file

**Nên commit** (bộ hiện tại):

| Nhóm | Đường dẫn |
|---|---|
| Mã nguồn backend | `backend/src/**`, `backend/scripts/{db.mjs, cleanup-test-data.mjs, refresh-demo-dates.mjs}`, `backend/test/e2e-api.mjs`, `backend/prisma/schema.prisma`, `backend/package.json`, `backend/package-lock.json`, `backend/.gitignore`, `backend/.env.example` |
| CSDL | `database/init/03_upgrade_v2.sql`, `04_nutrition_v2.sql`, `05_fix_loyalty_trigger.sql` |
| Mã nguồn frontend | `frontend/src/**`, `frontend/public/images/**` (+ `IMAGE_CREDITS.md`), `frontend/package*.json`, `frontend/next.config.ts`, `frontend/.gitignore`, `frontend/.env.example` |
| Tài liệu | `README.md`, `FINAL_HANDOVER_REPORT.md`, `FINAL_RELEASE_CHECKLIST.md`, `docs/**` (gồm `docs/release/`, 24 ảnh JPEG, 2,8 MB) |
| Xóa (52 file) | Mã khung cũ đã được thay thế: `backend/src/modules/{banners,coupons,health}`, `frontend/src/{services,components/common,components/storefront,styles}`, trang admin/auth cũ, ảnh SVG mẫu của Next.js |

**Không được commit** (đã được ignore, giữ nguyên): `.env`, `.env.local`, `.pgdata/`, `.pgdata.before-restore-*/`, `backups/`, `uploads/`, `dist/`, `.next/`, `node_modules/`, `*.tsbuildinfo`.

**Cân nhắc**: `backend/test/app.e2e-spec.ts` và `backend/vitest.config*.ts` là file mẫu không chạy được (vitest chưa cài, test “Hello World”). Nên xóa hoặc thay bằng test thật.

### 4.8 Đề xuất quy trình (nhóm tự thực hiện)

**Không push thẳng lên `main`, không force push.** Đẩy bản này lên nhánh riêng rồi tích hợp cùng `banghuu11`:

```bash
git checkout -b release/final-packaging        # tách từ 02fb04b, giữ nguyên thay đổi đang có
git add -A
git status                                      # kiểm tra lại: không có .env, .pgdata, backups, dist, .next, node_modules
git commit                                      # dùng thông điệp bên dưới
git push -u origin release/final-packaging      # sau đó mở Pull Request vào main
```

Khi tích hợp với `origin/main`, nhóm cần thống nhất:
- Giữ kiến trúc frontend nào (route group `(shop)`/`(admin)` hiện tại hay `services/` + shadcn của upstream).
- Gộp module `dashboard`/`inventory` của upstream vào `admin` hay bỏ.
- Tính năng riêng của upstream cần port sang: hiệu ứng 3D bowl, trang about/contact, tab profile.
- Sau khi gộp phải chạy lại `npm run test:e2e`, `next build`, `nest build`.

**Thông điệp commit đề xuất**:

```
feat: hoàn thiện NUTRIO Food – bán hàng, kho FEFO, quản trị RBAC, dinh dưỡng và tài liệu bàn giao

- Backend NestJS: báo giá dùng chung, tạo đơn trong transaction (FEFO, idempotency),
  vòng đời đơn 8 trạng thái, thanh toán COD/chuyển khoản (VNPay/MoMo tùy chọn),
  RBAC 15 quyền, API quản trị, dinh dưỡng (BMI/BMR/TDEE, quiz, thực đơn 7 ngày)
- CSDL: migration 03–05 (idempotency, order_allocations, sửa trigger điểm)
- Frontend Next.js 16: cửa hàng, tài khoản, trang quản trị theo quyền
- Công cụ CSDL: db:stop, db:backup/db:restore, dọn dữ liệu kiểm thử (dry run mặc định),
  mở lại flash sale demo
- Kiểm thử: bộ E2E API 41 kịch bản (41/41 đạt)
- Tài liệu: docs/ (kiến trúc, CSDL, nghiệp vụ, phân quyền, API, kiểm thử, cài đặt,
  hướng dẫn sử dụng, release), 22 sơ đồ Mermaid, tài liệu bảo vệ, README mới
```

## 5. Kiểm tra cuối

| # | Hạng mục | Trạng thái | Kết quả |
|---|---|---|---|
| 5.1 | 41 API test (`npm run test:e2e`, trên bản build production `node dist/main.js`) | **PASS** | **41 passed, 0 failed**. Lưu ý: mỗi lần chạy thêm 2 đơn + 1 sản phẩm + 1 giỏ kiểm thử (đã nằm trong danh sách dọn) |
| 5.2 | Backend: `tsc --noEmit`, oxlint, `nest build` | **PASS** | 0 lỗi, 0 cảnh báo |
| 5.3 | Frontend: `tsc --noEmit`, ESLint, `next build` | **PASS** | 0 lỗi. ESLint 2 cảnh báo (React Hook Form × React Compiler, không ảnh hưởng). 48 trang (manifest 50 = 48 + `/_global-error` + `/favicon.ico`), 42 trang sinh tĩnh |
| 5.4 | Cài đặt từ đầu (`db.mjs setup` + `db:seed`) trên thư mục sạch, cổng 5434 | **PASS** | Khoảng 23 giây: tạo cụm, chạy 01–05, seed 34 sản phẩm, 139 đơn, 113 đánh giá, 18 công thức. `prisma generate` không chạy lại trong bài thử này vì thư mục tạm dùng chung `node_modules` với API đang chạy; lệnh này đã chạy thành công trong lần setup gốc |
| 5.5 | Chạy lại setup và seed (idempotent) | **PASS** | “already exists – running pending migrations only”, “Demo data already seeded” |
| 5.6 | `npm run db:stop` (mới) | **PASS** | Khi đang chạy: dừng sạch, không còn file pid. Khi không chạy: báo không có server |
| 5.7 | README | **PASS** | Mọi lệnh `npm run …` được nhắc tới đều tồn tại. 24 ảnh tồn tại. Liên kết nội bộ trong 30 file Markdown không có link hỏng. Đã bổ sung `db:stop` |
| 5.8 | 6 tài khoản demo | **PASS** | 6/6 đăng nhập; số quyền 15/8/5/5/0/0; 11 endpoint quản trị trả 200/403 khớp 100% ma trận ([ROLE_PERMISSION.md](docs/ROLE_PERMISSION.md)). Lần chạy đầu bị 429 do giới hạn 10 lần đăng nhập/phút ngay sau bộ E2E; chạy lại sau 1 phút thì đạt |

## 6. Giới hạn đã biết (không chặn nộp, nhưng phải nói khi bảo vệ)

| Hạng mục | Trạng thái |
|---|---|
| VNPay / MoMo chưa thử với cổng sandbox thật (chưa có khóa) | WARNING |
| Email chỉ ghi log (chưa có SMTP) | WARNING |
| Chưa có unit test và CI; file test mẫu không chạy được | WARNING |
| `docker-compose.yml` chưa kiểm thử; mặc định cổng 5432 trùng Odoo | WARNING |
| Giao hàng định kỳ chưa có trong bộ E2E | WARNING |

## 7. Cần bạn xác nhận

| # | Việc | Lệnh | Ảnh hưởng |
|---|---|---|---|
| 1 | Dọn dữ liệu kiểm thử | `npm run db:cleanup-test -- --apply` | Xóa 11 đơn / 5 sản phẩm / 6 giỏ test, đúng như [CLEANUP_PREVIEW.md](docs/release/CLEANUP_PREVIEW.md). Có thể khôi phục từ `pgdata-20261114-070924` |
| 2 | Bổ sung dữ liệu cho biểu đồ 30 ngày | Phương án A (không làm gì) hoặc B (`npm run db:seed -- --force`) | Xem [DEMO_DATA_PROPOSAL.md](docs/release/DEMO_DATA_PROPOSAL.md) |
| 3 | Làm mới flash sale | `npm run db:refresh-demo -- --apply` | Chỉ đổi thời gian bắt đầu/kết thúc; nên chạy sát giờ demo |
| 4 | Chiến lược Git với 6 commit mới trên `origin/main` | §4.8 | Cần thống nhất với `banghuu11` |
| 5 | (Tùy chọn) Xóa bản sao lưu thừa `pgdata-20261114-071049` | xóa thư mục thủ công | Giải phóng 77 MB |
