-- 1. Fix broken images for existing products
UPDATE product_images 
SET url = 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85' 
WHERE product_id = 2;

UPDATE product_images 
SET url = 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85' 
WHERE product_id = 6;

-- 2. Insert new products
INSERT INTO products (id, category_id, brand_id, name, slug, short_description, status, is_featured, nutri_score_grade, nutri_score_points, avg_rating, review_count, sold_count, origin_country)
OVERRIDING SYSTEM VALUE
VALUES
(7, 1, 1, 'Hạt Macca Tây Nguyên Nứt Vỏ', 'macca-nut-vo', '100% hạt macca Đắk Lắk sấy mộc, giàu chất béo tốt omega-7 và vitamin E', 'active', true, 'A', -2, 5.0, 24, 180, 'Việt Nam'),
(8, 1, 1, 'Hạt Điều Bình Phước Rang Củi', 'hat-dieu-rang-cui', 'Hạt điều nguyên hạt loại W240 rang mộc thơm bùi đậm vị', 'active', true, 'B', 0, 4.9, 31, 250, 'Việt Nam'),
(9, 1, 1, 'Hạt Óc Chó Vàng Chandler Mỹ', 'hat-oc-cho-vang', 'Hạt óc chó nhập khẩu Mỹ tách vỏ, giàu ALA omega-3 bổ não', 'active', false, 'A', -3, 4.8, 18, 120, 'Mỹ'),
(10, 1, 1, 'Hạt Bí Xanh Ấn Độ Sấy Mộc', 'hat-bi-xanh', 'Hạt bí xanh tách vỏ loại 1, giàu kẽm, magie và đạm thực vật', 'active', false, 'A', -4, 4.9, 15, 95, 'Ấn Độ'),
(11, 5, 1, 'Hạt Dinh Dưỡng Thập Cẩm Eat Clean', 'hat-dinh-duong-mix', 'Hỗn hợp 5 loại hạt sấy mộc nguyên vị không muối không đường', 'active', true, 'A', -3, 5.0, 42, 310, 'Việt Nam'),
(12, 1, 1, 'Ngũ Cốc Hạt Mầm Năng Lượng', 'ngu-coc-hat-mam', 'Ngũ cốc ủ mầm sấy nhiệt thấp, giữ nguyên enzyme và khoáng chất', 'active', false, 'A', -5, 4.7, 12, 85, 'Việt Nam'),
(13, 2, 1, 'Sữa Hạt Điều Hạnh Nhân Nguyên Chất', 'sua-hat-dieu-hanh-nhan', 'Sữa hạt thanh trùng tươi mát không đường, béo ngậy tự nhiên', 'active', false, 'A', -1, 4.9, 19, 140, 'Việt Nam'),
(14, 5, 1, 'Thanh Protein Bar Hạt Hạnh Nhân', 'thanh-protein-bar', 'Thanh đạm thực vật 15g protein, tiện lợi cho người tập gym', 'active', true, 'A', -2, 4.8, 28, 220, 'Việt Nam'),
(15, 3, 1, 'Salad Ức Gà Sốt Mè Rang', 'salad-uc-ga-sot-me', 'Rau củ tươi Đà Lạt kèm ức gà sấy xé sợi và sốt mè rang béo ngậy', 'active', false, 'A', -1, 4.9, 35, 190, 'Việt Nam'),
(16, 4, 1, 'Thịt Bò Áp Chảo Măng Tây Clean', 'thit-bo-ap-chao', 'Thịt bò Úc áp chảo tiêu hồng kèm măng tây xanh giàu đạm ít béo', 'active', true, 'A', -3, 5.0, 50, 420, 'Việt Nam')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  short_description = EXCLUDED.short_description,
  status = EXCLUDED.status,
  is_featured = EXCLUDED.is_featured,
  nutri_score_grade = EXCLUDED.nutri_score_grade;

-- Reset sequence for products id
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- 3. Insert Variants
INSERT INTO product_variants (id, product_id, sku, name, net_weight_g, price, compare_at_price, is_default, is_active)
OVERRIDING SYSTEM VALUE
VALUES
(7, 7, 'MAC-250', 'Hũ 250g', 250.0, 165000, 185000, true, true),
(8, 8, 'CAS-250', 'Hũ 250g', 250.0, 135000, 150000, true, true),
(9, 9, 'WAL-250', 'Hũ 250g', 250.0, 145000, 165000, true, true),
(10, 10, 'PUMP-200', 'Túi 200g', 200.0, 85000, 95000, true, true),
(11, 11, 'MIX-350', 'Hũ 350g', 350.0, 175000, 195000, true, true),
(12, 12, 'SPROUT-400', 'Túi 400g', 400.0, 110000, 125000, true, true),
(13, 13, 'MILK-CAS-1L', 'Chai 1 lít', 1000.0, 85000, NULL, true, true),
(14, 14, 'BAR-60', 'Thanh 60g', 60.0, 45000, NULL, true, true),
(15, 15, 'SALAD-300', 'Phần 300g', 300.0, 75000, NULL, true, true),
(16, 16, 'BEEF-250', 'Phần 250g', 250.0, 95000, NULL, true, true)
ON CONFLICT (id) DO UPDATE SET 
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price;

SELECT setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants));

-- 4. Insert Images
INSERT INTO product_images (id, product_id, url, is_primary, sort_order)
OVERRIDING SYSTEM VALUE
VALUES
(7, 7, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85', true, 0),
(8, 8, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85', true, 0),
(9, 9, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=85', true, 0),
(10, 10, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=85', true, 0),
(11, 11, 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=85', true, 0),
(12, 12, 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=85', true, 0),
(13, 13, 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85', true, 0),
(14, 14, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85', true, 0),
(15, 15, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85', true, 0),
(16, 16, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85', true, 0)
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url;

SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));

-- 5. Insert Nutrition Facts
INSERT INTO nutrition_facts (product_id, calories_kcal, protein_g, carbohydrate_g, fat_g, sugar_g, fiber_g)
VALUES
(7, 718.0, 8.00, 14.00, 65.00, 4.00, 9.00),
(8, 553.0, 18.00, 30.00, 44.00, 5.00, 3.30),
(9, 654.0, 15.00, 14.00, 65.00, 2.60, 6.70),
(10, 559.0, 30.00, 11.00, 49.00, 1.40, 6.00),
(11, 520.0, 17.00, 32.00, 40.00, 4.00, 8.50),
(12, 390.0, 15.00, 65.00, 10.00, 2.00, 11.00),
(13, 55.0, 2.50, 3.50, 4.20, 0.50, 0.80),
(14, 210.0, 15.00, 18.00, 8.00, 3.00, 5.00),
(15, 180.0, 22.00, 10.00, 6.00, 2.00, 4.00),
(16, 230.0, 28.00, 4.00, 11.00, 0.00, 2.50)
ON CONFLICT (product_id) DO UPDATE SET 
  calories_kcal = EXCLUDED.calories_kcal,
  protein_g = EXCLUDED.protein_g,
  carbohydrate_g = EXCLUDED.carbohydrate_g,
  fat_g = EXCLUDED.fat_g,
  sugar_g = EXCLUDED.sugar_g,
  fiber_g = EXCLUDED.fiber_g;

-- 6. Insert Product Diets
INSERT INTO product_diets (product_id, diet_id)
VALUES
(7, 1), (7, 2), (7, 3),        -- Macca: keto, eat_clean, vegan
(8, 2), (8, 3),                -- Cashew: eat_clean, vegan
(9, 1), (9, 2), (9, 3),        -- Walnut: keto, eat_clean, vegan
(10, 1), (10, 2), (10, 3), (10, 10), -- Pumpkin seed: keto, eat_clean, vegan, high_protein
(11, 2), (11, 3),              -- Mixed nuts: eat_clean, vegan
(12, 2), (12, 3),              -- Sprouted grains: eat_clean, vegan
(13, 3), (13, 7), (13, 8),     -- Nut milk: vegan, sugar_free, low_calorie
(14, 1), (14, 2), (14, 10),    -- Protein bar: keto, eat_clean, high_protein
(15, 2), (15, 5), (15, 10),    -- Salad: eat_clean, low_carb, high_protein
(16, 1), (16, 2), (16, 10)     -- Beef: keto, eat_clean, high_protein
ON CONFLICT DO NOTHING;
