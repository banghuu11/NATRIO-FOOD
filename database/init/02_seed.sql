-- =====================================================================
-- NUTRIO - DỮ LIỆU MẪU (chạy sau nutrio_schema.sql)
-- =====================================================================

-- ---- Phân quyền -----------------------------------------------------
INSERT INTO roles(code, name, description) VALUES
 ('customer','Khách hàng','Người mua hàng'),
 ('staff_sales','Nhân viên bán hàng','Xử lý đơn, chăm sóc khách'),
 ('staff_warehouse','Nhân viên kho','Quản lý nhập xuất kho'),
 ('admin','Quản trị viên','Toàn quyền');

INSERT INTO permissions(code, description) VALUES
 ('product.read','Xem sản phẩm'),('product.write','Thêm/sửa/xóa sản phẩm'),
 ('order.read','Xem đơn hàng'),('order.update','Cập nhật trạng thái đơn'),
 ('inventory.manage','Quản lý kho'),('coupon.manage','Quản lý mã giảm giá'),
 ('review.moderate','Duyệt đánh giá'),('content.manage','Quản lý blog/banner'),
 ('report.view','Xem báo cáo'),('user.manage','Quản lý người dùng');

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'admin';
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.code IN ('product.read','order.read','order.update','review.moderate','coupon.manage','report.view')
WHERE r.code = 'staff_sales';
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.code IN ('product.read','inventory.manage','order.read')
WHERE r.code = 'staff_warehouse';

-- ---- Hạng thành viên (phải có trước khi tạo user) -------------------
INSERT INTO membership_tiers(code, name, min_points, discount_percent, points_multiplier, benefits) VALUES
 ('member','Thành viên',0,0,1.0,'{"free_ship_min": 300000}'),
 ('silver','Bạc',1000,3,1.2,'{"free_ship_min": 200000, "birthday_voucher": true}'),
 ('gold','Vàng',5000,5,1.5,'{"free_ship_min": 0, "birthday_voucher": true, "priority_support": true}');

-- ---- Tài khoản mẫu (mật khẩu chỉ dùng cho dev) ----------------------
INSERT INTO users(email, phone, password_hash, full_name, gender, date_of_birth, email_verified_at) VALUES
 ('admin@nutrio.vn','0900000001', crypt('Admin@123', gen_salt('bf')), 'Quản trị NUTRIO','other','1995-01-01', now()),
 ('lan@example.com','0900000002', crypt('User@123',  gen_salt('bf')), 'Nguyễn Thị Lan','female','1999-05-20', now()),
 ('minh@example.com','0900000003', crypt('User@123', gen_salt('bf')), 'Trần Quang Minh','male','1997-09-12', now());

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'admin'    WHERE u.email = 'admin@nutrio.vn';
INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'customer' WHERE u.email IN ('lan@example.com','minh@example.com');

INSERT INTO addresses(user_id, label, recipient_name, phone, province, district, ward, street, is_default)
SELECT id, 'Nhà', full_name, phone, 'TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', '12 Nguyễn Huệ', true
FROM users WHERE email = 'lan@example.com';

-- ---- Dị ứng, chế độ ăn, chứng nhận ----------------------------------
INSERT INTO allergens(code, name_vi, name_en) VALUES
 ('peanut','Đậu phộng','Peanut'),('tree_nut','Hạt cây (hạnh nhân, óc chó...)','Tree nuts'),
 ('milk','Sữa','Milk'),('egg','Trứng','Egg'),('soy','Đậu nành','Soy'),
 ('gluten','Gluten (lúa mì)','Gluten'),('fish','Cá','Fish'),
 ('shellfish','Giáp xác','Shellfish'),('sesame','Mè','Sesame');

INSERT INTO diets(code, name_vi, name_en) VALUES
 ('keto','Keto','Keto'),('eat_clean','Eat Clean','Eat Clean'),('vegan','Thuần chay','Vegan'),
 ('vegetarian','Ăn chay','Vegetarian'),('low_carb','Ít tinh bột','Low-carb'),
 ('gluten_free','Không gluten','Gluten-free'),('sugar_free','Không đường','Sugar-free'),
 ('low_calorie','Ít calo','Low-calorie'),('diabetic_friendly','Phù hợp người tiểu đường','Diabetic-friendly'),
 ('high_protein','Giàu đạm','High-protein');

INSERT INTO certifications(code, name, issuer) VALUES
 ('organic','Hữu cơ (Organic)','USDA / EU Organic'),('vietgap','VietGAP','Bộ NN&PTNT'),
 ('haccp','HACCP','Tổ chức chứng nhận'),('non_gmo','Non-GMO','Non-GMO Project'),
 ('vegan_cert','Chứng nhận thuần chay','Vegan Society');

-- ---- Danh mục, thương hiệu, nhà cung cấp, nông trại ------------------
INSERT INTO categories(name, slug, sort_order) VALUES
 ('Ngũ cốc & Hạt','ngu-coc-hat',1),('Sữa hạt & Đồ uống','sua-hat-do-uong',2),
 ('Rau củ & Salad','rau-cu-salad',3),('Đạm sạch','dam-sach',4),
 ('Snack lành mạnh','snack-lanh-manh',5);

INSERT INTO brands(name, slug, country) VALUES
 ('NUTRIO Farm','nutrio-farm','Việt Nam'),('GreenOat','greenoat','Việt Nam');
INSERT INTO suppliers(name, contact_name, phone, email) VALUES
 ('Công ty TNHH Nông sản Xanh','Lê Văn An','0281234567','sales@nongsanxanh.vn');
INSERT INTO farms(name, owner_name, province, address, description) VALUES
 ('Nông trại Đà Lạt Xanh','Phạm Thị Hoa','Lâm Đồng','Xã Xuân Thọ, Đà Lạt','Canh tác hữu cơ, không thuốc trừ sâu hóa học');

INSERT INTO warehouses(code, name, province, is_cold_storage) VALUES
 ('HCM-01','Kho trung tâm TP.HCM','TP. Hồ Chí Minh', false),
 ('HCM-COLD','Kho lạnh TP.HCM','TP. Hồ Chí Minh', true);

INSERT INTO shipping_methods(code, name, carrier, base_fee, free_ship_threshold, est_hours_min, est_hours_max, is_cold_chain) VALUES
 ('standard','Giao tiêu chuẩn','GHN',25000,300000,24,72,false),
 ('express_2h','Giao nhanh 2 giờ','Ahamove',35000,500000,1,2,false),
 ('cold_chain','Giao lạnh trong ngày','Ahamove',45000,500000,2,6,true);

INSERT INTO subscription_plans(name, frequency, discount_percent, description) VALUES
 ('Giao hằng tuần','weekly',10,'Giảm 10%, tạm dừng bất cứ lúc nào'),
 ('Giao 2 tuần/lần','biweekly',7,'Giảm 7%'),
 ('Giao hằng tháng','monthly',5,'Giảm 5%');

-- ---- Sản phẩm mẫu -----------------------------------------------------
INSERT INTO products(category_id, brand_id, supplier_id, farm_id, name, slug, short_description, description, shelf_life_days, status, is_featured)
SELECT c.id, b.id, s.id, f.id, v.name, v.slug, v.short_desc, v.descr, v.shelf, 'active', v.featured
FROM (VALUES
 ('ngu-coc-hat','Yến mạch cán dẹt','yen-mach-can-det','Giàu chất xơ beta-glucan, tốt cho tim mạch','Yến mạch nguyên hạt cán dẹt, nấu cháo hoặc ngâm qua đêm.',365,true),
 ('ngu-coc-hat','Hạnh nhân rang không muối','hanh-nhan-rang','Giàu vitamin E và chất béo tốt','Hạnh nhân rang mộc, không muối, không đường.',270,true),
 ('ngu-coc-hat','Hạt chia','hat-chia','Giàu omega-3 và chất xơ','Hạt chia nhập khẩu, dùng với sữa hạt hoặc sinh tố.',540,false),
 ('snack-lanh-manh','Granola không đường','granola-khong-duong','Granola yến mạch và hạt, không thêm đường','Nướng giòn bằng dầu dừa, ngọt nhẹ từ chà là.',180,true),
 ('sua-hat-do-uong','Sữa óc chó không đường','sua-oc-cho-khong-duong','Sữa hạt thuần chay, ít calo','Sữa óc chó nguyên chất, không đường, không chất bảo quản.',120,false),
 ('dam-sach','Ức gà áp chảo sốt tiêu','uc-ga-ap-chao','Giàu đạm, ít béo, dùng ngay','Ức gà sơ chế sẵn, bảo quản mát.',7,true)
) AS v(cat, name, slug, short_desc, descr, shelf, featured)
JOIN categories c ON c.slug = v.cat
CROSS JOIN (SELECT id FROM brands WHERE slug = 'nutrio-farm') b
CROSS JOIN (SELECT id FROM suppliers LIMIT 1) s
CROSS JOIN (SELECT id FROM farms LIMIT 1) f;

INSERT INTO product_variants(product_id, sku, name, net_weight_g, price, compare_at_price, cost_price, is_default, reorder_level)
SELECT p.id, v.sku, v.name, v.w, v.price, v.cmp, v.cost, true, 10
FROM (VALUES
 ('yen-mach-can-det','OAT-500','Túi 500g',500,89000,99000,60000),
 ('hanh-nhan-rang','ALM-250','Hũ 250g',250,129000,NULL,90000),
 ('hat-chia','CHIA-200','Túi 200g',200,95000,NULL,65000),
 ('granola-khong-duong','GRA-400','Túi 400g',400,159000,179000,105000),
 ('sua-oc-cho-khong-duong','MILK-1L','Chai 1 lít',1000,79000,NULL,50000),
 ('uc-ga-ap-chao','CHK-200','Hộp 200g',200,65000,NULL,40000)
) AS v(slug, sku, name, w, price, cmp, cost)
JOIN products p ON p.slug = v.slug;

-- Dinh dưỡng trên 100g (trigger tự tính Nutri-Score)
INSERT INTO nutrition_facts(product_id, serving_size_g, calories_kcal, protein_g, carbohydrate_g, sugar_g, fiber_g, fat_g, saturated_fat_g, sodium_mg, glycemic_index)
SELECT p.id, v.serv, v.kcal, v.prot, v.carb, v.sugar, v.fiber, v.fat, v.sat, v.sodium, v.gi
FROM (VALUES
 ('yen-mach-can-det',40,379,13.2,67.7,1.0,10.1,6.5,1.1,6,55),
 ('hanh-nhan-rang',30,598,21.0,20.0,4.0,12.0,52.0,4.0,5,15),
 ('hat-chia',15,486,16.5,42.0,0.0,34.0,31.0,3.3,16,1),
 ('granola-khong-duong',45,420,11.0,58.0,2.0,8.0,16.0,3.0,30,50),
 ('sua-oc-cho-khong-duong',200,40,1.0,3.0,0.5,0.5,2.8,0.3,40,NULL),
 ('uc-ga-ap-chao',200,120,20.0,3.0,1.0,0.5,2.5,0.6,320,NULL)
) AS v(slug, serv, kcal, prot, carb, sugar, fiber, fat, sat, sodium, gi)
JOIN products p ON p.slug = v.slug;

INSERT INTO product_images(product_id, url, alt_text, is_primary)
SELECT id, 'https://placehold.co/600x600?text=' || slug, name, true FROM products;

-- Dị ứng
INSERT INTO product_allergens(product_id, allergen_id, relation)
SELECT p.id, a.id, 'contains' FROM products p JOIN allergens a ON a.code = 'tree_nut'
WHERE p.slug IN ('hanh-nhan-rang','sua-oc-cho-khong-duong');
INSERT INTO product_allergens(product_id, allergen_id, relation)
SELECT p.id, a.id, 'may_contain' FROM products p JOIN allergens a ON a.code IN ('gluten','tree_nut')
WHERE p.slug = 'granola-khong-duong';
INSERT INTO product_allergens(product_id, allergen_id, relation)
SELECT p.id, a.id, 'may_contain' FROM products p JOIN allergens a ON a.code = 'gluten'
WHERE p.slug = 'yen-mach-can-det';

-- Chế độ ăn
INSERT INTO product_diets(product_id, diet_id)
SELECT p.id, d.id FROM (VALUES
 ('yen-mach-can-det','eat_clean'),('yen-mach-can-det','vegan'),('yen-mach-can-det','high_protein'),
 ('hanh-nhan-rang','keto'),('hanh-nhan-rang','low_carb'),('hanh-nhan-rang','vegan'),('hanh-nhan-rang','eat_clean'),
 ('hat-chia','keto'),('hat-chia','vegan'),('hat-chia','gluten_free'),('hat-chia','eat_clean'),
 ('granola-khong-duong','sugar_free'),('granola-khong-duong','eat_clean'),('granola-khong-duong','vegan'),
 ('sua-oc-cho-khong-duong','vegan'),('sua-oc-cho-khong-duong','sugar_free'),('sua-oc-cho-khong-duong','low_calorie'),
 ('uc-ga-ap-chao','keto'),('uc-ga-ap-chao','low_carb'),('uc-ga-ap-chao','high_protein'),('uc-ga-ap-chao','eat_clean')
) AS m(slug, diet) JOIN products p ON p.slug = m.slug JOIN diets d ON d.code = m.diet;

-- Chứng nhận
INSERT INTO product_certifications(product_id, certification_id, certificate_number)
SELECT p.id, c.id, 'CERT-' || upper(substr(md5(p.slug || c.code), 1, 8))
FROM products p JOIN certifications c ON c.code IN ('haccp')
UNION ALL
SELECT p.id, c.id, 'ORG-' || upper(substr(md5(p.slug), 1, 8))
FROM products p JOIN certifications c ON c.code = 'organic' WHERE p.slug IN ('yen-mach-can-det','hat-chia');

-- Thành phần
INSERT INTO ingredients(name, name_en) VALUES
 ('Yến mạch','Oats'),('Hạnh nhân','Almond'),('Chà là','Date'),('Dầu dừa','Coconut oil'),
 ('Hạt óc chó','Walnut'),('Nước lọc','Water'),('Ức gà','Chicken breast'),('Tiêu đen','Black pepper');
INSERT INTO product_ingredients(product_id, ingredient_id, percentage, sort_order)
SELECT p.id, i.id, m.pct, m.ord FROM (VALUES
 ('yen-mach-can-det','Yến mạch',100,1),
 ('hanh-nhan-rang','Hạnh nhân',100,1),
 ('granola-khong-duong','Yến mạch',60,1),('granola-khong-duong','Hạnh nhân',20,2),
 ('granola-khong-duong','Chà là',12,3),('granola-khong-duong','Dầu dừa',8,4),
 ('sua-oc-cho-khong-duong','Nước lọc',92,1),('sua-oc-cho-khong-duong','Hạt óc chó',8,2),
 ('uc-ga-ap-chao','Ức gà',95,1),('uc-ga-ap-chao','Tiêu đen',1,2)
) AS m(slug, ing, pct, ord) JOIN products p ON p.slug = m.slug JOIN ingredients i ON i.name = m.ing;

-- Sản phẩm thay thế
INSERT INTO product_substitutes(product_id, substitute_id, reason, priority)
SELECT a.id, b.id, 'Ít đường hơn, nhiều chất xơ hơn', 1
FROM products a, products b WHERE a.slug = 'granola-khong-duong' AND b.slug = 'yen-mach-can-det';

-- ---- Lô hàng + tồn kho (có QR truy xuất) -----------------------------
INSERT INTO product_batches(variant_id, farm_id, supplier_id, batch_code, qr_code, harvested_on, manufactured_on, expires_on, quantity_received, unit_cost)
SELECT v.id, (SELECT id FROM farms LIMIT 1), (SELECT id FROM suppliers LIMIT 1),
       'LOT-' || v.sku || '-' || to_char(current_date, 'YYMM'),
       'NUTRIO-' || upper(substr(md5(v.sku || random()::text), 1, 10)),
       current_date - 20, current_date - 10,
       current_date + greatest(p.shelf_life_days - 10, 5), 100, v.cost_price
FROM product_variants v JOIN products p ON p.id = v.product_id;

-- Thêm 1 lô gần hết hạn để demo cảnh báo + FEFO
INSERT INTO product_batches(variant_id, batch_code, qr_code, manufactured_on, expires_on, quantity_received, unit_cost)
SELECT v.id, 'LOT-' || v.sku || '-OLD', 'NUTRIO-OLD' || upper(substr(md5(v.sku), 1, 6)),
       current_date - 100, current_date + 12, 20, v.cost_price
FROM product_variants v WHERE v.sku = 'GRA-400';

INSERT INTO inventory(warehouse_id, batch_id, quantity_on_hand)
SELECT (SELECT id FROM warehouses WHERE code = CASE WHEN p.slug = 'uc-ga-ap-chao' THEN 'HCM-COLD' ELSE 'HCM-01' END),
       b.id, b.quantity_received
FROM product_batches b JOIN product_variants v ON v.id = b.variant_id JOIN products p ON p.id = v.product_id;

INSERT INTO stock_movements(batch_id, warehouse_id, movement_type, quantity, reference_type, note)
SELECT i.batch_id, i.warehouse_id, 'purchase_in', i.quantity_on_hand, 'seed', 'Nhập kho ban đầu' FROM inventory i;

-- ---- Khuyến mãi -------------------------------------------------------
INSERT INTO coupons(code, description, discount_type, discount_value, max_discount_amount, min_order_amount, usage_limit, usage_limit_per_user, first_order_only, ends_at) VALUES
 ('WELCOME10','Giảm 10% đơn đầu tiên','percent',10,50000,150000,1000,1,true, now() + interval '1 year'),
 ('FREESHIP','Miễn phí vận chuyển','free_shipping',0,NULL,300000,NULL,5,false, now() + interval '6 months'),
 ('GIAM30K','Giảm 30.000đ','fixed_amount',30000,NULL,200000,500,2,false, now() + interval '3 months');

INSERT INTO flash_sales(name, starts_at, ends_at) VALUES
 ('Flash sale cuối tuần', now(), now() + interval '2 days');
INSERT INTO flash_sale_items(flash_sale_id, variant_id, sale_price, quantity_limit)
SELECT f.id, v.id, 119000, 30 FROM flash_sales f, product_variants v WHERE v.sku = 'GRA-400';

-- Combo
INSERT INTO bundles(name, slug, description, price) VALUES
 ('Combo Ăn sáng Eat Clean','combo-an-sang-eat-clean','Yến mạch + Granola + Hạt chia', 319000);
INSERT INTO bundle_items(bundle_id, variant_id, quantity)
SELECT b.id, v.id, 1 FROM bundles b, product_variants v WHERE v.sku IN ('OAT-500','GRA-400','CHIA-200');

-- ---- Công thức "Shop the Recipe" --------------------------------------
INSERT INTO recipes(title, slug, description, prep_minutes, cook_minutes, servings, calories_per_serving, protein_g, carbohydrate_g, fat_g, is_published)
VALUES ('Overnight oats hạnh nhân','overnight-oats-hanh-nhan','Bữa sáng ngâm qua đêm, chuẩn bị 5 phút.',5,0,1,420,16,52,16,true);
INSERT INTO recipe_ingredients(recipe_id, product_id, variant_id, ingredient_name, quantity, unit, sort_order)
SELECT r.id, p.id, v.id, p.name, m.qty, 'g', m.ord
FROM recipes r
JOIN (VALUES ('yen-mach-can-det',50,1),('hat-chia',10,2),('hanh-nhan-rang',15,3),('sua-oc-cho-khong-duong',200,4)) AS m(slug, qty, ord) ON true
JOIN products p ON p.slug = m.slug
JOIN product_variants v ON v.product_id = p.id AND v.is_default
WHERE r.slug = 'overnight-oats-hanh-nhan';
INSERT INTO recipe_steps(recipe_id, step_number, instruction)
SELECT id, s.n, s.t FROM recipes, (VALUES
 (1,'Cho yến mạch, hạt chia vào hũ.'),(2,'Đổ sữa óc chó, khuấy đều.'),
 (3,'Đậy kín, để ngăn mát qua đêm.'),(4,'Sáng hôm sau rắc hạnh nhân và thưởng thức.')) AS s(n,t)
WHERE slug = 'overnight-oats-hanh-nhan';
INSERT INTO recipe_diets(recipe_id, diet_id)
SELECT r.id, d.id FROM recipes r, diets d WHERE d.code IN ('eat_clean','vegan');

-- ---- Thực đơn mẫu -----------------------------------------------------
INSERT INTO meal_plans(name, slug, description, goal, duration_days, target_calories, is_template, is_published)
VALUES ('Thực đơn giảm cân 7 ngày (1500 kcal)','giam-can-7-ngay-1500','Cân bằng đạm - xơ, dễ làm.','lose_weight',7,1500,true,true);
INSERT INTO meal_plan_items(meal_plan_id, day_number, meal_type, recipe_id)
SELECT mp.id, d, 'breakfast', r.id FROM meal_plans mp, recipes r, generate_series(1,7) d
WHERE mp.slug = 'giam-can-7-ngay-1500' AND r.slug = 'overnight-oats-hanh-nhan';
INSERT INTO meal_plan_items(meal_plan_id, day_number, meal_type, product_id, quantity)
SELECT mp.id, d, 'lunch', p.id, 1 FROM meal_plans mp, products p, generate_series(1,7) d
WHERE mp.slug = 'giam-can-7-ngay-1500' AND p.slug = 'uc-ga-ap-chao';

-- ---- Quiz gợi ý -------------------------------------------------------
INSERT INTO quiz_questions(question_text, is_multiple, sort_order) VALUES
 ('Mục tiêu của bạn là gì?', false, 1),
 ('Bạn đang theo chế độ ăn nào?', false, 2),
 ('Bạn dị ứng với thành phần nào?', true, 3);

INSERT INTO quiz_options(question_id, option_text, icon, sort_order)
SELECT q.id, o.t, o.i, o.n FROM quiz_questions q JOIN (VALUES
 (1,'Giảm cân','scale',1),(1,'Tăng cơ','dumbbell',2),(1,'Ăn sạch','leaf',3),
 (2,'Keto','flame',1),(2,'Thuần chay','sprout',2),(2,'Không đường','candy-off',3),
 (3,'Hạt cây (hạnh nhân, óc chó)','nut',1),(3,'Gluten','wheat',2),(3,'Không dị ứng','check',3)
) AS o(qn, t, i, n) ON q.sort_order = o.qn;

INSERT INTO quiz_option_effects(option_id, effect_type, diet_id, weight)
SELECT o.id, 'boost_diet', d.id, 3 FROM quiz_options o JOIN quiz_questions q ON q.id = o.question_id
JOIN diets d ON (o.option_text = 'Keto' AND d.code = 'keto')
             OR (o.option_text = 'Thuần chay' AND d.code = 'vegan')
             OR (o.option_text = 'Không đường' AND d.code = 'sugar_free')
             OR (o.option_text = 'Giảm cân' AND d.code IN ('low_calorie','low_carb'))
             OR (o.option_text = 'Tăng cơ' AND d.code = 'high_protein')
             OR (o.option_text = 'Ăn sạch' AND d.code = 'eat_clean');
INSERT INTO quiz_option_effects(option_id, effect_type, allergen_id)
SELECT o.id, 'exclude_allergen', a.id FROM quiz_options o JOIN allergens a
  ON (o.option_text LIKE 'Hạt cây%' AND a.code = 'tree_nut') OR (o.option_text = 'Gluten' AND a.code = 'gluten');

-- ---- Huy hiệu & thử thách ----------------------------------------------
INSERT INTO badges(code, name, description, points_reward) VALUES
 ('clean_7','Chiến binh ăn sạch','Hoàn thành thử thách 7 ngày ăn sạch',200),
 ('first_order','Đơn đầu tiên','Hoàn tất đơn hàng đầu tiên',50);
INSERT INTO challenges(name, description, duration_days, points_reward, badge_id)
SELECT '7 ngày ăn sạch','Check-in mỗi ngày khi ăn đúng thực đơn lành mạnh',7,200,id FROM badges WHERE code = 'clean_7';

-- ---- Blog, banner, cấu hình ----------------------------------------------
INSERT INTO blog_categories(name, slug) VALUES ('Dinh dưỡng','dinh-duong'),('Công thức','cong-thuc');
INSERT INTO blog_posts(category_id, author_id, title, slug, summary, content, expert_reviewer, is_published, published_at)
SELECT bc.id, u.id, 'Yến mạch: ăn thế nào cho đúng?', 'yen-mach-an-the-nao-cho-dung',
       'Hướng dẫn chọn và chế biến yến mạch.', 'Nội dung bài viết mẫu về yến mạch...', 'ThS. Dinh dưỡng Nguyễn Hà', true, now()
FROM blog_categories bc, users u WHERE bc.slug = 'dinh-duong' AND u.email = 'admin@nutrio.vn';

INSERT INTO banners(title, image_url, link_url, position) VALUES
 ('Ăn sạch, sống khỏe','https://placehold.co/1440x500?text=NUTRIO','/products','home_hero');

INSERT INTO settings(key, value, description) VALUES
 ('store', '{"name":"NUTRIO","hotline":"1900 0000","email":"hello@nutrio.vn"}', 'Thông tin cửa hàng'),
 ('loyalty', '{"vnd_per_point":1000,"point_value_vnd":100,"max_redeem_percent":50}', 'Quy đổi điểm'),
 ('checkout', '{"vat_percent":0,"cod_enabled":true}', 'Cấu hình thanh toán');

-- ---- Hồ sơ sức khỏe mẫu (trigger tự tính BMI/BMR/TDEE) --------------------
INSERT INTO health_profiles(user_id, height_cm, weight_kg, target_weight_kg, activity_level, goal)
SELECT id, 160, 58, 52, 'light', 'lose_weight' FROM users WHERE email = 'lan@example.com';
INSERT INTO user_allergens(user_id, allergen_id, severity)
SELECT u.id, a.id, 2 FROM users u, allergens a WHERE u.email = 'lan@example.com' AND a.code = 'peanut';
INSERT INTO user_diets(user_id, diet_id)
SELECT u.id, d.id FROM users u, diets d WHERE u.email = 'lan@example.com' AND d.code = 'eat_clean';

-- ---- 1 đơn hàng mẫu hoàn tất (để dashboard có số liệu) --------------------
WITH new_order AS (
    INSERT INTO orders(user_id, status, payment_status, payment_method, shipping_method_id,
                       ship_recipient_name, ship_phone, ship_province, ship_district, ship_ward, ship_street,
                       subtotal, shipping_fee, total_amount, points_earned, placed_at)
    SELECT u.id, 'completed', 'paid', 'cod', sm.id,
           'Nguyễn Thị Lan','0900000002','TP. Hồ Chí Minh','Quận 1','Phường Bến Nghé','12 Nguyễn Huệ',
           89000 + 129000, 0, 218000, 218, now() - interval '3 days'
    FROM users u, shipping_methods sm WHERE u.email = 'lan@example.com' AND sm.code = 'standard'
    RETURNING id, user_id
), items AS (
    INSERT INTO order_items(order_id, product_id, variant_id, product_name, variant_name, sku, unit_price, quantity, line_total)
    SELECT o.id, p.id, v.id, p.name, v.name, v.sku, v.price, 1, v.price
    FROM new_order o JOIN product_variants v ON v.sku IN ('OAT-500','ALM-250') JOIN products p ON p.id = v.product_id
    RETURNING id
)
INSERT INTO loyalty_transactions(user_id, txn_type, points, order_id, description)
SELECT user_id, 'earn', 218, id, 'Tích điểm đơn hàng' FROM new_order;

-- Hết file seed
