-- =====================================================================
-- NUTRIO - FIX: trigger tích điểm
-- Lỗi cũ: INSERT ... ON CONFLICT DO UPDATE kiểm tra CHECK (points_balance >= 0)
-- trên dòng INSERT dự kiến TRƯỚC khi xét xung đột, nên mọi giao dịch điểm âm
-- (dùng điểm khi đặt hàng, thu hồi điểm khi hoàn trả) đều bị lỗi.
-- Mới: UPDATE trước, chỉ INSERT khi chưa có tài khoản điểm.
-- Hạng thành viên tính theo điểm tích lũy (chỉ cộng khi "earn", trừ khi thu hồi "adjust" âm).
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_loyalty_apply() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE
    v_lifetime_delta int := CASE
        WHEN NEW.txn_type = 'earn' THEN greatest(NEW.points, 0)
        WHEN NEW.txn_type = 'adjust' THEN NEW.points
        ELSE 0 END;
BEGIN
    UPDATE loyalty_accounts
       SET points_balance  = points_balance + NEW.points,
           lifetime_points = greatest(lifetime_points + v_lifetime_delta, 0),
           updated_at      = now()
     WHERE user_id = NEW.user_id;

    IF NOT FOUND THEN
        INSERT INTO loyalty_accounts(user_id, points_balance, lifetime_points)
        VALUES (NEW.user_id, greatest(NEW.points, 0), greatest(v_lifetime_delta, 0));
    END IF;

    UPDATE loyalty_accounts la SET tier_id = (
        SELECT t.id FROM membership_tiers t
        WHERE t.min_points <= la.lifetime_points
        ORDER BY t.min_points DESC LIMIT 1)
    WHERE la.user_id = NEW.user_id;
    RETURN NEW;
END
$$;
