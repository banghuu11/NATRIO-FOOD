-- =====================================================================
-- NUTRIO - E-COMMERCE THỰC PHẨM LÀNH MẠNH
-- PostgreSQL 14+ | Schema đầy đủ
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS, DOMAIN, ENUM, TIỆN ÍCH
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS citext;     -- email không phân biệt hoa thường
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- tìm kiếm gần đúng
CREATE EXTENSION IF NOT EXISTS unaccent;   -- tìm tiếng Việt không dấu

-- unaccent bản IMMUTABLE để dùng trong index
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent', $1) $$;

-- Tiền VND: số nguyên không âm
CREATE DOMAIN money_vnd AS numeric(14,0) CHECK (VALUE >= 0);

CREATE TYPE gender_type          AS ENUM ('male','female','other');
CREATE TYPE activity_level       AS ENUM ('sedentary','light','moderate','active','very_active');
CREATE TYPE goal_type            AS ENUM ('lose_weight','maintain','gain_muscle','eat_clean','control_blood_sugar');
CREATE TYPE product_status       AS ENUM ('draft','active','inactive','discontinued');
CREATE TYPE allergen_relation    AS ENUM ('contains','may_contain');
CREATE TYPE movement_type        AS ENUM ('purchase_in','sale_out','return_in','adjustment','expired','damaged','transfer_in','transfer_out');
CREATE TYPE discount_type        AS ENUM ('percent','fixed_amount','free_shipping');
CREATE TYPE subscription_status  AS ENUM ('active','paused','cancelled','expired');
CREATE TYPE subscription_freq    AS ENUM ('weekly','biweekly','monthly');
CREATE TYPE order_status         AS ENUM ('pending','confirmed','processing','shipping','delivered','completed','cancelled','returned');
CREATE TYPE payment_status       AS ENUM ('unpaid','pending','paid','failed','refunded','partially_refunded');
CREATE TYPE payment_method       AS ENUM ('cod','vnpay','momo','zalopay','bank_transfer','card');
CREATE TYPE shipment_status      AS ENUM ('pending','picked_up','in_transit','out_for_delivery','delivered','failed','returned');
CREATE TYPE return_status        AS ENUM ('requested','approved','rejected','received','refunded');
CREATE TYPE refund_status        AS ENUM ('pending','processed','failed');
CREATE TYPE loyalty_txn_type     AS ENUM ('earn','redeem','expire','adjust','refund');
CREATE TYPE review_status        AS ENUM ('pending','approved','rejected');
CREATE TYPE meal_type            AS ENUM ('breakfast','lunch','dinner','snack');
CREATE TYPE challenge_status     AS ENUM ('in_progress','completed','failed','abandoned');
CREATE TYPE notification_type    AS ENUM ('order','promotion','system','reminder','restock','price_drop','challenge');
CREATE TYPE chat_role            AS ENUM ('user','assistant','system');
CREATE TYPE alert_type           AS ENUM ('restock','price_drop');
CREATE TYPE token_purpose        AS ENUM ('verify_email','reset_password','verify_phone');
CREATE TYPE media_type           AS ENUM ('image','video');
CREATE TYPE difficulty_level     AS ENUM ('easy','medium','hard');

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Mã đơn: NT + yyMMdd + 6 số, ví dụ NT260115000042
CREATE OR REPLACE FUNCTION fn_generate_order_number() RETURNS text
LANGUAGE sql AS
$$ SELECT 'NT' || to_char(now(),'YYMMDD') || lpad(nextval('order_number_seq')::text, 6, '0') $$;

-- Tự cập nhật updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS
$$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- 1. NGƯỜI DÙNG, PHÂN QUYỀN, XÁC THỰC, ĐỊA CHỈ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        varchar(40)  NOT NULL UNIQUE,      -- customer, admin, staff_sales, staff_warehouse
    name        varchar(100) NOT NULL,
    description text
);

CREATE TABLE IF NOT EXISTS permissions (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        varchar(80) NOT NULL UNIQUE,       -- product.write, order.update ...
    description text
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       bigint NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id bigint NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email             citext       NOT NULL UNIQUE,
    phone             varchar(20)  UNIQUE,
    password_hash     text,                         -- NULL nếu chỉ đăng nhập OAuth
    full_name         varchar(150) NOT NULL,
    avatar_url        text,
    gender            gender_type,
    date_of_birth     date,
    is_active         boolean      NOT NULL DEFAULT true,
    email_verified_at timestamptz,
    phone_verified_at timestamptz,
    last_login_at     timestamptz,
    referral_code     varchar(12)  NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text),1,8)),
    referred_by       bigint REFERENCES users(id) ON DELETE SET NULL,
    created_at        timestamptz  NOT NULL DEFAULT now(),
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    CONSTRAINT chk_users_dob CHECK (date_of_birth IS NULL OR date_of_birth < current_date)
);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id bigint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          bigint      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         varchar(20) NOT NULL CHECK (provider IN ('google','facebook','zalo','apple')),
    provider_user_id varchar(191) NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);

CREATE TABLE IF NOT EXISTS user_sessions (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash text   NOT NULL UNIQUE,
    user_agent         text,
    ip_address         inet,
    expires_at         timestamptz NOT NULL,
    revoked_at         timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

CREATE TABLE IF NOT EXISTS verification_tokens (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text   NOT NULL UNIQUE,
    purpose    token_purpose NOT NULL,
    expires_at timestamptz   NOT NULL,
    used_at    timestamptz,
    created_at timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vtokens_user ON verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS addresses (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label          varchar(40),                    -- Nhà, Công ty
    recipient_name varchar(150) NOT NULL,
    phone          varchar(20)  NOT NULL,
    province       varchar(100) NOT NULL,
    district       varchar(100) NOT NULL,
    ward           varchar(100) NOT NULL,
    street         varchar(255) NOT NULL,
    note           text,
    latitude       numeric(9,6),
    longitude      numeric(9,6),
    is_default     boolean NOT NULL DEFAULT false,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_one_default ON addresses(user_id) WHERE is_default;

-- ---------------------------------------------------------------------
-- 2. SỨC KHỎE CÁ NHÂN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allergens (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        varchar(40)  NOT NULL UNIQUE,
    name_vi     varchar(100) NOT NULL,
    name_en     varchar(100),
    description text,
    icon_url    text
);

CREATE TABLE IF NOT EXISTS diets (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        varchar(40)  NOT NULL UNIQUE,      -- keto, vegan, eat_clean ...
    name_vi     varchar(100) NOT NULL,
    name_en     varchar(100),
    description text,
    icon_url    text
);

CREATE TABLE IF NOT EXISTS health_profiles (
    user_id               bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height_cm             numeric(5,1) NOT NULL CHECK (height_cm BETWEEN 50 AND 250),
    weight_kg             numeric(5,1) NOT NULL CHECK (weight_kg BETWEEN 10 AND 400),
    target_weight_kg      numeric(5,1) CHECK (target_weight_kg BETWEEN 10 AND 400),
    activity_level        activity_level NOT NULL DEFAULT 'light',
    goal                  goal_type      NOT NULL DEFAULT 'maintain',
    auto_calculate        boolean NOT NULL DEFAULT true,  -- true: trigger tự tính chỉ số
    bmi                   numeric(4,1),
    bmr                   numeric(7,0),
    tdee                  numeric(7,0),
    daily_calorie_target  numeric(7,0),
    daily_protein_g       numeric(6,1),
    daily_carb_g          numeric(6,1),
    daily_fat_g           numeric(6,1),
    daily_water_ml        integer NOT NULL DEFAULT 2000,
    medical_note          text,                            -- ví dụ: tiểu đường type 2
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_allergens (
    user_id     bigint NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    allergen_id bigint NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    severity    smallint NOT NULL DEFAULT 2 CHECK (severity BETWEEN 1 AND 3), -- 1 nhẹ, 3 nặng
    PRIMARY KEY (user_id, allergen_id)
);

CREATE TABLE IF NOT EXISTS user_diets (
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    diet_id bigint NOT NULL REFERENCES diets(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, diet_id)
);

CREATE TABLE IF NOT EXISTS weight_logs (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg    numeric(5,1) NOT NULL CHECK (weight_kg > 0),
    body_fat_pct numeric(4,1),
    logged_on    date NOT NULL DEFAULT current_date,
    UNIQUE (user_id, logged_on)
);

CREATE TABLE IF NOT EXISTS water_logs (
    id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id   bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_ml integer NOT NULL CHECK (amount_ml > 0),
    logged_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_logs(user_id, logged_at);

-- ---------------------------------------------------------------------
-- 3. DANH MỤC & SẢN PHẨM
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id   bigint REFERENCES categories(id) ON DELETE SET NULL,
    name        varchar(120) NOT NULL,
    slug        varchar(150) NOT NULL UNIQUE,
    description text,
    image_url   text,
    sort_order  integer NOT NULL DEFAULT 0,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

CREATE TABLE IF NOT EXISTS brands (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(120) NOT NULL,
    slug        varchar(150) NOT NULL UNIQUE,
    logo_url    text,
    country     varchar(80),
    description text,
    is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS suppliers (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         varchar(200) NOT NULL,
    contact_name varchar(150),
    phone        varchar(20),
    email        citext,
    address      text,
    tax_code     varchar(20),
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS farms (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(200) NOT NULL,
    owner_name  varchar(150),
    province    varchar(100),
    address     text,
    description text,
    image_url   text,
    latitude    numeric(9,6),
    longitude   numeric(9,6),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certifications (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        varchar(40)  NOT NULL UNIQUE,     -- organic, vietgap, haccp, non_gmo, vegan
    name        varchar(150) NOT NULL,
    issuer      varchar(150),
    description text,
    logo_url    text
);

CREATE TABLE IF NOT EXISTS tags (
    id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(80) NOT NULL,
    slug varchar(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ingredients (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(150) NOT NULL UNIQUE,
    name_en     varchar(150),
    is_additive boolean NOT NULL DEFAULT false,
    description text
);

CREATE TABLE IF NOT EXISTS products (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id        bigint NOT NULL REFERENCES categories(id),
    brand_id           bigint REFERENCES brands(id)    ON DELETE SET NULL,
    supplier_id        bigint REFERENCES suppliers(id) ON DELETE SET NULL,
    farm_id            bigint REFERENCES farms(id)     ON DELETE SET NULL,
    name               varchar(255) NOT NULL,
    slug               varchar(280) NOT NULL UNIQUE,
    short_description  varchar(500),
    description        text,
    origin_country     varchar(80) DEFAULT 'Việt Nam',
    storage_instruction text,
    usage_instruction  text,
    shelf_life_days    integer CHECK (shelf_life_days > 0),
    status             product_status NOT NULL DEFAULT 'draft',
    is_featured        boolean NOT NULL DEFAULT false,
    nutri_score_points integer,                  -- tự tính bởi trigger
    nutri_score_grade  char(1) CHECK (nutri_score_grade IN ('A','B','C','D','E')),
    avg_rating         numeric(3,2) NOT NULL DEFAULT 0,
    review_count       integer NOT NULL DEFAULT 0,
    sold_count         integer NOT NULL DEFAULT 0,   -- job định kỳ cập nhật
    view_count         integer NOT NULL DEFAULT 0,
    meta_title         varchar(200),
    meta_description   varchar(320),
    search_vector      tsvector,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand    ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured;
CREATE INDEX IF NOT EXISTS idx_products_search   ON products USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (f_unaccent(lower(name)) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS product_variants (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id       bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku              varchar(60) NOT NULL UNIQUE,
    barcode          varchar(32) UNIQUE,
    name             varchar(150) NOT NULL,          -- ví dụ: Túi 500g
    net_weight_g     numeric(8,1) NOT NULL CHECK (net_weight_g > 0),
    unit_label       varchar(30) DEFAULT 'gói',
    price            money_vnd NOT NULL,
    compare_at_price money_vnd,                      -- giá gạch ngang
    cost_price       money_vnd,
    reorder_level    integer NOT NULL DEFAULT 10,    -- ngưỡng cảnh báo tồn thấp
    is_default       boolean NOT NULL DEFAULT false,
    is_active        boolean NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_compare_price CHECK (compare_at_price IS NULL OR compare_at_price >= price)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_variant_one_default ON product_variants(product_id) WHERE is_default;

CREATE TABLE IF NOT EXISTS variant_price_history (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    old_price  money_vnd NOT NULL,
    new_price  money_vnd NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_price_hist_variant ON variant_price_history(variant_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS product_images (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id bigint REFERENCES product_variants(id) ON DELETE SET NULL,
    url        text NOT NULL,
    alt_text   varchar(255),
    sort_order integer NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_image_one_primary ON product_images(product_id) WHERE is_primary;

-- Giá trị dinh dưỡng trên 100g (hoặc 100ml)
CREATE TABLE IF NOT EXISTS nutrition_facts (
    product_id         bigint PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    serving_size_g     numeric(7,1),
    servings_per_pack  numeric(5,1),
    calories_kcal      numeric(7,1) NOT NULL CHECK (calories_kcal >= 0),
    protein_g          numeric(6,2) NOT NULL DEFAULT 0,
    carbohydrate_g     numeric(6,2) NOT NULL DEFAULT 0,
    sugar_g            numeric(6,2) NOT NULL DEFAULT 0,
    added_sugar_g      numeric(6,2) NOT NULL DEFAULT 0,
    fiber_g            numeric(6,2) NOT NULL DEFAULT 0,
    fat_g              numeric(6,2) NOT NULL DEFAULT 0,
    saturated_fat_g    numeric(6,2) NOT NULL DEFAULT 0,
    trans_fat_g        numeric(6,2) NOT NULL DEFAULT 0,
    cholesterol_mg     numeric(7,1) NOT NULL DEFAULT 0,
    sodium_mg          numeric(8,1) NOT NULL DEFAULT 0,
    potassium_mg       numeric(8,1),
    calcium_mg         numeric(8,1),
    iron_mg            numeric(6,2),
    vitamin_a_mcg      numeric(8,1),
    vitamin_c_mg       numeric(7,1),
    fruit_veg_percent  numeric(5,1) NOT NULL DEFAULT 0 CHECK (fruit_veg_percent BETWEEN 0 AND 100),
    glycemic_index     smallint CHECK (glycemic_index BETWEEN 0 AND 120),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id    bigint NOT NULL REFERENCES products(id)    ON DELETE CASCADE,
    ingredient_id bigint NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    percentage    numeric(5,2) CHECK (percentage BETWEEN 0 AND 100),
    sort_order    integer NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS product_allergens (
    product_id  bigint NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    allergen_id bigint NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    relation    allergen_relation NOT NULL DEFAULT 'contains',
    PRIMARY KEY (product_id, allergen_id)
);
CREATE INDEX IF NOT EXISTS idx_prod_allergen_allergen ON product_allergens(allergen_id);

CREATE TABLE IF NOT EXISTS product_diets (
    product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    diet_id    bigint NOT NULL REFERENCES diets(id)    ON DELETE CASCADE,
    PRIMARY KEY (product_id, diet_id)
);
CREATE INDEX IF NOT EXISTS idx_prod_diet_diet ON product_diets(diet_id);

CREATE TABLE IF NOT EXISTS product_certifications (
    product_id         bigint NOT NULL REFERENCES products(id)       ON DELETE CASCADE,
    certification_id   bigint NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    certificate_number varchar(80),
    issued_on          date,
    expires_on         date,
    document_url       text,
    PRIMARY KEY (product_id, certification_id)
);

CREATE TABLE IF NOT EXISTS product_tags (
    product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id     bigint NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_prod_tag_tag ON product_tags(tag_id);

-- Sản phẩm thay thế lành mạnh hơn / khi hết hàng / dị ứng
CREATE TABLE IF NOT EXISTS product_substitutes (
    product_id    bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    substitute_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reason        varchar(200),
    priority      smallint NOT NULL DEFAULT 1,
    PRIMARY KEY (product_id, substitute_id),
    CHECK (product_id <> substitute_id)
);

-- Combo / bundle
CREATE TABLE IF NOT EXISTS bundles (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(200) NOT NULL,
    slug        varchar(240) NOT NULL UNIQUE,
    description text,
    image_url   text,
    price       money_vnd NOT NULL,
    starts_at   timestamptz,
    ends_at     timestamptz,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS bundle_items (
    bundle_id  bigint NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (bundle_id, variant_id)
);

-- ---------------------------------------------------------------------
-- 4. KHO, LÔ HÀNG, TRUY XUẤT NGUỒN GỐC (FEFO)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
    id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code      varchar(20)  NOT NULL UNIQUE,
    name      varchar(150) NOT NULL,
    province  varchar(100),
    address   text,
    is_cold_storage boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS product_batches (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    variant_id        bigint NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    farm_id           bigint REFERENCES farms(id)     ON DELETE SET NULL,
    supplier_id       bigint REFERENCES suppliers(id) ON DELETE SET NULL,
    batch_code        varchar(60) NOT NULL UNIQUE,
    qr_code           varchar(80) NOT NULL UNIQUE,   -- nội dung mã QR truy xuất
    harvested_on      date,
    manufactured_on   date,
    expires_on        date,
    received_on       date NOT NULL DEFAULT current_date,
    quantity_received integer NOT NULL CHECK (quantity_received > 0),
    unit_cost         money_vnd,
    lab_test_url      text,
    lab_result_note   text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CHECK (expires_on IS NULL OR manufactured_on IS NULL OR expires_on > manufactured_on)
);
CREATE INDEX IF NOT EXISTS idx_batches_variant ON product_batches(variant_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry  ON product_batches(expires_on);

CREATE TABLE IF NOT EXISTS inventory (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    warehouse_id      bigint NOT NULL REFERENCES warehouses(id)      ON DELETE RESTRICT,
    batch_id          bigint NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
    quantity_on_hand  integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (warehouse_id, batch_id),
    CHECK (quantity_reserved <= quantity_on_hand)
);
CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory(batch_id);

CREATE TABLE IF NOT EXISTS stock_movements (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    batch_id       bigint NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
    warehouse_id   bigint NOT NULL REFERENCES warehouses(id)      ON DELETE RESTRICT,
    movement_type  movement_type NOT NULL,
    quantity       integer NOT NULL CHECK (quantity <> 0),   -- dương: nhập, âm: xuất
    reference_type varchar(30),                              -- order, return, purchase ...
    reference_id   bigint,
    note           text,
    created_by     bigint REFERENCES users(id) ON DELETE SET NULL,
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_movements_batch ON stock_movements(batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_ref   ON stock_movements(reference_type, reference_id);

-- ---------------------------------------------------------------------
-- 5. KHUYẾN MÃI
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membership_tiers (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code              varchar(20) NOT NULL UNIQUE,   -- member, silver, gold
    name              varchar(60) NOT NULL,
    min_points        integer NOT NULL UNIQUE CHECK (min_points >= 0),
    discount_percent  numeric(4,1) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    points_multiplier numeric(3,1) NOT NULL DEFAULT 1,
    benefits          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS coupons (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code                citext NOT NULL UNIQUE,
    description         text,
    discount_type       discount_type NOT NULL,
    discount_value      numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
    max_discount_amount money_vnd,
    min_order_amount    money_vnd NOT NULL DEFAULT 0,
    usage_limit         integer CHECK (usage_limit > 0),
    usage_limit_per_user integer NOT NULL DEFAULT 1 CHECK (usage_limit_per_user > 0),
    used_count          integer NOT NULL DEFAULT 0,
    first_order_only    boolean NOT NULL DEFAULT false,
    min_tier_id         bigint REFERENCES membership_tiers(id) ON DELETE SET NULL,
    starts_at           timestamptz NOT NULL DEFAULT now(),
    ends_at             timestamptz,
    is_active           boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR ends_at > starts_at),
    CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

CREATE TABLE IF NOT EXISTS flash_sales (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       varchar(200) NOT NULL,
    starts_at  timestamptz  NOT NULL,
    ends_at    timestamptz  NOT NULL,
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS flash_sale_items (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    flash_sale_id  bigint NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
    variant_id     bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    sale_price     money_vnd NOT NULL,
    quantity_limit integer NOT NULL CHECK (quantity_limit > 0),
    sold_count     integer NOT NULL DEFAULT 0,
    UNIQUE (flash_sale_id, variant_id),
    CHECK (sold_count <= quantity_limit)
);

-- ---------------------------------------------------------------------
-- 6. ĐĂNG KÝ ĐỊNH KỲ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name             varchar(120) NOT NULL,
    frequency        subscription_freq NOT NULL,
    discount_percent numeric(4,1) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    description      text,
    is_active        boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id            bigint NOT NULL REFERENCES subscription_plans(id),
    address_id         bigint REFERENCES addresses(id) ON DELETE SET NULL,
    payment_method     payment_method NOT NULL DEFAULT 'cod',
    status             subscription_status NOT NULL DEFAULT 'active',
    next_delivery_date date NOT NULL,
    last_delivery_date date,
    paused_until       date,
    cancelled_at       timestamptz,
    cancel_reason      text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_next ON subscriptions(next_delivery_date) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS subscription_items (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subscription_id bigint NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    variant_id      bigint NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity        integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (subscription_id, variant_id)
);

CREATE TABLE IF NOT EXISTS subscription_skips (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subscription_id bigint NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    skip_date       date NOT NULL,
    reason          text,
    UNIQUE (subscription_id, skip_date)
);

-- ---------------------------------------------------------------------
-- 7. GIỎ HÀNG, WISHLIST, CẢNH BÁO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       bigint REFERENCES users(id) ON DELETE CASCADE,
    session_token varchar(80),                       -- giỏ của khách vãng lai
    coupon_id     bigint REFERENCES coupons(id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    expires_at    timestamptz,
    CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_user    ON carts(user_id)       WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_session ON carts(session_token) WHERE session_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS cart_items (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id    bigint NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id bigint REFERENCES product_variants(id) ON DELETE CASCADE,
    bundle_id  bigint REFERENCES bundles(id)          ON DELETE CASCADE,
    quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at   timestamptz NOT NULL DEFAULT now(),
    CHECK ((variant_id IS NOT NULL)::int + (bundle_id IS NOT NULL)::int = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_item_variant ON cart_items(cart_id, variant_id) WHERE variant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_item_bundle  ON cart_items(cart_id, bundle_id)  WHERE bundle_id  IS NOT NULL;

CREATE TABLE IF NOT EXISTS wishlists (
    user_id    bigint NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_alerts (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      bigint NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id   bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alert_type   alert_type NOT NULL,
    target_price money_vnd,
    is_active    boolean NOT NULL DEFAULT true,
    notified_at  timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id, alert_type)
);

-- ---------------------------------------------------------------------
-- 8. ĐƠN HÀNG, THANH TOÁN, VẬN CHUYỂN, ĐỔI TRẢ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_methods (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code          varchar(30)  NOT NULL UNIQUE,
    name          varchar(120) NOT NULL,
    carrier       varchar(60),                      -- GHN, GHTK, Ahamove
    base_fee      money_vnd NOT NULL DEFAULT 0,
    free_ship_threshold money_vnd,
    est_hours_min integer,
    est_hours_max integer,
    is_cold_chain boolean NOT NULL DEFAULT false,
    is_active     boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number        varchar(20) NOT NULL UNIQUE DEFAULT fn_generate_order_number(),
    user_id             bigint REFERENCES users(id) ON DELETE SET NULL,
    guest_email         citext,
    guest_phone         varchar(20),
    subscription_id     bigint REFERENCES subscriptions(id) ON DELETE SET NULL,
    status              order_status   NOT NULL DEFAULT 'pending',
    payment_status      payment_status NOT NULL DEFAULT 'unpaid',
    payment_method      payment_method NOT NULL DEFAULT 'cod',
    shipping_method_id  bigint REFERENCES shipping_methods(id) ON DELETE SET NULL,
    address_id          bigint REFERENCES addresses(id) ON DELETE SET NULL,
    -- snapshot địa chỉ giao hàng tại thời điểm đặt
    ship_recipient_name varchar(150) NOT NULL,
    ship_phone          varchar(20)  NOT NULL,
    ship_province       varchar(100) NOT NULL,
    ship_district       varchar(100) NOT NULL,
    ship_ward           varchar(100) NOT NULL,
    ship_street         varchar(255) NOT NULL,
    ship_note           text,
    delivery_slot_from  timestamptz,
    delivery_slot_to    timestamptz,
    subtotal            money_vnd NOT NULL,
    coupon_id           bigint REFERENCES coupons(id) ON DELETE SET NULL,
    coupon_code         varchar(40),
    discount_amount     money_vnd NOT NULL DEFAULT 0,
    points_used         integer   NOT NULL DEFAULT 0 CHECK (points_used >= 0),
    points_discount     money_vnd NOT NULL DEFAULT 0,
    shipping_fee        money_vnd NOT NULL DEFAULT 0,
    tax_amount          money_vnd NOT NULL DEFAULT 0,
    total_amount        money_vnd NOT NULL,
    points_earned       integer   NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    note                text,
    cancel_reason       text,
    placed_at           timestamptz NOT NULL DEFAULT now(),
    confirmed_at        timestamptz,
    shipped_at          timestamptz,
    delivered_at        timestamptz,
    completed_at        timestamptz,
    cancelled_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_order_identity CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL OR guest_phone IS NOT NULL),
    CONSTRAINT chk_order_total CHECK (total_amount = subtotal - discount_amount - points_discount + shipping_fee + tax_amount)
);
CREATE INDEX IF NOT EXISTS idx_orders_user    ON orders(user_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_placed  ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_subs    ON orders(subscription_id);

CREATE TABLE IF NOT EXISTS order_items (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      bigint REFERENCES products(id)         ON DELETE SET NULL,
    variant_id      bigint REFERENCES product_variants(id) ON DELETE SET NULL,
    bundle_id       bigint REFERENCES bundles(id)          ON DELETE SET NULL,
    batch_id        bigint REFERENCES product_batches(id)  ON DELETE SET NULL,
    -- snapshot
    product_name    varchar(255) NOT NULL,
    variant_name    varchar(150),
    sku             varchar(60),
    unit_price      money_vnd NOT NULL,
    quantity        integer   NOT NULL CHECK (quantity > 0),
    discount_amount money_vnd NOT NULL DEFAULT 0,
    line_total      money_vnd NOT NULL,
    calories_kcal   numeric(8,1),                     -- snapshot calo trên mỗi đơn vị
    CONSTRAINT chk_line_total CHECK (line_total = unit_price * quantity - discount_amount)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status   order_status NOT NULL,
    changed_by  bigint REFERENCES users(id) ON DELETE SET NULL,
    note        text,
    changed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_hist_order ON order_status_history(order_id, changed_at);

CREATE TABLE IF NOT EXISTS payments (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method          payment_method NOT NULL,
    status          payment_status NOT NULL DEFAULT 'pending',
    amount          money_vnd NOT NULL,
    currency        char(3) NOT NULL DEFAULT 'VND',
    provider_txn_id varchar(100),
    paid_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider ON payments(method, provider_txn_id) WHERE provider_txn_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_transactions (       -- log gọi cổng thanh toán (VNPay/MoMo sandbox)
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id       bigint NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    gateway          varchar(30) NOT NULL,
    txn_ref          varchar(100),
    status           varchar(30),
    request_payload  jsonb,
    response_payload jsonb,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pay_txn_payment ON payment_transactions(payment_id);

CREATE TABLE IF NOT EXISTS shipments (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id              bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier               varchar(60),
    tracking_number       varchar(80),
    status                shipment_status NOT NULL DEFAULT 'pending',
    shipping_fee          money_vnd NOT NULL DEFAULT 0,
    cod_amount            money_vnd NOT NULL DEFAULT 0,
    picked_up_at          timestamptz,
    estimated_delivery_at timestamptz,
    delivered_at          timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

CREATE TABLE IF NOT EXISTS shipment_events (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shipment_id bigint NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status      shipment_status NOT NULL,
    location    varchar(200),
    description text,
    occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ship_events ON shipment_events(shipment_id, occurred_at);

CREATE TABLE IF NOT EXISTS returns (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id      bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id       bigint REFERENCES users(id) ON DELETE SET NULL,
    status        return_status NOT NULL DEFAULT 'requested',
    reason        varchar(200) NOT NULL,
    description   text,
    refund_amount money_vnd NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    resolved_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);

CREATE TABLE IF NOT EXISTS return_items (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    return_id     bigint NOT NULL REFERENCES returns(id)     ON DELETE CASCADE,
    order_item_id bigint NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    quantity      integer NOT NULL CHECK (quantity > 0),
    reason        varchar(200)
);

CREATE TABLE IF NOT EXISTS refunds (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id   bigint NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    return_id    bigint REFERENCES returns(id) ON DELETE SET NULL,
    amount       money_vnd NOT NULL,
    status       refund_status NOT NULL DEFAULT 'pending',
    note         text,
    processed_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_usages (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    coupon_id       bigint NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id         bigint REFERENCES users(id) ON DELETE SET NULL,
    order_id        bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount money_vnd NOT NULL,
    used_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (coupon_id, order_id)
);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usages(coupon_id, user_id);

-- ---------------------------------------------------------------------
-- 9. TÍCH ĐIỂM, HẠNG THÀNH VIÊN, GIỚI THIỆU
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    user_id         bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points_balance  integer NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    lifetime_points integer NOT NULL DEFAULT 0 CHECK (lifetime_points >= 0),
    tier_id         bigint REFERENCES membership_tiers(id) ON DELETE SET NULL,
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (       -- points: dương = cộng, âm = trừ
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    txn_type    loyalty_txn_type NOT NULL,
    points      integer NOT NULL CHECK (points <> 0),
    order_id    bigint REFERENCES orders(id) ON DELETE SET NULL,
    description varchar(255),
    expires_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_txn_user ON loyalty_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS referrals (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    referrer_id      bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id       bigint NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    reward_coupon_id bigint REFERENCES coupons(id) ON DELETE SET NULL,
    is_rewarded      boolean NOT NULL DEFAULT false,   -- thưởng khi referee đặt đơn đầu
    rewarded_at      timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CHECK (referrer_id <> referee_id)
);

-- ---------------------------------------------------------------------
-- 10. ĐÁNH GIÁ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id           bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id              bigint NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    order_item_id        bigint REFERENCES order_items(id) ON DELETE SET NULL,
    rating               smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title                varchar(200),
    content              text,
    is_verified_purchase boolean NOT NULL DEFAULT false,
    status               review_status NOT NULL DEFAULT 'pending',
    helpful_count        integer NOT NULL DEFAULT 0,
    admin_reply          text,
    replied_at           timestamptz,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS review_media (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    review_id  bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    media_type media_type NOT NULL DEFAULT 'image',
    url        text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_review_media ON review_media(review_id);

CREATE TABLE IF NOT EXISTS review_votes (
    review_id  bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id    bigint NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (review_id, user_id)
);

-- ---------------------------------------------------------------------
-- 11. CÔNG THỨC NẤU ĂN, THỰC ĐƠN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id            bigint REFERENCES users(id) ON DELETE SET NULL,
    title                varchar(255) NOT NULL,
    slug                 varchar(280) NOT NULL UNIQUE,
    description          text,
    image_url            text,
    video_url            text,
    prep_minutes         integer CHECK (prep_minutes >= 0),
    cook_minutes         integer CHECK (cook_minutes >= 0),
    servings             integer NOT NULL DEFAULT 1 CHECK (servings > 0),
    difficulty           difficulty_level NOT NULL DEFAULT 'easy',
    calories_per_serving numeric(7,1),
    protein_g            numeric(6,1),
    carbohydrate_g       numeric(6,1),
    fat_g                numeric(6,1),
    is_published         boolean NOT NULL DEFAULT false,
    view_count           integer NOT NULL DEFAULT 0,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipe_id       bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    product_id      bigint REFERENCES products(id) ON DELETE SET NULL,  -- có thể mua ngay
    variant_id      bigint REFERENCES product_variants(id) ON DELETE SET NULL,
    ingredient_name varchar(150) NOT NULL,
    quantity        numeric(8,2),
    unit            varchar(30),
    note            varchar(200),
    sort_order      integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recipe_ing_recipe  ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ing_product ON recipe_ingredients(product_id);

CREATE TABLE IF NOT EXISTS recipe_steps (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipe_id   bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number integer NOT NULL CHECK (step_number > 0),
    instruction text NOT NULL,
    image_url   text,
    UNIQUE (recipe_id, step_number)
);

CREATE TABLE IF NOT EXISTS recipe_diets (
    recipe_id bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    diet_id   bigint NOT NULL REFERENCES diets(id)   ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, diet_id)
);

CREATE TABLE IF NOT EXISTS recipe_favorites (
    user_id    bigint NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    recipe_id  bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS meal_plans (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_user_id    bigint REFERENCES users(id) ON DELETE CASCADE,  -- NULL = mẫu của cửa hàng
    name             varchar(200) NOT NULL,
    slug             varchar(240) UNIQUE,
    description      text,
    goal             goal_type,
    duration_days    integer NOT NULL CHECK (duration_days BETWEEN 1 AND 90),
    target_calories  numeric(7,0),
    image_url        text,
    is_template      boolean NOT NULL DEFAULT true,
    is_published     boolean NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_plan_items (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meal_plan_id bigint NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    day_number   integer   NOT NULL CHECK (day_number > 0),
    meal_type    meal_type NOT NULL,
    product_id   bigint REFERENCES products(id) ON DELETE CASCADE,
    recipe_id    bigint REFERENCES recipes(id)  ON DELETE CASCADE,
    quantity     numeric(6,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    note         varchar(255),
    CHECK ((product_id IS NOT NULL)::int + (recipe_id IS NOT NULL)::int = 1)
);
CREATE INDEX IF NOT EXISTS idx_meal_items_plan ON meal_plan_items(meal_plan_id, day_number);

CREATE TABLE IF NOT EXISTS user_meal_plans (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      bigint NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    meal_plan_id bigint NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    start_date   date NOT NULL DEFAULT current_date,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_meal_plans_user ON user_meal_plans(user_id);

-- Nhật ký ăn uống (đặt sau recipes/products để tham chiếu được)
CREATE TABLE IF NOT EXISTS food_diary (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_on        date NOT NULL DEFAULT current_date,
    meal_type        meal_type NOT NULL,
    product_id       bigint REFERENCES products(id) ON DELETE SET NULL,
    recipe_id        bigint REFERENCES recipes(id)  ON DELETE SET NULL,
    custom_food_name varchar(200),
    quantity_g       numeric(8,1) NOT NULL DEFAULT 100 CHECK (quantity_g > 0),
    calories_kcal    numeric(7,1) NOT NULL DEFAULT 0,
    protein_g        numeric(6,1) NOT NULL DEFAULT 0,
    carbohydrate_g   numeric(6,1) NOT NULL DEFAULT 0,
    fat_g            numeric(6,1) NOT NULL DEFAULT 0,
    note             text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CHECK (product_id IS NOT NULL OR recipe_id IS NOT NULL OR custom_food_name IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_food_diary_user_date ON food_diary(user_id, logged_on);

-- ---------------------------------------------------------------------
-- 12. QUIZ GỢI Ý SẢN PHẨM
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_text varchar(300) NOT NULL,
    is_multiple   boolean NOT NULL DEFAULT false,
    sort_order    integer NOT NULL DEFAULT 0,
    is_active     boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS quiz_options (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id bigint NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text varchar(200) NOT NULL,
    icon        varchar(60),
    sort_order  integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quiz_options_q ON quiz_options(question_id);

-- Mỗi lựa chọn "đẩy điểm" cho diet/tag/category hoặc loại trừ allergen
CREATE TABLE IF NOT EXISTS quiz_option_effects (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    option_id   bigint NOT NULL REFERENCES quiz_options(id) ON DELETE CASCADE,
    effect_type varchar(20) NOT NULL CHECK (effect_type IN ('boost_diet','boost_tag','boost_category','exclude_allergen')),
    diet_id     bigint REFERENCES diets(id)      ON DELETE CASCADE,
    tag_id      bigint REFERENCES tags(id)       ON DELETE CASCADE,
    category_id bigint REFERENCES categories(id) ON DELETE CASCADE,
    allergen_id bigint REFERENCES allergens(id)  ON DELETE CASCADE,
    weight      integer NOT NULL DEFAULT 1,
    CHECK (num_nonnulls(diet_id, tag_id, category_id, allergen_id) = 1)
);
CREATE INDEX IF NOT EXISTS idx_quiz_effects_option ON quiz_option_effects(option_id);

CREATE TABLE IF NOT EXISTS quiz_sessions (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       bigint REFERENCES users(id) ON DELETE SET NULL,
    session_token varchar(80),
    started_at    timestamptz NOT NULL DEFAULT now(),
    completed_at  timestamptz
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id  bigint NOT NULL REFERENCES quiz_sessions(id)  ON DELETE CASCADE,
    question_id bigint NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_id   bigint NOT NULL REFERENCES quiz_options(id)   ON DELETE CASCADE,
    UNIQUE (session_id, option_id)
);

CREATE TABLE IF NOT EXISTS quiz_recommendations (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id bigint NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES products(id)      ON DELETE CASCADE,
    score      integer NOT NULL,
    rank       integer NOT NULL,
    UNIQUE (session_id, product_id)
);

-- ---------------------------------------------------------------------
-- 13. THỬ THÁCH, HUY HIỆU
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code          varchar(40)  NOT NULL UNIQUE,
    name          varchar(120) NOT NULL,
    description   text,
    icon_url      text,
    points_reward integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_id   bigint NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    badge_id  bigint NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS challenges (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          varchar(150) NOT NULL,
    description   text,
    duration_days integer NOT NULL CHECK (duration_days > 0),
    points_reward integer NOT NULL DEFAULT 0,
    badge_id      bigint REFERENCES badges(id) ON DELETE SET NULL,
    is_active     boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_challenges (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      bigint NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    challenge_id bigint NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    status       challenge_status NOT NULL DEFAULT 'in_progress',
    started_on   date NOT NULL DEFAULT current_date,
    completed_on date,
    progress_days integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);

CREATE TABLE IF NOT EXISTS challenge_checkins (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_challenge_id bigint NOT NULL REFERENCES user_challenges(id) ON DELETE CASCADE,
    checkin_date      date NOT NULL DEFAULT current_date,
    note              text,
    UNIQUE (user_challenge_id, checkin_date)
);

-- ---------------------------------------------------------------------
-- 14. BLOG, BANNER, LIÊN HỆ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_categories (
    id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(120) NOT NULL,
    slug varchar(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id      bigint REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id        bigint REFERENCES users(id) ON DELETE SET NULL,
    title            varchar(300) NOT NULL,
    slug             varchar(330) NOT NULL UNIQUE,
    summary          text,
    content          text NOT NULL,
    cover_image_url  text,
    expert_reviewer  varchar(150),                -- chuyên gia dinh dưỡng ký tên
    is_published     boolean NOT NULL DEFAULT false,
    published_at     timestamptz,
    view_count       integer NOT NULL DEFAULT 0,
    meta_title       varchar(200),
    meta_description   varchar(320),
    search_vector    tsvector,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_search    ON blog_posts USING gin(search_vector);

CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id bigint NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id  bigint NOT NULL REFERENCES tags(id)       ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_comments (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id    bigint NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id    bigint NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    parent_id  bigint REFERENCES blog_comments(id)       ON DELETE CASCADE,
    content    text NOT NULL,
    status     review_status NOT NULL DEFAULT 'approved',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);

CREATE TABLE IF NOT EXISTS banners (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title      varchar(200),
    image_url  text NOT NULL,
    link_url   text,
    position   varchar(40) NOT NULL DEFAULT 'home_hero',
    sort_order integer NOT NULL DEFAULT 0,
    starts_at  timestamptz,
    ends_at    timestamptz,
    is_active  boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint REFERENCES users(id) ON DELETE SET NULL,
    name       varchar(150) NOT NULL,
    email      citext NOT NULL,
    subject    varchar(200),
    message    text NOT NULL,
    is_resolved boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 15. CHATBOT AI, THÔNG BÁO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       bigint REFERENCES users(id) ON DELETE CASCADE,
    session_token varchar(80),
    title         varchar(200),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id          bigint NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role                chat_role NOT NULL,
    content             text NOT NULL,
    recommended_product_ids bigint[],
    tokens_used         integer,
    created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       notification_type NOT NULL,
    title      varchar(200) NOT NULL,
    body       text,
    data       jsonb NOT NULL DEFAULT '{}'::jsonb,   -- ví dụ {"order_id": 12}
    is_read    boolean NOT NULL DEFAULT false,
    read_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id         bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_order     boolean NOT NULL DEFAULT true,
    email_promo     boolean NOT NULL DEFAULT true,
    push_enabled    boolean NOT NULL DEFAULT true,
    zalo_enabled    boolean NOT NULL DEFAULT false,
    reorder_reminder boolean NOT NULL DEFAULT true,
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 16. HỆ THỐNG
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     bigint,                                -- không FK để giữ log khi xóa user
    action      varchar(10) NOT NULL,                  -- INSERT / UPDATE / DELETE
    entity_type varchar(60) NOT NULL,
    entity_id   bigint,
    old_data    jsonb,
    new_data    jsonb,
    ip_address  inet,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    key         varchar(80) PRIMARY KEY,
    value       jsonb NOT NULL,
    description text,
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_logs (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      bigint REFERENCES users(id) ON DELETE SET NULL,
    query        varchar(300) NOT NULL,
    result_count integer,
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_logs_q ON search_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS product_views (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id    bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id       bigint REFERENCES users(id) ON DELETE SET NULL,
    session_token varchar(80),
    viewed_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_views_p ON product_views(product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_u ON product_views(user_id, viewed_at DESC);

-- =====================================================================
-- 17. HÀM & TRIGGER
-- =====================================================================

-- ---- 17.1 Công thức sức khỏe ----------------------------------------
CREATE OR REPLACE FUNCTION fn_calc_bmi(p_weight_kg numeric, p_height_cm numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS
$$ SELECT round(p_weight_kg / ((p_height_cm / 100.0) ^ 2), 1) $$;

-- Mifflin-St Jeor
CREATE OR REPLACE FUNCTION fn_calc_bmr(p_gender gender_type, p_weight_kg numeric, p_height_cm numeric, p_age int)
RETURNS numeric LANGUAGE sql IMMUTABLE AS
$$ SELECT round(10 * p_weight_kg + 6.25 * p_height_cm - 5 * p_age
       + CASE p_gender WHEN 'male' THEN 5 WHEN 'female' THEN -161 ELSE -78 END) $$;

CREATE OR REPLACE FUNCTION fn_activity_factor(p_level activity_level)
RETURNS numeric LANGUAGE sql IMMUTABLE AS
$$ SELECT CASE p_level
        WHEN 'sedentary'   THEN 1.2
        WHEN 'light'       THEN 1.375
        WHEN 'moderate'    THEN 1.55
        WHEN 'active'      THEN 1.725
        ELSE 1.9 END $$;

CREATE OR REPLACE FUNCTION fn_calc_target_calories(p_tdee numeric, p_goal goal_type)
RETURNS numeric LANGUAGE sql IMMUTABLE AS
$$ SELECT CASE p_goal
        WHEN 'lose_weight' THEN greatest(p_tdee - 500, 1200)
        WHEN 'gain_muscle' THEN p_tdee + 300
        ELSE p_tdee END $$;

CREATE OR REPLACE FUNCTION trg_health_profile_calc() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE
    v_gender gender_type;
    v_dob    date;
    v_age    int;
    v_protein_factor numeric;
BEGIN
    IF NOT NEW.auto_calculate THEN
        NEW.bmi := fn_calc_bmi(NEW.weight_kg, NEW.height_cm);
        RETURN NEW;
    END IF;

    SELECT gender, date_of_birth INTO v_gender, v_dob FROM users WHERE id = NEW.user_id;
    v_age := COALESCE(extract(year FROM age(v_dob))::int, 25);

    NEW.bmi  := fn_calc_bmi(NEW.weight_kg, NEW.height_cm);
    NEW.bmr  := fn_calc_bmr(COALESCE(v_gender,'other'), NEW.weight_kg, NEW.height_cm, v_age);
    NEW.tdee := round(NEW.bmr * fn_activity_factor(NEW.activity_level));
    NEW.daily_calorie_target := fn_calc_target_calories(NEW.tdee, NEW.goal);

    v_protein_factor := CASE WHEN NEW.goal IN ('lose_weight','gain_muscle') THEN 2.0 ELSE 1.6 END;
    NEW.daily_protein_g := round(NEW.weight_kg * v_protein_factor, 1);
    NEW.daily_fat_g     := round(NEW.daily_calorie_target * 0.25 / 9, 1);
    NEW.daily_carb_g    := round(greatest(NEW.daily_calorie_target - NEW.daily_protein_g * 4 - NEW.daily_fat_g * 9, 0) / 4, 1);
    NEW.daily_water_ml  := round(NEW.weight_kg * 35);
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_health_profile_calc ON health_profiles;
CREATE TRIGGER trg_health_profile_calc
BEFORE INSERT OR UPDATE ON health_profiles
FOR EACH ROW EXECUTE FUNCTION trg_health_profile_calc();

-- ---- 17.2 Nutri-Score (phiên bản 2017 cho thực phẩm, rút gọn) -------
CREATE OR REPLACE FUNCTION fn_threshold_points(p_value numeric, p_thresholds numeric[])
RETURNS int LANGUAGE sql IMMUTABLE AS
$$ SELECT count(*)::int FROM unnest(p_thresholds) t WHERE COALESCE(p_value, 0) > t $$;

CREATE OR REPLACE FUNCTION fn_nutri_score_points(
    p_kcal numeric, p_sugar numeric, p_sat_fat numeric, p_sodium_mg numeric,
    p_fiber numeric, p_protein numeric, p_fruit_veg_pct numeric DEFAULT 0)
RETURNS int LANGUAGE plpgsql IMMUTABLE AS
$$
DECLARE
    n int; fib int; prot int; fv int;
BEGIN
    n := fn_threshold_points(COALESCE(p_kcal,0) * 4.184, ARRAY[335,670,1005,1340,1675,2010,2345,2680,3015,3350]::numeric[])
       + fn_threshold_points(p_sugar,     ARRAY[4.5,9,13.5,18,22.5,27,31,36,40,45]::numeric[])
       + fn_threshold_points(p_sat_fat,   ARRAY[1,2,3,4,5,6,7,8,9,10]::numeric[])
       + fn_threshold_points(p_sodium_mg, ARRAY[90,180,270,360,450,540,630,720,810,900]::numeric[]);
    fib  := fn_threshold_points(p_fiber,   ARRAY[0.9,1.9,2.8,3.7,4.7]::numeric[]);
    prot := fn_threshold_points(p_protein, ARRAY[1.6,3.2,4.8,6.4,8.0]::numeric[]);
    fv   := CASE WHEN COALESCE(p_fruit_veg_pct,0) >= 80 THEN 5
                 WHEN COALESCE(p_fruit_veg_pct,0) >= 60 THEN 2
                 WHEN COALESCE(p_fruit_veg_pct,0) >= 40 THEN 1 ELSE 0 END;
    IF n >= 11 AND fv < 5 THEN
        RETURN n - fib - fv;
    END IF;
    RETURN n - prot - fib - fv;
END
$$;

CREATE OR REPLACE FUNCTION fn_nutri_score_grade(p_points int)
RETURNS char(1) LANGUAGE sql IMMUTABLE AS
$$ SELECT CASE WHEN p_points <= -1 THEN 'A'
               WHEN p_points <= 2  THEN 'B'
               WHEN p_points <= 10 THEN 'C'
               WHEN p_points <= 18 THEN 'D'
               ELSE 'E' END $$;

CREATE OR REPLACE FUNCTION trg_nutrition_score() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE v_pts int;
BEGIN
    v_pts := fn_nutri_score_points(NEW.calories_kcal, NEW.sugar_g, NEW.saturated_fat_g,
                                   NEW.sodium_mg, NEW.fiber_g, NEW.protein_g, NEW.fruit_veg_percent);
    UPDATE products SET nutri_score_points = v_pts,
                        nutri_score_grade  = fn_nutri_score_grade(v_pts)
    WHERE id = NEW.product_id;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_nutrition_score ON nutrition_facts;
CREATE TRIGGER trg_nutrition_score
AFTER INSERT OR UPDATE ON nutrition_facts
FOR EACH ROW EXECUTE FUNCTION trg_nutrition_score();

DROP TRIGGER IF EXISTS trg_nutrition_updated_at ON nutrition_facts;
CREATE TRIGGER trg_nutrition_updated_at
BEFORE UPDATE ON nutrition_facts
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---- 17.3 Tìm kiếm sản phẩm / blog (không dấu) ----------------------
CREATE OR REPLACE FUNCTION trg_products_search() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', f_unaccent(coalesce(NEW.name,''))), 'A') ||
        setweight(to_tsvector('simple', f_unaccent(coalesce(NEW.short_description,''))), 'B') ||
        setweight(to_tsvector('simple', f_unaccent(coalesce(NEW.description,''))), 'C');
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_products_search ON products;
CREATE TRIGGER trg_products_search
BEFORE INSERT OR UPDATE OF name, short_description, description ON products
FOR EACH ROW EXECUTE FUNCTION trg_products_search();

CREATE OR REPLACE FUNCTION trg_blog_search() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', f_unaccent(coalesce(NEW.title,''))), 'A') ||
        setweight(to_tsvector('simple', f_unaccent(coalesce(NEW.summary,''))), 'B') ||
        setweight(to_tsvector('simple', f_unaccent(coalesce(NEW.content,''))), 'C');
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_blog_search ON blog_posts;
CREATE TRIGGER trg_blog_search
BEFORE INSERT OR UPDATE OF title, summary, content ON blog_posts
FOR EACH ROW EXECUTE FUNCTION trg_blog_search();

-- ---- 17.4 Điểm đánh giá trung bình ----------------------------------
CREATE OR REPLACE FUNCTION fn_refresh_product_rating(p_product_id bigint) RETURNS void
LANGUAGE sql AS
$$
UPDATE products p SET
    avg_rating   = COALESCE((SELECT round(avg(r.rating)::numeric, 2) FROM reviews r
                             WHERE r.product_id = p.id AND r.status = 'approved'), 0),
    review_count = (SELECT count(*) FROM reviews r
                    WHERE r.product_id = p.id AND r.status = 'approved')
WHERE p.id = p_product_id
$$;

CREATE OR REPLACE FUNCTION trg_reviews_rating() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    IF TG_OP IN ('UPDATE','DELETE') THEN PERFORM fn_refresh_product_rating(OLD.product_id); END IF;
    IF TG_OP IN ('INSERT','UPDATE') THEN PERFORM fn_refresh_product_rating(NEW.product_id); END IF;
    RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS trg_reviews_rating ON reviews;
CREATE TRIGGER trg_reviews_rating
AFTER INSERT OR UPDATE OF rating, status OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION trg_reviews_rating();

-- Đếm "hữu ích"
CREATE OR REPLACE FUNCTION trg_review_votes_count() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
        UPDATE reviews SET helpful_count = greatest(helpful_count - 1, 0) WHERE id = OLD.review_id;
    END IF;
    RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS trg_review_votes_count ON review_votes;
CREATE TRIGGER trg_review_votes_count
AFTER INSERT OR DELETE ON review_votes
FOR EACH ROW EXECUTE FUNCTION trg_review_votes_count();

-- ---- 17.5 Lịch sử giá -----------------------------------------------
CREATE OR REPLACE FUNCTION trg_variant_price_history() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    IF NEW.price IS DISTINCT FROM OLD.price THEN
        INSERT INTO variant_price_history(variant_id, old_price, new_price)
        VALUES (NEW.id, OLD.price, NEW.price);
    END IF;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_variant_price_history ON product_variants;
CREATE TRIGGER trg_variant_price_history
AFTER UPDATE OF price ON product_variants
FOR EACH ROW EXECUTE FUNCTION trg_variant_price_history();

-- ---- 17.6 Trạng thái đơn hàng ---------------------------------------
CREATE OR REPLACE FUNCTION trg_order_status_stamp() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NEW.status = 'confirmed'  AND NEW.confirmed_at IS NULL THEN NEW.confirmed_at := now(); END IF;
        IF NEW.status = 'shipping'   AND NEW.shipped_at   IS NULL THEN NEW.shipped_at   := now(); END IF;
        IF NEW.status = 'delivered'  AND NEW.delivered_at IS NULL THEN NEW.delivered_at := now(); END IF;
        IF NEW.status = 'completed'  AND NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
        IF NEW.status = 'cancelled'  AND NEW.cancelled_at IS NULL THEN NEW.cancelled_at := now(); END IF;
    END IF;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_order_status_stamp ON orders;
CREATE TRIGGER trg_order_status_stamp
BEFORE UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION trg_order_status_stamp();

CREATE OR REPLACE FUNCTION trg_order_status_history() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE v_actor bigint := NULLIF(current_setting('app.current_user_id', true), '')::bigint;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO order_status_history(order_id, from_status, to_status, changed_by)
        VALUES (NEW.id, NULL, NEW.status, v_actor);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO order_status_history(order_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, v_actor);
    END IF;
    RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS trg_order_status_history ON orders;
CREATE TRIGGER trg_order_status_history
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION trg_order_status_history();

-- ---- 17.7 Coupon -----------------------------------------------------
CREATE OR REPLACE FUNCTION trg_coupon_usage_count() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE coupons SET used_count = used_count + 1 WHERE id = NEW.coupon_id;
    ELSE
        UPDATE coupons SET used_count = greatest(used_count - 1, 0) WHERE id = OLD.coupon_id;
    END IF;
    RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS trg_coupon_usage_count ON coupon_usages;
CREATE TRIGGER trg_coupon_usage_count
AFTER INSERT OR DELETE ON coupon_usages
FOR EACH ROW EXECUTE FUNCTION trg_coupon_usage_count();

-- ---- 17.8 Tích điểm & thăng hạng -------------------------------------
CREATE OR REPLACE FUNCTION trg_loyalty_apply() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    INSERT INTO loyalty_accounts(user_id, points_balance, lifetime_points)
    VALUES (NEW.user_id, NEW.points, greatest(NEW.points, 0))
    ON CONFLICT (user_id) DO UPDATE SET
        points_balance  = loyalty_accounts.points_balance + NEW.points,
        lifetime_points = loyalty_accounts.lifetime_points + greatest(NEW.points, 0),
        updated_at      = now();

    UPDATE loyalty_accounts la SET tier_id = (
        SELECT t.id FROM membership_tiers t
        WHERE t.min_points <= la.lifetime_points
        ORDER BY t.min_points DESC LIMIT 1)
    WHERE la.user_id = NEW.user_id;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_loyalty_apply ON loyalty_transactions;
CREATE TRIGGER trg_loyalty_apply
AFTER INSERT ON loyalty_transactions
FOR EACH ROW EXECUTE FUNCTION trg_loyalty_apply();

-- ---- 17.9 Khởi tạo dữ liệu phụ khi tạo user --------------------------
CREATE OR REPLACE FUNCTION trg_user_bootstrap() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
    INSERT INTO loyalty_accounts(user_id, tier_id)
    VALUES (NEW.id, (SELECT id FROM membership_tiers ORDER BY min_points LIMIT 1))
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO notification_preferences(user_id) 
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_user_bootstrap ON users;
CREATE TRIGGER trg_user_bootstrap
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION trg_user_bootstrap();

-- ---- 17.10 Audit log ---------------------------------------------------
CREATE OR REPLACE FUNCTION trg_audit() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE
    v_actor bigint := NULLIF(current_setting('app.current_user_id', true), '')::bigint;
    v_row   jsonb  := to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);
BEGIN
    INSERT INTO audit_logs(user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (v_actor, TG_OP, TG_TABLE_NAME, (v_row->>'id')::bigint,
            CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
            CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END);
    RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS trg_audit_products ON products;
CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION trg_audit();

DROP TRIGGER IF EXISTS trg_audit_variants ON product_variants;
CREATE TRIGGER trg_audit_variants AFTER INSERT OR UPDATE OR DELETE ON product_variants FOR EACH ROW EXECUTE FUNCTION trg_audit();

DROP TRIGGER IF EXISTS trg_audit_coupons ON coupons;
CREATE TRIGGER trg_audit_coupons AFTER INSERT OR UPDATE OR DELETE ON coupons FOR EACH ROW EXECUTE FUNCTION trg_audit();

DROP TRIGGER IF EXISTS trg_audit_orders ON orders;
CREATE TRIGGER trg_audit_orders AFTER UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION trg_audit();

-- ---- 17.11 Phân bổ tồn kho theo FEFO ----------------------------------
CREATE OR REPLACE FUNCTION fn_allocate_stock_fefo(p_variant_id bigint, p_qty integer)
RETURNS TABLE (inventory_id bigint, batch_id bigint, warehouse_id bigint, allocated_qty integer)
LANGUAGE plpgsql AS
$$
DECLARE
    rec       record;
    v_remain  integer := p_qty;
    v_take    integer;
BEGIN
    IF p_qty <= 0 THEN RAISE EXCEPTION 'Số lượng phải > 0'; END IF;

    FOR rec IN
        SELECT i.id AS inv_id, i.batch_id AS b_id, i.warehouse_id AS w_id,
               i.quantity_on_hand - i.quantity_reserved AS available
        FROM inventory i
        JOIN product_batches b ON b.id = i.batch_id
        JOIN warehouses w      ON w.id = i.warehouse_id AND w.is_active
        WHERE b.variant_id = p_variant_id
          AND (b.expires_on IS NULL OR b.expires_on >= current_date)
          AND i.quantity_on_hand - i.quantity_reserved > 0
        ORDER BY b.expires_on NULLS LAST, b.id
        FOR UPDATE OF i
    LOOP
        EXIT WHEN v_remain <= 0;
        v_take := least(rec.available, v_remain);
        UPDATE inventory SET quantity_reserved = quantity_reserved + v_take, updated_at = now()
        WHERE id = rec.inv_id;

        inventory_id  := rec.inv_id;
        batch_id      := rec.b_id;
        warehouse_id  := rec.w_id;
        allocated_qty := v_take;
        RETURN NEXT;
        v_remain := v_remain - v_take;
    END LOOP;

    IF v_remain > 0 THEN
        RAISE EXCEPTION 'Không đủ tồn kho cho variant % (thiếu %)', p_variant_id, v_remain;
    END IF;
END
$$;

-- ---- 17.12 Dinh dưỡng của giỏ hàng -----------------------------------
CREATE OR REPLACE FUNCTION fn_cart_nutrition(p_cart_id bigint)
RETURNS TABLE (total_kcal numeric, total_protein_g numeric, total_carb_g numeric,
               total_fat_g numeric, total_sugar_g numeric, total_fiber_g numeric,
               total_sodium_mg numeric)
LANGUAGE sql STABLE AS
$$
SELECT round(sum(ci.quantity * v.net_weight_g / 100.0 * nf.calories_kcal), 1),
       round(sum(ci.quantity * v.net_weight_g / 100.0 * nf.protein_g), 1),
       round(sum(ci.quantity * v.net_weight_g / 100.0 * nf.carbohydrate_g), 1),
       round(sum(ci.quantity * v.net_weight_g / 100.0 * nf.fat_g), 1),
       round(sum(ci.quantity * v.net_weight_g / 100.0 * nf.sugar_g), 1),
       round(sum(ci.quantity * v.net_weight_g / 100.0 * nf.fiber_g), 1),
       round(sum(ci.quantity * v.net_weight_g / 100.0 * nf.sodium_mg), 1)
FROM cart_items ci
JOIN product_variants v ON v.id = ci.variant_id
JOIN nutrition_facts nf ON nf.product_id = v.product_id
WHERE ci.cart_id = p_cart_id
$$;

-- ---- 17.13 Lọc sản phẩm an toàn theo dị ứng của user ------------------
CREATE OR REPLACE FUNCTION fn_product_is_safe_for_user(p_product_id bigint, p_user_id bigint)
RETURNS boolean LANGUAGE sql STABLE AS
$$
SELECT NOT EXISTS (
    SELECT 1 FROM product_allergens pa
    JOIN user_allergens ua ON ua.allergen_id = pa.allergen_id AND ua.user_id = p_user_id
    WHERE pa.product_id = p_product_id
)
$$;

-- ---- 17.14 Gợi ý sản phẩm từ kết quả quiz ------------------------------
CREATE OR REPLACE FUNCTION fn_quiz_recommend(p_session_id bigint, p_limit integer DEFAULT 10)
RETURNS TABLE (product_id bigint, score integer)
LANGUAGE sql STABLE AS
$$
WITH chosen AS (
    SELECT option_id FROM quiz_answers WHERE session_id = p_session_id
),
boost AS (
    SELECT p.id AS pid, sum(e.weight) AS sc
    FROM chosen c
    JOIN quiz_option_effects e ON e.option_id = c.option_id
         AND e.effect_type IN ('boost_diet','boost_tag','boost_category')
    JOIN products p ON p.status = 'active' AND p.deleted_at IS NULL
         AND ( (e.diet_id IS NOT NULL AND EXISTS (SELECT 1 FROM product_diets pd WHERE pd.product_id = p.id AND pd.diet_id = e.diet_id))
            OR (e.tag_id  IS NOT NULL AND EXISTS (SELECT 1 FROM product_tags  pt WHERE pt.product_id = p.id AND pt.tag_id  = e.tag_id))
            OR (e.category_id IS NOT NULL AND p.category_id = e.category_id) )
    GROUP BY p.id
),
excluded AS (
    SELECT DISTINCT pa.product_id AS pid
    FROM chosen c
    JOIN quiz_option_effects e ON e.option_id = c.option_id AND e.effect_type = 'exclude_allergen'
    JOIN product_allergens pa  ON pa.allergen_id = e.allergen_id
)
SELECT b.pid, b.sc::int
FROM boost b
WHERE b.pid NOT IN (SELECT pid FROM excluded)
ORDER BY b.sc DESC, b.pid
LIMIT p_limit
$$;

-- ---- 17.15 Gắn trigger updated_at cho mọi bảng có cột updated_at -------
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables t
          ON t.table_schema = c.table_schema AND t.table_name = c.table_name
        WHERE c.table_schema = 'public'
          AND c.column_name = 'updated_at'
          AND t.table_type = 'BASE TABLE'
          AND c.table_name <> 'nutrition_facts'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$I;', r.table_name);
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()',
            r.table_name);
    END LOOP;
END
$$;

-- =====================================================================
-- 18. VIEW & MATERIALIZED VIEW
-- =====================================================================

-- Tồn khả dụng theo variant (bỏ lô đã hết hạn)
CREATE OR REPLACE VIEW v_variant_stock AS
SELECT v.id AS variant_id, v.product_id, v.sku, v.name AS variant_name, v.reorder_level,
       COALESCE(sum(i.quantity_on_hand - i.quantity_reserved)
                FILTER (WHERE b.expires_on IS NULL OR b.expires_on >= current_date), 0)::int AS available_qty
FROM product_variants v
LEFT JOIN product_batches b ON b.variant_id = v.id
LEFT JOIN inventory i       ON i.batch_id = b.id
GROUP BY v.id;

-- Danh sách sản phẩm cho trang listing
CREATE OR REPLACE VIEW v_product_catalog AS
SELECT p.id, p.name, p.slug, p.status, p.category_id, c.name AS category_name,
       br.name AS brand_name,
       dv.id AS default_variant_id, dv.price, dv.compare_at_price,
       img.url AS primary_image,
       p.avg_rating, p.review_count, p.sold_count, p.is_featured,
       p.nutri_score_grade,
       nf.calories_kcal, nf.protein_g, nf.carbohydrate_g, nf.fat_g, nf.sugar_g, nf.fiber_g,
       COALESCE(st.available_qty, 0) AS available_qty
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN brands br ON br.id = p.brand_id
LEFT JOIN LATERAL (
    SELECT v.id, v.price, v.compare_at_price FROM product_variants v
    WHERE v.product_id = p.id AND v.is_active
    ORDER BY v.is_default DESC, v.price LIMIT 1) dv ON true
LEFT JOIN LATERAL (
    SELECT i.url FROM product_images i
    WHERE i.product_id = p.id ORDER BY i.is_primary DESC, i.sort_order LIMIT 1) img ON true
LEFT JOIN nutrition_facts nf ON nf.product_id = p.id
LEFT JOIN LATERAL (
    SELECT sum(s.available_qty)::int AS available_qty FROM v_variant_stock s WHERE s.product_id = p.id) st ON true
WHERE p.deleted_at IS NULL;

-- Cảnh báo tồn kho thấp
CREATE OR REPLACE VIEW v_low_stock AS
SELECT s.variant_id, s.sku, p.name AS product_name, s.variant_name, s.available_qty, s.reorder_level
FROM v_variant_stock s
JOIN products p ON p.id = s.product_id
WHERE p.deleted_at IS NULL AND s.available_qty <= s.reorder_level;

-- Lô sắp hết hạn trong 30 ngày (để đẩy sale)
CREATE OR REPLACE VIEW v_near_expiry AS
SELECT b.id AS batch_id, b.batch_code, p.name AS product_name, v.name AS variant_name,
       b.expires_on, (b.expires_on - current_date) AS days_left,
       sum(i.quantity_on_hand) AS quantity_on_hand
FROM product_batches b
JOIN product_variants v ON v.id = b.variant_id
JOIN products p         ON p.id = v.product_id
JOIN inventory i        ON i.batch_id = b.id
WHERE b.expires_on IS NOT NULL
  AND b.expires_on BETWEEN current_date AND current_date + 30
GROUP BY b.id, p.name, v.name
HAVING sum(i.quantity_on_hand) > 0
ORDER BY b.expires_on;

-- Trang truy xuất nguồn gốc qua QR
CREATE OR REPLACE VIEW v_traceability AS
SELECT b.qr_code, b.batch_code, p.name AS product_name, v.name AS variant_name,
       f.name AS farm_name, f.province AS farm_province, f.address AS farm_address,
       b.harvested_on, b.manufactured_on, b.expires_on, b.lab_test_url, b.lab_result_note,
       s.name AS supplier_name
FROM product_batches b
JOIN product_variants v ON v.id = b.variant_id
JOIN products p         ON p.id = v.product_id
LEFT JOIN farms f       ON f.id = b.farm_id
LEFT JOIN suppliers s   ON s.id = b.supplier_id;

-- Doanh thu theo ngày
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT placed_at::date AS day,
       count(*)                 AS orders,
       sum(subtotal)            AS gross_sales,
       sum(discount_amount + points_discount) AS discounts,
       sum(shipping_fee)        AS shipping_collected,
       sum(total_amount)        AS revenue
FROM orders
WHERE status IN ('delivered','completed')
GROUP BY 1
ORDER BY 1;

-- Đơn theo trạng thái
CREATE OR REPLACE VIEW v_order_status_summary AS
SELECT status, count(*) AS orders, COALESCE(sum(total_amount),0) AS amount
FROM orders GROUP BY status;

-- Top sản phẩm bán chạy
CREATE OR REPLACE VIEW v_top_selling_products AS
SELECT p.id AS product_id, p.name,
       sum(oi.quantity)   AS units_sold,
       sum(oi.line_total) AS revenue
FROM order_items oi
JOIN orders o   ON o.id = oi.order_id AND o.status IN ('delivered','completed')
JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY units_sold DESC;

-- Thống kê khách hàng
CREATE OR REPLACE VIEW v_customer_stats AS
SELECT u.id AS user_id, u.full_name, u.email,
       count(o.id) FILTER (WHERE o.status IN ('delivered','completed')) AS completed_orders,
       COALESCE(sum(o.total_amount) FILTER (WHERE o.status IN ('delivered','completed')), 0) AS lifetime_value,
       max(o.placed_at) AS last_order_at,
       la.points_balance, t.name AS tier_name
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
LEFT JOIN loyalty_accounts la ON la.user_id = u.id
LEFT JOIN membership_tiers t  ON t.id = la.tier_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, la.points_balance, t.name;

-- Gợi ý "Thường mua cùng"
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_frequently_bought AS
WITH op AS (
    SELECT DISTINCT oi.order_id, oi.product_id
    FROM order_items oi WHERE oi.product_id IS NOT NULL
)
SELECT a.product_id, b.product_id AS related_product_id, count(*) AS together_count
FROM op a
JOIN op b ON b.order_id = a.order_id AND b.product_id <> a.product_id
GROUP BY a.product_id, b.product_id;
CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_fbt ON mv_frequently_bought(product_id, related_product_id);
