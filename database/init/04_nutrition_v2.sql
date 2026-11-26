-- =====================================================================
-- NUTRIO - UPGRADE: mục tiêu "Tăng cân", metadata cho quiz
-- Chỉ thêm mới / thay thế hàm, không xóa dữ liệu.
-- =====================================================================

-- 1. Mục tiêu tăng cân
ALTER TYPE goal_type ADD VALUE IF NOT EXISTS 'gain_weight';

-- 2. Calo mục tiêu theo mục tiêu (so sánh dạng text để dùng được giá trị enum mới ngay trong migration)
CREATE OR REPLACE FUNCTION fn_calc_target_calories(p_tdee numeric, p_goal goal_type)
RETURNS numeric LANGUAGE sql IMMUTABLE AS
$$ SELECT CASE p_goal::text
        WHEN 'lose_weight' THEN greatest(p_tdee - 500, 1200)
        WHEN 'gain_weight' THEN p_tdee + 400
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
    NEW.bmi := fn_calc_bmi(NEW.weight_kg, NEW.height_cm);
    IF NOT NEW.auto_calculate THEN RETURN NEW; END IF;

    SELECT gender, date_of_birth INTO v_gender, v_dob FROM users WHERE id = NEW.user_id;
    v_age := COALESCE(extract(year FROM age(v_dob))::int, 25);

    NEW.bmr  := fn_calc_bmr(COALESCE(v_gender,'other'), NEW.weight_kg, NEW.height_cm, v_age);
    NEW.tdee := round(NEW.bmr * fn_activity_factor(NEW.activity_level));
    NEW.daily_calorie_target := round(fn_calc_target_calories(NEW.tdee, NEW.goal));

    v_protein_factor := CASE NEW.goal::text
        WHEN 'lose_weight' THEN 2.0 WHEN 'gain_muscle' THEN 2.0 WHEN 'gain_weight' THEN 1.8 ELSE 1.6 END;
    NEW.daily_protein_g := round(NEW.weight_kg * v_protein_factor, 1);
    NEW.daily_fat_g     := round(NEW.daily_calorie_target * 0.25 / 9, 1);
    NEW.daily_carb_g    := round(greatest(NEW.daily_calorie_target - NEW.daily_protein_g * 4 - NEW.daily_fat_g * 9, 0) / 4, 1);
    NEW.daily_water_ml  := round(NEW.weight_kg * 35);
    RETURN NEW;
END
$$;

-- 3. Metadata cho lựa chọn quiz (ví dụ ngân sách: {"maxPrice": 200000})
ALTER TABLE quiz_options ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}';
