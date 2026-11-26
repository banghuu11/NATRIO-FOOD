# ERD – Sơ đồ thực thể liên kết

CSDL có 108 bảng. Để dễ đọc, ERD được chia thành 4 sơ đồ theo miền nghiệp vụ. Các quan hệ lấy đúng từ khóa ngoại trong `pg_constraint`. Mỗi bảng chỉ ghi các cột chính; danh sách cột đầy đủ xem `database/init/01_schema.sql` hoặc `backend/prisma/schema.prisma`.

Hành vi khi xóa bản ghi cha: CASCADE (xóa theo), SET NULL (đặt null), NO ACTION/RESTRICT (chặn xóa). Chi tiết ở [DATABASE_DESIGN.md §4](../DATABASE_DESIGN.md#4-ràng-buộc-toàn-vẹn-tiêu-biểu).

## 1. Người dùng, phân quyền, thành viên

```mermaid
erDiagram
  users ||--o{ user_roles : "có"
  roles ||--o{ user_roles : "gán cho"
  roles ||--o{ role_permissions : "gồm"
  permissions ||--o{ role_permissions : "thuộc"
  users ||--o{ addresses : "sổ địa chỉ"
  users ||--o| loyalty_accounts : "tài khoản điểm"
  membership_tiers ||--o{ loyalty_accounts : "hạng"
  users ||--o{ loyalty_transactions : "giao dịch điểm"
  orders |o--o{ loyalty_transactions : "phát sinh từ"
  users ||--o| health_profiles : "hồ sơ sức khỏe"
  users ||--o{ notifications : "nhận"
  users ||--o{ wishlists : "yêu thích"
  users |o--o{ users : "giới thiệu (referred_by)"

  users {
    bigint id PK
    citext email UK
    varchar phone UK
    varchar password_hash
    varchar full_name
    gender_type gender
    date date_of_birth
    varchar referral_code UK
    boolean is_active
    timestamptz deleted_at
  }
  roles {
    bigint id PK
    varchar code UK "admin, staff_sales, staff_warehouse, staff_support, customer"
  }
  permissions {
    bigint id PK
    varchar code UK "15 mã quyền"
  }
  loyalty_accounts {
    bigint user_id FK
    int points_balance "CHECK >= 0"
    int lifetime_points "CHECK >= 0"
    bigint tier_id FK
  }
  membership_tiers {
    bigint id PK
    varchar code "member, silver, gold"
    int min_points
    numeric discount_percent
    numeric points_multiplier
    jsonb benefits
  }
  loyalty_transactions {
    bigint id PK
    loyalty_txn_type txn_type "earn, redeem, refund, adjust, expire"
    int points
    bigint order_id FK
  }
  health_profiles {
    bigint user_id FK
    numeric height_cm
    numeric weight_kg
    activity_level activity_level
    goal_type goal
    numeric bmi
    int bmr
    int tdee
    int daily_calorie_target
  }
```

## 2. Sản phẩm và kho

```mermaid
erDiagram
  categories |o--o{ categories : "danh mục cha"
  categories ||--o{ products : "chứa (NO ACTION)"
  products ||--o{ product_variants : "quy cách"
  products ||--o{ product_images : "ảnh"
  products ||--o| nutrition_facts : "dinh dưỡng"
  products ||--o{ product_allergens : ""
  allergens ||--o{ product_allergens : ""
  products ||--o{ product_diets : ""
  diets ||--o{ product_diets : ""
  product_variants ||--o{ product_batches : "lô (RESTRICT)"
  product_batches ||--o{ inventory : "tồn theo kho"
  warehouses ||--o{ inventory : ""
  product_batches ||--o{ stock_movements : "nhật ký (RESTRICT)"
  warehouses ||--o{ stock_movements : ""
  product_variants ||--o{ flash_sale_items : ""
  flash_sales ||--o{ flash_sale_items : ""

  products {
    bigint id PK
    varchar slug UK
    varchar name
    bigint category_id FK
    product_status status
    char nutri_score_grade "trigger tính"
    int sold_count
    numeric avg_rating
    tsvector search_vector
    timestamptz deleted_at "xóa mềm"
  }
  product_variants {
    bigint id PK
    varchar sku UK
    numeric net_weight_g "CHECK > 0"
    numeric price
    numeric compare_at_price "CHECK >= price"
    int reorder_level
  }
  product_batches {
    bigint id PK
    varchar batch_code UK
    varchar qr_code UK
    date manufactured_on
    date expires_on "CHECK > manufactured_on"
    int quantity_received
  }
  inventory {
    bigint id PK
    bigint warehouse_id FK
    bigint batch_id FK
    int quantity_on_hand "CHECK >= 0"
    int quantity_reserved "CHECK 0..on_hand"
  }
  stock_movements {
    bigint id PK
    movement_type movement_type "purchase_in, sale_out, return_in, adjustment, expired, damaged…"
    int quantity
    varchar reference_type
    bigint reference_id
  }
  flash_sale_items {
    bigint id PK
    numeric sale_price
    int quantity_limit
    int sold_count "CHECK <= quantity_limit"
  }
```

## 3. Giỏ hàng, đơn hàng, thanh toán, vận chuyển

```mermaid
erDiagram
  users |o--o{ carts : "giỏ thành viên"
  carts ||--o{ cart_items : ""
  product_variants |o--o{ cart_items : ""
  bundles |o--o{ cart_items : ""
  users |o--o{ orders : "đặt (SET NULL)"
  addresses |o--o{ orders : ""
  shipping_methods |o--o{ orders : ""
  coupons |o--o{ orders : ""
  orders ||--o{ order_items : "CASCADE"
  product_variants |o--o{ order_items : ""
  order_items ||--o{ order_allocations : "lô được giữ (CASCADE)"
  inventory ||--o{ order_allocations : "NO ACTION"
  product_batches ||--o{ order_allocations : ""
  orders ||--o{ order_status_history : "CASCADE"
  orders ||--o{ payments : "CASCADE"
  payments ||--o{ payment_transactions : ""
  payments ||--o{ refunds : ""
  orders ||--o{ shipments : "CASCADE"
  shipments ||--o{ shipment_events : ""
  coupons ||--o{ coupon_usages : ""
  orders ||--o{ coupon_usages : "CASCADE"
  membership_tiers |o--o{ coupons : "hạng tối thiểu"

  carts {
    bigint id PK
    bigint user_id FK
    varchar session_token "khách vãng lai"
    bigint coupon_id FK
  }
  orders {
    bigint id PK
    varchar order_number UK "NTyyMMdd…"
    varchar idempotency_key UK
    order_status status
    payment_status payment_status
    payment_method payment_method
    numeric subtotal
    numeric discount_amount
    int points_used
    numeric points_discount
    numeric shipping_fee
    numeric total_amount "CHECK = subtotal - discount - points + ship + tax"
    int points_earned
    citext guest_email
    timestamptz placed_at
  }
  order_items {
    bigint id PK
    varchar product_name "chụp lại lúc đặt"
    varchar sku
    numeric unit_price
    int quantity "CHECK > 0"
    numeric line_total
  }
  order_allocations {
    bigint id PK
    int quantity
    varchar state "reserved, shipped, released, returned"
  }
  payments {
    bigint id PK
    payment_method method
    payment_status status
    numeric amount
    varchar provider_txn_id
    timestamptz paid_at
  }
  shipments {
    bigint id PK
    varchar tracking_number "NTR…"
    shipment_status status
    numeric cod_amount
  }
  coupons {
    bigint id PK
    citext code UK
    discount_type discount_type
    numeric discount_value
    numeric min_order_amount
    numeric max_discount_amount
    int usage_limit
    int usage_limit_per_user
    boolean first_order_only
    timestamptz ends_at
  }
```

## 4. Đánh giá, dinh dưỡng, nội dung

```mermaid
erDiagram
  products ||--o{ reviews : "CASCADE"
  users ||--o{ reviews : ""
  order_items |o--o{ reviews : "người đã mua (SET NULL)"
  reviews ||--o{ review_media : ""
  reviews ||--o{ review_votes : ""
  recipes ||--o{ recipe_ingredients : ""
  products |o--o{ recipe_ingredients : "nguyên liệu bán tại NUTRIO"
  users ||--o{ meal_plans : ""
  meal_plans ||--o{ meal_plan_items : ""
  recipes ||--o{ meal_plan_items : ""
  quiz_questions ||--o{ quiz_options : ""
  quiz_options ||--o{ quiz_option_effects : ""
  users |o--o{ subscriptions : ""
  subscription_plans ||--o{ subscriptions : ""
  subscriptions ||--o{ subscription_items : ""
  subscriptions |o--o{ orders : "sinh đơn định kỳ"

  reviews {
    bigint id PK
    smallint rating "CHECK 1..5"
    text content
    review_status status
    bigint order_item_id FK "UNIQUE(user_id, order_item_id)"
  }
  recipes {
    bigint id PK
    varchar slug UK
    meal_type meal_types
    numeric calories_per_serving
  }
  meal_plans {
    bigint id PK
    int target_calories
  }
  subscriptions {
    bigint id PK
    subscription_status status
    date next_delivery_date
  }
```
