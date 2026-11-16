-- Thêm nhiều ảnh phụ cho tất cả 16 sản phẩm (mỗi sản phẩm 3-4 ảnh: bao bì, cận cảnh kết cấu, cách thưởng thức, nông trại)

DELETE FROM product_images WHERE sort_order > 0;

INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
-- 1. Hạt chia
(1, 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=85', 'Hạt chia hữu cơ pha sinh tố & sữa chua', 1, false),
(1, 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=800&q=85', 'Cận cảnh hạt chia căng bóng giàu Omega-3', 2, false),
(1, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85', 'Bữa sáng lành mạnh cùng hạt chia và yến mạch', 3, false),

-- 2. Hạnh nhân rang không muối
(2, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=85', 'Hạnh nhân sấy mộc vàng ươm nguyên vị', 1, false),
(2, 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=800&q=85', 'Cận cảnh hạt hạnh nhân giòn rụm không muối', 2, false),
(2, 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85', 'Bao bì hũ thủy tinh kín khí tiện lợi', 3, false),

-- 3. Yến mạch cán dẹt
(3, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85', 'Yến mạch nấu cháo dinh dưỡng cùng quả mọng', 1, false),
(3, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85', 'Cận cảnh vảy yến mạch nguyên cám dày dặn', 2, false),
(3, 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=800&q=85', 'Yến mạch ngâm qua đêm (Overnight Oats)', 3, false),

-- 4. Sữa óc chó không đường
(4, 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=85', 'Sữa hạt óc chó rót tươi mát lành', 1, false),
(4, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=85', 'Nguyên liệu quả óc chó nguyên bản 100%', 2, false),
(4, 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85', 'Thức uống dinh dưỡng cho não bộ & tim mạch', 3, false),

-- 5. Ức gà áp chảo sốt tiêu
(5, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=85', 'Thớ ức gà mềm mọng không khô xơ', 1, false),
(5, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85', 'Khẩu phần ăn kèm salad rau mầm tươi xanh', 2, false),
(5, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85', 'Hộp meal-prep đóng gói hút chân không chuẩn lạnh', 3, false),

-- 6. Granola không đường
(6, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85', 'Granola nướng mật ong tự nhiên giòn rụm', 1, false),
(6, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85', 'Từng cụm hạt lớn hạt nhỏ hòa quyện', 2, false),
(6, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85', 'Dùng cùng sữa chua Hy Lạp cho vóc dáng thon gọn', 3, false),

-- 7. Hạt Macca Tây Nguyên Nứt Vỏ
(7, 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85', 'Nhân macca trắng sữa tròn đều béo ngậy', 1, false),
(7, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=85', 'Hạt nứt vỏ tự nhiên kèm dụng cụ tách vỏ', 2, false),
(7, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85', 'Nguồn gốc nông trường Đắk Lắk đạt chuẩn VietGAP', 3, false),

-- 8. Hạt Điều Bình Phước Rang Củi
(8, 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85', 'Hạt điều size A cồ to đều chắc nịch', 1, false),
(8, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=85', 'Hương vị rang củi truyền thống đậm đà khó quên', 2, false),
(8, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85', 'Đóng gói hút chân không giữ trọn độ giòn thơm', 3, false),

-- 9. Hạt Óc Chó Vàng Chandler Mỹ
(9, 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85', 'Nhân óc chó vàng nhạt hình cánh bướm hoàn chỉnh', 1, false),
(9, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=85', 'Vị bùi béo tự nhiên, không đắng chát', 2, false),
(9, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=85', 'Lựa chọn số 1 cho mẹ bầu và phát triển trí não trẻ nhỏ', 3, false),

-- 10. Hạt Bí Xanh Ấn Độ Sấy Mộc
(10, 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=800&q=85', 'Hạt bí xanh mẩy bóng đều hạt, giàu kẽm', 1, false),
(10, 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=800&q=85', 'Sấy nhiệt độ thấp 60 độ C bảo toàn khoáng chất', 2, false),
(10, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=85', 'Rắc salad, nấu súp hoặc ăn liền tiện lợi', 3, false),

-- 11. Hạt Dinh Dưỡng Thập Cẩm Eat Clean
(11, 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85', 'Kết hợp hài hòa 6 loại hạt thượng hạng', 1, false),
(11, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=85', 'Tỷ lệ hạt chuẩn khoa học cân đối đa lượng', 2, false),
(11, 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=85', 'Món snack healthy cho dân văn phòng và tập luyện', 3, false),

-- 12. Ngũ Cốc Hạt Mầm Năng Lượng
(12, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85', 'Hạt mầm hoạt hóa gia tăng lượng enzyme tiêu hóa', 1, false),
(12, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85', 'Hương vị thơm bùi tự nhiên, chỉ số GI cực thấp', 2, false),
(12, 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=85', 'Phù hợp người ăn kiêng, tiểu đường & cao huyết áp', 3, false),

-- 13. Sữa Hạt Điều Hạnh Nhân Nguyên Chất
(13, 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=85', 'Chất sữa sánh mịn sánh quyện thơm lừng', 1, false),
(13, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=85', 'Không chứa đường tinh luyện hay hương liệu nhân tạo', 2, false),
(13, 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85', 'Chai thủy tinh vô trùng thân thiện với môi trường', 3, false),

-- 14. Thanh Protein Bar Hạt Hạnh Nhân
(14, 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=85', 'Thanh dinh dưỡng nguyên hạt hạt óc chó và hạnh nhân', 1, false),
(14, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85', 'Cung cấp 15g đạm sạch phục hồi cơ bắp thần tốc', 2, false),
(14, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85', 'Tiện lợi mang theo khi đi gym, chạy bộ, leo núi', 3, false),

-- 15. Salad Ức Gà Sốt Mè Rang
(15, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=85', 'Rau xanh giòn ngọt kết hợp sốt mè rang bùi thơm', 1, false),
(15, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85', 'Thịt gà áp chảo vàng đều không dầu mỡ', 2, false),
(15, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85', 'Đóng hộp kèm túi đá giữ lạnh đảm bảo độ tươi giòn', 3, false),

-- 16. Thịt Bò Áp Chảo Măng Tây Clean
(16, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85', 'Bò nạc mềm ngọt tiêu chuẩn VietGAP sạch', 1, false),
(16, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=85', 'Măng tây giòn ngọt giàu chất xơ và vitamin K', 2, false),
(16, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85', 'Chế biến sẵn sàng hâm nóng chỉ 2 phút là dùng ngay', 3, false);
