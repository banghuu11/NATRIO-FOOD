# 🌰 NUTRIO (NATRIOFOOD) — Nền Tảng E-Commerce Hạt Dinh Dưỡng & Granola Cá Nhân Hóa Theo Calo

<div align="center">

![NUTRIO Banner](https://img.shields.io/badge/Project-NUTRIO%20Nuts%20E--Commerce-d97706?style=for-the-badge&logo=cookie&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)
![React 19](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS 11](https://img.shields.io/badge/NestJS%2011-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

<p align="center">
  <strong>"Chuyên cung cấp Hạt Macca, Hạnh nhân, Óc chó, Hạt điều & Granola sấy mộc — Định lượng chuẩn xác khẩu phần 30g/ngày theo chỉ số TDEE."</strong>
</p>

[Xem Tính Năng](#-tổng-quan-tính-năng-đột-phá) • [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống) • [Cài Đặt & Chạy](#-hướng-dẫn-cài-đặt--chạy-dự-án) • [Kịch Bản Thuyết Trình](#-kịch-bản-thuyết-trình-đồ-án)

</div>

---

## 🎯 1. Câu Chuyện Cốt Lõi (Core Pitch)

> 💡 **Thông điệp xuyên suốt khi trình diễn đồ án:**  
> *"Hạt dinh dưỡng tuy rất giàu Omega-3, Đạm thực vật và khoáng chất, nhưng nếu ăn không kiểm soát sẽ rất dễ dư thừa calo và chất béo. **NUTRIO** giải quyết triệt để bài toán này: **Tính toán chỉ số TDEE của từng người để định lượng chính xác gói hạt ăn hàng ngày (Daily Nut Pack 30g ~ 175 kcal), gợi ý combo hạt phù hợp theo mục tiêu (KETO, Mẹ bầu, Tập gym, Tim mạch) và minh bạch 100% nguồn gốc nông trường Tây Nguyên & California.**"*

---

## ✨ 2. Tổng Quan Tính Năng Đột Phá

Các tính năng được thiết kế theo tiêu chuẩn sản phẩm thương mại thực tế, phân bổ độ khó rõ ràng và giải quyết bài toán người dùng thực tiễn:

```
                  ┌──────────────────────────────────────────────┐
                  │          HỒ SƠ SỨC KHỎE NGƯỜI DÙNG            │
                  │  (Chiều cao, Cân nặng, Tuổi, Mục tiêu, Dị ứng)│
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    NUTRIO ENGINE: TÍNH TOÁN BMI / BMR / TDEE  │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
            ┌────────────────────┘                └────────────────────┐
            ▼                                                          ▼
┌───────────────────────────────┐                          ┌───────────────────────────────┐
│     ĐỀ XUẤT THỰC ĐƠN TUẦN     │                          │     GIỎ HÀNG DINH DƯỠNG       │
│ • Meal Plan 7 ngày theo Calo  │                          │ • Macro Tracking Realtime     │
│ • 1-Click gom nguyên liệu     │                          │ • Cảnh báo dị ứng & NutriScore│
└───────────────────────────────┘                          └───────────────────────────────┘
```

---

### 🌟 Nhóm 1: Cá Nhân Hóa Theo Sức Khỏe (Key Differentiator)

| Tính Năng | Mô Tả Chi Tiết | Độ Khó |
| :--- | :--- | :---: |
| **Hồ sơ sức khỏe thông minh** | Nhập chiều cao, cân nặng, độ tuổi, tỷ lệ vận động, mục tiêu (giảm cân, giữ dáng, tăng cơ). Hệ thống tự động tính toán chỉ số **BMI, BMR, TDEE** và lượng Calo / Macro (Carb, Fat, Protein) khuyến nghị mỗi ngày. | `Dễ` |
| **Quiz gợi ý sản phẩm theo nhu cầu** | Bộ 5 câu hỏi trắc nghiệm nhanh (thói quen ăn uống, quỹ thời gian, ngân sách, mục tiêu) $\rightarrow$ Tự động sinh danh mục sản phẩm và combo gợi ý tối ưu. | `Dễ - Vừa` |
| **Bộ lọc an toàn dị ứng** | Người dùng đánh dấu các thành phần dị ứng (đậu phộng, lactose/sữa, gluten, hải sản...). Hệ thống sẽ **tự động ẩn** hoặc gắn nhãn **cảnh báo đỏ nổi bật** trên các sản phẩm có chứa chất đó. | `Dễ` |
| **Thực đơn tự động (Smart Meal Plan)** | Dựa trên mục tiêu calo/ngày, thuật toán tự động ghép thực đơn 7 ngày từ nguồn thực phẩm tươi và chế biến sẵn có trong kho. Hỗ trợ nút **"Thêm toàn bộ thực đơn vào giỏ"** chỉ với 1 chạm. | `Vừa` |

---

### 🥗 Nhóm 2: Dinh Dưỡng Thông Minh & Đánh Giá Chất Lượng

| Tính Năng | Mô Tả Chi Tiết | Độ Khó |
| :--- | :--- | :---: |
| **Máy tính dinh dưỡng giỏ hàng realtime** | Giỏ hàng tích hợp widget theo dõi năng lượng: Tổng Calo, Protein, Carb, Fat biến thiên ngay khi thêm/bớt số lượng, so sánh trực quan với mục tiêu TDEE bằng biểu đồ tròn trực quan. | `Dễ` |
| **Hệ thống Nutri-Score (A $\rightarrow$ E)** | Tự động phân loại chỉ số dinh dưỡng theo tiêu chuẩn Châu Âu từ hàm lượng đường, muối, chất béo bão hòa, chất xơ và đạm, thể hiện bằng nhãn màu trực quan. | `Dễ` |
| **So sánh dinh dưỡng đa sản phẩm** | Cho phép chọn 2–3 sản phẩm cùng loại để đối chiếu song song bảng thành phần dinh dưỡng, lượng đường, calo và giá trị kinh tế. | `Dễ` |
| **Gợi ý sản phẩm thay thế lành mạnh (Smart Swap)** | Khi xem sản phẩm có lượng calo/đường cao (Nutri-Score D/E), hệ thống chủ động gợi ý phương án thay thế tối ưu hơn (Nutri-Score A/B) trong cùng ngành hàng. | `Vừa` |

---

### 🛒 Nhóm 3: Trải Nghiệm Mua Sắm & E-Commerce Chuyên Nghiệp

| Tính Năng | Mô Tả Chi Tiết | Độ Khó |
| :--- | :--- | :---: |
| **Shop the Recipe (Nấu ăn & Đi chợ)** | Khám phá các công thức Eat-Clean / KETO / Vegan kèm video, định lượng calo từng phần và nút bấm gom toàn bộ nguyên liệu vào giỏ hàng. | `Vừa` |
| **Gợi ý "Thường mua cùng" (Frequently Bought Together)** | Thuật toán gợi ý kèm dựa trên hành vi khách hàng và combo món ăn phối hợp dinh dưỡng. | `Vừa` |
| **Mua lại 1-chạm (Quick Reorder)** | Tái tạo nhanh giỏ hàng từ lịch sử các đơn hàng trước đó mà không cần tìm kiếm lại từng món. | `Dễ` |
| **Wishlist & Price Alert** | Danh sách yêu thích kết hợp cơ chế cảnh báo khi sản phẩm trong wishlist giảm giá. | `Dễ` |
| **Đánh giá kèm ảnh & Verified Buyer** | Hệ thống review có ảnh chụp thực tế, gắn nhãn kiểm chứng "Đã mua hàng". | `Dễ` |
| **Khuyến mãi & Tích điểm thành viên** | Hệ thống Loyalty phân hạng Bronze / Silver / Gold với mã giảm giá theo hạng. | `Vừa` |
| **Giao hàng định kỳ (Subscription Model - Mô phỏng)** | Cho phép khách hàng đặt lịch giao rau củ/bữa ăn hàng tuần với quyền tạm dừng/hủy linh hoạt. | `Khó` |

---

### 🤖 Nhóm 4: Trí Tuệ Nhân Tạo (AI Powered Features)

| Tính Năng | Mô Tả Chi Tiết | Độ Khó |
| :--- | :--- | :---: |
| **AI Nutritionist Chatbot** | Trợ lý ảo tư vấn dinh dưỡng tích hợp LLM (OpenAI / Gemini API), được grounding dữ liệu sản phẩm trong kho để giải đáp thắc mắc và đưa ra gợi ý giỏ hàng thông minh. | `Vừa` |
| **Tìm kiếm bằng ngôn ngữ tự nhiên (Semantic Search)** | Tìm kiếm thông minh qua truy vấn tự nhiên như: *"đồ ăn sáng ít calo cho người tập gym"*, *"thực phẩm giàu đạm không lactose"*. | `Vừa - Khó` |

---

### 🛡️ Nhóm 5: Tin Cậy, Minh Bạch Nguồn Gốc & An Toàn

| Tính Năng | Mô Tả Chi Tiết | Độ Khó |
| :--- | :--- | :---: |
| **Truy xuất nguồn gốc bằng QR Code (Traceability)** | Mỗi sản phẩm có trang hồ sơ minh bạch: Nông trại đối tác, quy trình canh tác, ngày thu hoạch và chứng chỉ kiểm định an toàn. | `Vừa` |
| **Huy hiệu chứng nhận tiêu chuẩn** | Hiển thị rõ ràng các chuẩn chất lượng: **Organic**, **VietGAP**, **Non-GMO**, **Vegan**, **HACCP**. | `Dễ` |
| **Cảnh báo cận hạn sử dụng (Expiry Tracker)** | Minh bạch hạn sử dụng đến từng ngày; tự động giảm giá xả hàng cho sản phẩm cận date với nhãn thông báo rõ ràng. | `Dễ` |

---

### 🎮 Nhóm 6: Giữ Chân Người Dùng (Gamification & Habit Building)

| Tính Năng | Mô Tả Chi Tiết | Độ Khó |
| :--- | :--- | :---: |
| **Thử thách "7 Ngày Ăn Sạch" (7-Day Clean Eating)** | Check-in thực đơn mỗi ngày, hoàn thành thử thách để mở khóa huy hiệu và nhận voucher ưu đãi. | `Vừa` |
| **Nhật ký dinh dưỡng hàng ngày** | Biểu đồ theo dõi năng lượng dung nạp qua các tuần, giúp người dùng duy trì thói quen sống khỏe. | `Vừa` |
| **Giới thiệu bạn bè (Referral System)** | Tặng voucher cho cả người giới thiệu và người được giới thiệu khi hoàn thành đơn đầu tiên. | `Vừa` |

---

### 📊 Nhóm 7: Quản Trị Hệ Thống Toàn Diện (Admin Dashboard)

| Tính Năng | Mô Tả Chi Tiết | Độ Khó |
| :--- | :--- | :---: |
| **Báo cáo & Phân tích Dashboard** | Biểu đồ trực quan doanh thu theo thời gian, top sản phẩm bán chạy, tỷ lệ hoàn tất đơn, phân bổ nhóm dinh dưỡng. | `Vừa` |
| **Quản lý kho & Cảnh báo thông minh** | Tự động cảnh báo khi hàng tồn kho xuống thấp hoặc sắp hết hạn sử dụng. | `Dễ` |
| **Quản lý quy trình đơn hàng** | Quy trình chuẩn: `Chờ xác nhận` $\rightarrow$ `Đang xử lý` $\rightarrow$ `Đang giao` $\rightarrow$ `Hoàn tất` $\rightarrow$ `Đã hủy`. | `Dễ` |
| **Phân quyền người dùng (RBAC)** | Phân quyền chi tiết: **Super Admin**, **Nhân viên kho**, **Nhân viên chăm sóc khách hàng / bán hàng**. | `Vừa` |
| **Xuất dữ liệu hóa đơn & Báo cáo** | Hỗ trợ xuất dữ liệu hóa đơn, thống kê doanh thu sang định dạng **Excel (.xlsx)** và in phiếu xuất kho **PDF**. | `Vừa` |

---

### ⚡ Nhóm 8: Kỹ Thuật & Tối Ưu Nền Tảng

* 📱 **Mobile-First & Modern UI**: Tối ưu chuẩn giao diện di động, hỗ trợ chuyển đổi Dark / Light Mode mượt mà.
* 🚀 **SEO & Tốc độ tải trang**: URL thân thiện, OpenGraph Meta tags, dynamic sitemap, lazy-loading hình ảnh qua Next.js Image Optimization.
* 🔒 **Bảo mật chuẩn Enterprise**: Mã hóa mật khẩu bằng `Bcrypt`, xác thực `JWT (JSON Web Token)`, Helmet bảo vệ HTTP headers, xử lý Validation Pipe chống SQL Injection & XSS.
* 💳 **Cổng thanh toán điện tử**: Tích hợp cổng thanh toán Sandbox **VNPay** và **MoMo QR**.
* 📧 **Hệ thống Email tự động**: Gửi email xác nhận đơn hàng, hóa đơn điện tử và mã kích hoạt qua `Nodemailer`.

---

## 🏗️ 3. Kiến Trúc Hệ Thống (Architecture)

### 🧩 Sơ đồ phân tầng hệ thống (Clean Architecture)

```mermaid
graph TD
    subgraph Frontend["Frontend Layer (Next.js 16 + React 19)"]
        UI["UI / Tailwind CSS v4 / Base UI"]
        State["Zustand Store / TanStack Query"]
        Router["App Router & Server Actions"]
    end

    subgraph Backend["Backend Layer (NestJS 11 + Express)"]
        Gateway["REST API Gateway / Swagger"]
        Auth["Auth Service (JWT / Passport / Bcrypt)"]
        Modules["Modules: Users | HealthProfile | Products | MealPlan | Orders | AI"]
        Prisma["Prisma ORM Layer"]
    end

    subgraph Database["Database & Cloud Services"]
        PG[("PostgreSQL Database")]
        Cloudinary["Cloudinary CDN (Images)"]
        AI_API["OpenAI / Gemini API"]
        Payment["VNPay / MoMo Sandbox"]
        SMTP["SMTP Mail Server"]
    end

    UI --> State --> Router
    Router -->|HTTPS / REST API| Gateway
    Gateway --> Auth
    Gateway --> Modules
    Modules --> Prisma
    Prisma --> PG
    Modules --> Cloudinary
    Modules --> AI_API
    Modules --> Payment
    Modules --> SMTP
```

---

## 💻 4. Công Nghệ Sử Dụng (Tech Stack)

### Frontend
* **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components)
* **Library**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Sass](https://sass-lang.com/), [clsx](https://github.com/lukeed/clsx)
* **UI Primitives & Icons**: `@base-ui/react`, [Lucide React](https://lucide.dev/), [Swiper](https://swiperjs.com/)
* **State Management & Data Fetching**: [Zustand](https://zustand-demo.pmnd.rs/), [TanStack React Query v5](https://tanstack.com/query/latest)
* **Form & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
* **Notifications & Tools**: [Sonner](https://sonner.emilkowal.ski/), `react-to-print`, `date-fns`

### Backend
* **Core Framework**: [NestJS 11](https://nestjs.com/) (Modular Architecture, Dependency Injection)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **ORM & Database**: [Prisma ORM v6](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/)
* **Authentication & Security**: [Passport.js](http://www.passportjs.org/), [JWT](https://jwt.io/), [Bcrypt](https://github.com/kelektiv/node.bcrypt.js), [Helmet](https://helmetjs.github.io/)
* **Documentation**: [Swagger / OpenAPI](https://swagger.io/)
* **File Storage**: [Cloudinary](https://cloudinary.com/), [Multer](https://github.com/expressjs/multer)
* **Mailing**: [Nodemailer](https://nodemailer.com/)

---

## 📂 5. Cấu Trúc Thư Mục (Folder Structure)

```text
NATRIOFOOD/
├── backend/                  # NestJS Backend API Service
│   ├── prisma/               # Prisma Schema & Migrations
│   │   └── schema.prisma     # Định nghĩa Database Models
│   ├── src/
│   │   ├── auth/             # Xác thực, JWT & Phân quyền RBAC
│   │   ├── users/            # Quản lý người dùng & Profile sức khỏe
│   │   ├── products/         # Quản lý sản phẩm, Nutri-Score & Phân loại
│   │   ├── meal-plans/       # Xây dựng thực đơn & Đề xuất dinh dưỡng
│   │   ├── cart/             # Giỏ hàng & Bộ tính Macro realtime
│   │   ├── orders/           # Đơn hàng, Thanh toán & In hóa đơn
│   │   ├── ai-consultant/    # Tích hợp AI Chatbot & Semantic Search
│   │   └── common/           # Guards, Interceptors, Filters, Pipes
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # Next.js 16 Web Application
│   ├── public/               # Static assets, logos, icons
│   ├── src/
│   │   ├── app/              # Next.js App Router (Pages & Layouts)
│   │   │   ├── (auth)/       # Đăng nhập, Đăng ký, Quên mật khẩu
│   │   │   ├── (shop)/       # Trang chủ, Chi tiết SP, Giỏ hàng, Checkout
│   │   │   ├── (health)/     # Máy tính BMR/TDEE, Meal Plan, Quiz
│   │   │   └── (admin)/      # Dashboard, Quản lý sản phẩm, Đơn hàng
│   │   ├── components/       # Reusable UI Components (Navbar, Cards, Modals)
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── services/         # API Client & Axios Interceptors
│   │   ├── stores/           # Zustand State Stores (Auth, Cart, Health)
│   │   └── types/            # TypeScript Interface & Type Definitions
│   ├── Dockerfile
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 6. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu tiên quyết (Prerequisites)
* **Node.js**: Phiên bản `>= 20.x`
* **Package Manager**: `npm` hoặc `yarn` / `pnpm`
* **Database**: PostgreSQL (cài cục bộ hoặc qua Docker)

---

### Bước 1: Clone kho lưu trữ
```bash
git clone https://github.com/banghuu11/NATRIO-FOOD.git
cd NATRIOFOOD
```

---

### Bước 2: Cấu hình và khởi chạy Backend

1. **Di chuyển vào thư mục backend**:
   ```bash
   cd backend
   ```

2. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường**:
   Tạo file `.env` tại thư mục `backend/` với nội dung mẫu:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nutrio_db?schema=public"
   JWT_SECRET="your_super_secret_jwt_key"
   JWT_EXPIRES_IN="7d"

   # Cloudinary (Ảnh)
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"

   # Mailer
   MAIL_HOST="smtp.gmail.com"
   MAIL_USER="your_email@gmail.com"
   MAIL_PASS="your_app_password"
   ```

4. **Chạy Migration Database với Prisma**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Khởi chạy máy chủ Backend**:
   ```bash
   # Chế độ phát triển (Watch mode)
   npm run start:dev
   ```
   > 📌 *API Swagger Documentation sẽ hoạt động tại:* `http://localhost:5000/api/docs`

---

### Bước 3: Cấu hình và khởi chạy Frontend

1. **Mở terminal mới và di chuyển vào frontend**:
   ```bash
   cd frontend
   ```

2. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường**:
   Tạo file `.env.local` tại thư mục `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   ```

4. **Khởi chạy Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   > 🌐 *Truy cập ứng dụng tại:* `http://localhost:3000`

---

## 🎬 7. Kịch Bản Thuyết Trình Đồ Án (Demo Flow Gợi Ý)

Khi báo cáo trước hội đồng đánh giá, nên dẫn dắt câu chuyện theo hành trình trải nghiệm của khách hàng (User Journey) để tạo ấn tượng mạnh mẽ nhất:

1. **Mở đầu (1 phút)**:
   * Giới thiệu bài toán: Nhu cầu ăn sạch (Eat-Clean, KETO, Gym) ngày càng tăng nhưng đa số người tiêu dùng **không biết cơ thể mình cần nạp bao nhiêu calo**, rất dễ bỏ cuộc hoặc mua sai thực phẩm.
   * Giới thiệu giải pháp: **NUTRIO** — Nền tảng thương mại điện tử dinh dưỡng cá nhân hóa.

2. **Khám phá & Cá nhân hóa (3 phút)**:
   * Thực hiện nhập hồ sơ sức khỏe: Nhập chiều cao, cân nặng, mục tiêu (Giảm cân).
   * Demo hệ thống tính toán tức thì **TDEE = 1,850 kcal/ngày**.
   * Demo tính năng **Quiz 5 câu hỏi** và xem danh mục gợi ý sản phẩm phù hợp.
   * Chọn bộ lọc **Dị ứng Sữa & Đậu phộng** $\rightarrow$ Xem hệ thống lập tức ẩn/cảnh báo đỏ sản phẩm chứa chất dị ứng.

3. **Trải nghiệm mua sắm thông minh (3 phút)**:
   * Nhấn nút tạo **Meal Plan 7 ngày** $\rightarrow$ Hệ thống tự cân đối thực đơn chuẩn 1,850 kcal/ngày.
   * Thao tác **1-Click thêm toàn bộ nguyên liệu tuần vào giỏ**.
   * Mở giỏ hàng: Trình diễn **Widget theo dõi Macro Realtime** (Carb / Fat / Protein nhảy theo thời gian thực khi chỉnh số lượng).
   * So sánh 2 sản phẩm và thử nghiệm tính năng **Gợi ý sản phẩm thay thế lành mạnh (Smart Swap)** từ Nutri-Score D sang A.

4. **AI & Minh bạch nguồn gốc (2 phút)**:
   * Mở **AI Chatbot**: Hỏi *"Gợi ý bữa phụ dưới 200 calo giàu protein"* $\rightarrow$ AI trả lời chính xác dựa trên danh mục trong kho.
   * Quét mã **QR Truy xuất nguồn gốc** $\rightarrow$ Mở trang nông trại, chứng nhận VietGAP, Organic.

5. **Trang Quản trị Admin & Báo cáo (2 phút)**:
   * Đăng nhập tài khoản Admin: Xem Dashboard doanh thu, biểu đồ phân tích khách hàng.
   * Xem tính năng cảnh báo tồn kho thấp & sản phẩm cận date.
   * Thao tác đổi trạng thái đơn hàng & In hóa đơn/phiếu xuất kho chuẩn PDF.

---

## 👥 8. Đội Ngũ Phát Triển (Authors)

* **Dự án**: NUTRIO (NATRIOFOOD) E-Commerce Platform
* **Sinh viên thực hiện**: Nhóm 04
* **Đơn vị đào tạo**: HUFLIT

---

<div align="center">
  <sub>Xây dựng với ❤️ và tinh thần lan tỏa lối sống xanh, khỏe mạnh cho cộng đồng.</sub>
</div>
