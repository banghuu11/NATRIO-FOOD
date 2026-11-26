-- =====================================================================
-- NUTRIO - UPGRADE v2 (chạy sau 01_schema.sql + 02_seed.sql)
-- Chỉ THÊM bảng/cột, không xóa dữ liệu. Có thể chạy lại an toàn.
-- =====================================================================

-- 1. Chống tạo đơn trùng (idempotency key do client sinh cho mỗi lần đặt hàng)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key varchar(80);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_idempotency_key') THEN
        ALTER TABLE orders ADD CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key);
    END IF;
END $$;

-- 2. Phân bổ tồn kho theo lô cho từng dòng đơn hàng (FEFO)
--    reserved  : đã giữ hàng khi đặt đơn
--    shipped   : đã xuất kho khi giao
--    released  : đã nhả hàng khi hủy đơn
--    returned  : đã nhập lại kho khi hoàn trả
CREATE TABLE IF NOT EXISTS order_allocations (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_item_id bigint NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    inventory_id  bigint NOT NULL REFERENCES inventory(id),
    batch_id      bigint NOT NULL REFERENCES product_batches(id),
    warehouse_id  bigint NOT NULL REFERENCES warehouses(id),
    quantity      integer NOT NULL CHECK (quantity > 0),
    state         varchar(12) NOT NULL DEFAULT 'reserved'
                  CHECK (state IN ('reserved','shipped','released','returned')),
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_alloc_item ON order_allocations(order_item_id);

-- 3. Trang nội dung tĩnh (Giới thiệu, Chính sách giao hàng, đổi trả...)
CREATE TABLE IF NOT EXISTS cms_pages (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug         varchar(120) NOT NULL UNIQUE,
    title        varchar(200) NOT NULL,
    content      text NOT NULL DEFAULT '',
    is_published boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_cms_pages_updated_at ON cms_pages;
CREATE TRIGGER trg_cms_pages_updated_at BEFORE UPDATE ON cms_pages
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 4. Đăng ký nhận tin khuyến mãi
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email      citext NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Banner: thêm phụ đề và nhãn nút
ALTER TABLE banners ADD COLUMN IF NOT EXISTS subtitle  varchar(300);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS cta_label varchar(60);

-- 6. Công thức: bữa phù hợp (dùng cho Smart Meal Plan)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS meal_types meal_type[] NOT NULL DEFAULT '{}';
