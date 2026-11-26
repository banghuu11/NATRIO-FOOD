type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export interface SeedRecipe {
  title: string;
  image: string;
  description: string;
  prep: number;
  cook: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  kcal: number;
  p: number;
  c: number;
  f: number;
  meals: Meal[];
  diets: string[];
  /** [name, qty, unit, sku?] – sku links the ingredient to a shop product */
  ingredients: [string, number | null, string | null, string?][];
  steps: string[];
}

const R = '/images/recipes/';

export const RECIPES: SeedRecipe[] = [
  {
    title: 'Granola sữa chua Hy Lạp & việt quất', image: `${R}recipe-meal-prep.jpg`, description: 'Bữa sáng 3 phút giàu đạm, chất xơ và vi khuẩn có lợi.', prep: 3, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 380, p: 18, c: 45, f: 14, meals: ['breakfast', 'snack'], diets: ['vegetarian', 'eat_clean'],
    ingredients: [['Granola siêu hạt mật ong', 50, 'g', 'GRA-HONEY-300'], ['Sữa chua Hy Lạp không đường', 150, 'g'], ['Việt quất tươi', 50, 'g'], ['Hạnh nhân lát', 10, 'g', 'ALM-SLICE-200']],
    steps: ['Cho sữa chua Hy Lạp vào ly.', 'Rắc granola và hạnh nhân lát lên trên.', 'Thêm việt quất, dùng ngay để granola còn giòn.'],
  },
  {
    title: 'Pudding hạt chia sữa macca & kiwi', image: `${R}recipe-chia-jars.jpg`, description: 'Pudding thuần chay giàu omega-3, chuẩn bị từ tối hôm trước.', prep: 5, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 320, p: 9, c: 35, f: 15, meals: ['breakfast', 'snack'], diets: ['vegan', 'eat_clean', 'gluten_free'],
    ingredients: [['Hạt chia', 25, 'g', 'CHIA-200'], ['Sữa hạt macca không đường', 200, 'ml', 'MILK-MAC-1L'], ['Kiwi', 1, 'quả'], ['Mật ong', 5, 'g']],
    steps: ['Khuấy hạt chia với sữa macca, để 5 phút rồi khuấy lại cho không vón.', 'Đậy kín, để ngăn mát ít nhất 4 giờ.', 'Xếp kiwi cắt lát, rưới chút mật ong khi dùng.'],
  },
  {
    title: 'Bánh mì nguyên cám bơ hạnh nhân & chuối', image: `${R}recipe-veranda.jpg`, description: 'Năng lượng bền vững cho buổi sáng bận rộn.', prep: 5, cook: 2, servings: 1, difficulty: 'easy',
    kcal: 450, p: 16, c: 52, f: 20, meals: ['breakfast'], diets: ['vegan'],
    ingredients: [['Bánh mì nguyên cám', 2, 'lát'], ['Bơ hạnh nhân nguyên chất', 30, 'g', 'ALMBUT-250'], ['Chuối', 1, 'quả'], ['Quế bột', null, 'chút']],
    steps: ['Nướng bánh mì 2 phút cho giòn.', 'Phết bơ hạnh nhân, xếp chuối cắt lát.', 'Rắc chút quế bột.'],
  },
  {
    title: 'Smoothie bowl chuối, yến mạch & hạt bí', image: `${R}recipe-breakfast.jpg`, description: 'Bowl mát lạnh, nhiều topping giòn ngon.', prep: 7, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 410, p: 13, c: 62, f: 13, meals: ['breakfast'], diets: ['vegan', 'eat_clean'],
    ingredients: [['Yến mạch cán vỡ', 40, 'g', 'OAT-QUICK-1KG'], ['Chuối đông lạnh', 1, 'quả'], ['Sữa hạt macca', 150, 'ml', 'MILK-MAC-1L'], ['Hạt bí xanh', 15, 'g', 'PUMP-250'], ['Granola socola đen', 20, 'g', 'GRA-CHOC-400']],
    steps: ['Xay yến mạch, chuối và sữa macca đến khi sánh mịn.', 'Đổ ra bát, rắc hạt bí và granola.', 'Có thể thêm dừa sấy hoặc trái cây theo mùa.'],
  },
  {
    title: 'Trứng ốp, bơ & salad macca (Keto)', image: `${R}recipe-cafe.jpg`, description: 'Bữa sáng Keto đầy đủ chất béo tốt, gần như không tinh bột.', prep: 5, cook: 5, servings: 1, difficulty: 'easy',
    kcal: 520, p: 22, c: 8, f: 44, meals: ['breakfast'], diets: ['keto', 'low_carb', 'gluten_free'],
    ingredients: [['Trứng gà', 2, 'quả'], ['Quả bơ', 0.5, 'quả'], ['Nhân macca rang muối', 20, 'g', 'MAC-SALT-200'], ['Rau xà lách', 50, 'g'], ['Dầu olive', 5, 'ml']],
    steps: ['Ốp lòng đào 2 quả trứng với chút dầu olive.', 'Cắt bơ, trộn cùng xà lách.', 'Rắc macca giã dập, nêm tiêu muối.'],
  },
  {
    title: 'Overnight oats hạnh nhân', image: `${R}recipe-yogurt-jar.jpg`, description: 'Bữa sáng ngâm qua đêm, chuẩn bị 5 phút.', prep: 5, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 420, p: 16, c: 52, f: 16, meals: ['breakfast'], diets: ['eat_clean', 'vegan'],
    ingredients: [], steps: [],
  },
  {
    title: 'Salad ức gà sốt mè rang & hạt điều', image: `${R}recipe-salad-bowl.jpg`, description: 'Salad no lâu: 42 g đạm, nhiều rau xanh.', prep: 10, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 520, p: 42, c: 30, f: 24, meals: ['lunch', 'dinner'], diets: ['high_protein', 'eat_clean'],
    ingredients: [['Ức gà áp chảo sốt tiêu', 150, 'g', 'CHK-200'], ['Xà lách, cà chua bi, dưa leo', 200, 'g'], ['Hạt điều sấy mộc', 20, 'g', 'CAS-RAW-500'], ['Sốt mè rang', 20, 'ml']],
    steps: ['Thái ức gà thành lát vừa ăn.', 'Trộn rau với sốt mè rang.', 'Xếp gà lên trên, rắc hạt điều.'],
  },
  {
    title: 'Salad củ dền, rau rocket & óc chó', image: '/images/banners/hero-eating-healthy.jpg', description: 'Vị ngọt củ dền, đắng nhẹ rocket và bùi béo óc chó.', prep: 10, cook: 20, servings: 1, difficulty: 'easy',
    kcal: 430, p: 12, c: 32, f: 28, meals: ['lunch', 'dinner'], diets: ['vegetarian', 'eat_clean'],
    ingredients: [['Củ dền luộc', 150, 'g'], ['Rau rocket', 60, 'g'], ['Nhân óc chó vàng', 25, 'g', 'WAL-US-250'], ['Phô mai feta', 30, 'g'], ['Giấm balsamic', 10, 'ml']],
    steps: ['Luộc củ dền 20 phút, để nguội và cắt múi cau.', 'Trộn rocket với giấm balsamic.', 'Thêm củ dền, óc chó rang sơ và phô mai feta.'],
  },
  {
    title: 'Salad đậu lăng, cà chua & hạnh nhân lát', image: `${R}recipe-lentil.jpg`, description: 'Món chay giàu đạm và chất xơ.', prep: 10, cook: 20, servings: 1, difficulty: 'easy',
    kcal: 480, p: 22, c: 55, f: 18, meals: ['lunch', 'dinner'], diets: ['vegan', 'high_protein'],
    ingredients: [['Đậu lăng', 70, 'g'], ['Cà chua bi', 100, 'g'], ['Hạnh nhân lát sấy giòn', 15, 'g', 'ALM-SLICE-200'], ['Chanh, dầu olive', 15, 'ml']],
    steps: ['Luộc đậu lăng 20 phút, để ráo.', 'Trộn với cà chua bi, nước cốt chanh, dầu olive.', 'Rắc hạnh nhân lát khi dùng.'],
  },
  {
    title: 'Cơm gạo lứt cá hồi áp chảo & bông cải', image: `${R}recipe-light-salad.jpg`, description: 'Bữa trưa giàu omega-3 và đạm chất lượng cao.', prep: 10, cook: 15, servings: 1, difficulty: 'medium',
    kcal: 610, p: 38, c: 58, f: 24, meals: ['lunch', 'dinner'], diets: ['eat_clean', 'high_protein'],
    ingredients: [['Cá hồi phi lê', 150, 'g'], ['Cơm gạo lứt', 150, 'g'], ['Bông cải xanh', 100, 'g'], ['Hạt bí xanh', 10, 'g', 'PUMP-250']],
    steps: ['Áp chảo cá hồi mỗi mặt 3 phút.', 'Hấp bông cải 4 phút.', 'Bày cơm, cá, rau và rắc hạt bí.'],
  },
  {
    title: 'Bowl rau củ nướng & sốt hạt điều', image: `${R}recipe-veg-salad.jpg`, description: 'Sốt hạt điều béo ngậy thay mayonnaise.', prep: 15, cook: 25, servings: 1, difficulty: 'medium',
    kcal: 540, p: 16, c: 60, f: 26, meals: ['lunch', 'dinner'], diets: ['vegan', 'gluten_free'],
    ingredients: [['Khoai lang, bí đỏ, ớt chuông', 300, 'g'], ['Diêm mạch (quinoa) chín', 100, 'g'], ['Hạt điều sấy mộc', 30, 'g', 'CAS-RAW-500'], ['Tỏi, chanh', null, null]],
    steps: ['Nướng rau củ 200°C trong 25 phút.', 'Xay hạt điều đã ngâm với tỏi, chanh, nước thành sốt.', 'Xếp quinoa, rau củ và rưới sốt.'],
  },
  {
    title: 'Ức gà áp chảo, khoai lang & salad', image: `${R}recipe-fresh-salad.jpg`, description: 'Bữa tối kinh điển của người tập gym.', prep: 5, cook: 15, servings: 1, difficulty: 'easy',
    kcal: 560, p: 45, c: 50, f: 16, meals: ['dinner', 'lunch'], diets: ['high_protein', 'eat_clean', 'gluten_free'],
    ingredients: [['Ức gà áp chảo sốt tiêu', 200, 'g', 'CHK-200'], ['Khoai lang', 200, 'g'], ['Rau xanh', 150, 'g'], ['Hạnh nhân rang mộc', 10, 'g', 'ALM-US-250']],
    steps: ['Hấp khoai lang 15 phút.', 'Hâm nóng ức gà.', 'Dọn cùng rau xanh, rắc hạnh nhân.'],
  },
  {
    title: 'Đậu hũ sốt nấm, cải thìa & mè rang', image: `${R}recipe-meal-prep.jpg`, description: 'Món chay nhẹ bụng cho bữa tối.', prep: 10, cook: 10, servings: 1, difficulty: 'easy',
    kcal: 430, p: 24, c: 30, f: 22, meals: ['dinner'], diets: ['vegan'],
    ingredients: [['Đậu hũ non', 200, 'g'], ['Nấm đông cô', 80, 'g'], ['Cải thìa', 150, 'g'], ['Mè rang', 5, 'g'], ['Nước tương', 10, 'ml']],
    steps: ['Áp chảo đậu hũ vàng hai mặt.', 'Xào nấm với nước tương, cho đậu hũ vào rim 3 phút.', 'Luộc cải thìa, rắc mè rang.'],
  },
  {
    title: 'Salad bò áp chảo Keto & macca', image: `${R}recipe-cafe.jpg`, description: 'Ít carb, nhiều đạm và chất béo tốt.', prep: 10, cook: 6, servings: 1, difficulty: 'medium',
    kcal: 590, p: 40, c: 10, f: 44, meals: ['dinner', 'lunch'], diets: ['keto', 'low_carb', 'gluten_free'],
    ingredients: [['Thăn bò', 150, 'g'], ['Rau mix', 120, 'g'], ['Mix hạt Keto', 20, 'g', 'MIX-KETO-300'], ['Dầu olive', 10, 'ml']],
    steps: ['Áp chảo bò lửa lớn mỗi mặt 2–3 phút, nghỉ 3 phút rồi thái lát.', 'Trộn rau với dầu olive.', 'Xếp bò và rắc hạt.'],
  },
  {
    title: 'Nắm hạt mỗi ngày 30 g', image: '/images/products/mixed-3.jpg', description: 'Bữa phụ chuẩn khuyến nghị: 30 g hạt mỗi ngày.', prep: 1, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 185, p: 5, c: 6, f: 16, meals: ['snack'], diets: ['vegan', 'keto', 'eat_clean'],
    ingredients: [['Mix 5 loại hạt dinh dưỡng', 30, 'g', 'MIX5-300']], steps: ['Đong 30 g hạt (khoảng một nắm tay) vào hộp nhỏ mang theo.'],
  },
  {
    title: 'Viên năng lượng chà là, yến mạch & hạnh nhân', image: `${R}recipe-fruity-breakfast.jpg`, description: 'Không cần lò nướng, bảo quản tủ lạnh 1 tuần.', prep: 15, cook: 0, servings: 4, difficulty: 'easy',
    kcal: 210, p: 6, c: 26, f: 10, meals: ['snack'], diets: ['vegan'],
    ingredients: [['Chà là bỏ hạt', 120, 'g'], ['Yến mạch cán vỡ', 80, 'g', 'OAT-QUICK-1KG'], ['Bơ hạnh nhân', 60, 'g', 'ALMBUT-250'], ['Bột cacao', 10, 'g']],
    steps: ['Xay chà là thành hỗn hợp dẻo.', 'Trộn đều với yến mạch, bơ hạnh nhân và cacao.', 'Vo thành 12 viên, để lạnh 30 phút.'],
  },
  {
    title: 'Sữa chua Hy Lạp, óc chó & mật ong', image: `${R}recipe-yogurt-jar.jpg`, description: 'Bữa phụ giàu đạm, omega-3.', prep: 2, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 230, p: 14, c: 18, f: 12, meals: ['snack', 'breakfast'], diets: ['vegetarian'],
    ingredients: [['Sữa chua Hy Lạp', 150, 'g'], ['Nhân óc chó vàng', 15, 'g', 'WAL-US-250'], ['Mật ong', 8, 'g']], steps: ['Cho sữa chua vào bát, thêm óc chó bẻ nhỏ và rưới mật ong.'],
  },
  {
    title: 'Hạt dẻ cười & táo giòn', image: '/images/products/pistachio-1.jpg', description: 'Bữa phụ 200 kcal, giàu chất xơ.', prep: 2, cook: 0, servings: 1, difficulty: 'easy',
    kcal: 200, p: 6, c: 24, f: 11, meals: ['snack'], diets: ['vegan', 'gluten_free'],
    ingredients: [['Hạt dẻ cười rang muối', 20, 'g', 'PIS-US-250'], ['Táo', 1, 'quả']], steps: ['Cắt táo thành miếng, ăn kèm hạt dẻ cười.'],
  },
];

export const POSTS: { title: string; category: 'dinh-duong' | 'cong-thuc'; cover: string; summary: string; reviewer: string; content: string }[] = [
  {
    title: 'Ăn bao nhiêu hạt mỗi ngày là đủ?', category: 'dinh-duong', cover: '/images/products/mixed-3.jpg', reviewer: 'ThS. Dinh dưỡng Nguyễn Hà',
    summary: 'Khẩu phần 30 g/ngày được nhiều nghiên cứu khuyến nghị. Vậy 30 g trông như thế nào và chọn loại hạt nào?',
    content: `Các loại hạt giàu chất béo không bão hòa, đạm thực vật, chất xơ và khoáng chất như magie, kẽm, vitamin E. Tuy nhiên hạt cũng rất giàu năng lượng: 100 g hạt cung cấp từ 550 đến 720 kcal.

## Khẩu phần khuyến nghị
Hướng dẫn dinh dưỡng của nhiều quốc gia và các nghiên cứu theo dõi dài hạn cho thấy khoảng 28–30 g hạt mỗi ngày (một nắm tay nhỏ) gắn liền với lợi ích cho tim mạch mà không làm tăng cân.

## 30 g hạt trông như thế nào?
- Khoảng 23 hạt hạnh nhân
- Khoảng 18 hạt điều
- Khoảng 14 nửa nhân óc chó
- Khoảng 10–12 hạt macca

## Mẹo để không ăn quá đà
Chia sẵn hạt vào hộp nhỏ hoặc dùng gói khẩu phần (như Daily Nuts 25 g), tránh ăn trực tiếp từ túi lớn. Ưu tiên hạt sấy mộc, không tẩm đường và hạn chế loại rang muối nếu bạn cần kiểm soát natri.

Lưu ý: nếu bạn có bệnh lý thận, sỏi hoặc dị ứng hạt, hãy hỏi ý kiến bác sĩ trước khi bổ sung.`,
  },
  {
    title: 'TDEE là gì? Cách tính nhu cầu calo cho người mới bắt đầu', category: 'dinh-duong', cover: '/images/banners/hero-harvest.jpg', reviewer: 'ThS. Dinh dưỡng Nguyễn Hà',
    summary: 'Hiểu BMR, TDEE và cách đặt mục tiêu calo an toàn khi giảm cân hoặc tăng cơ.',
    content: `BMR (Basal Metabolic Rate) là năng lượng cơ thể cần khi nghỉ ngơi hoàn toàn. TDEE (Total Daily Energy Expenditure) là tổng năng lượng tiêu hao mỗi ngày, bằng BMR nhân với hệ số vận động.

## Công thức Mifflin–St Jeor
- Nam: BMR = 10 × cân nặng (kg) + 6,25 × chiều cao (cm) − 5 × tuổi + 5
- Nữ: BMR = 10 × cân nặng (kg) + 6,25 × chiều cao (cm) − 5 × tuổi − 161

## Hệ số vận động
- Ít vận động: 1,2
- Nhẹ (1–3 buổi/tuần): 1,375
- Vừa (3–5 buổi/tuần): 1,55
- Nhiều (6–7 buổi/tuần): 1,725

## Đặt mục tiêu
Giảm cân an toàn: ăn thấp hơn TDEE khoảng 500 kcal để giảm ~0,5 kg/tuần. Tăng cơ: dư 250–300 kcal kết hợp tập kháng lực và đủ đạm (1,6–2,2 g/kg).

Bạn có thể dùng công cụ Hồ sơ sức khỏe của NUTRIO để tính tự động. Kết quả chỉ mang tính tham khảo.`,
  },
  {
    title: 'Hạt macca: lợi ích và cách chọn hạt ngon', category: 'dinh-duong', cover: '/images/products/macadamia-2.jpg', reviewer: 'KS. Thực phẩm Trần Minh',
    summary: 'Vì sao macca được gọi là "nữ hoàng các loại hạt" và cách nhận biết macca chất lượng.',
    content: `Macca chứa khoảng 76% chất béo, trong đó phần lớn là chất béo không bão hòa đơn – loại chất béo được khuyến khích thay thế chất béo bão hòa trong khẩu phần.

## Cách chọn macca ngon
- Vỏ có màu nâu đều, đường nứt rõ, không có đốm mốc.
- Nhân trắng ngà hoặc vàng nhạt, không có mùi dầu ôi.
- Lắc nhẹ không nghe tiếng nhân lọc cọc quá nhiều (nhân bị teo).

## Bảo quản
Macca giàu dầu nên dễ ôi khi gặp nhiệt và ánh sáng. Sau khi mở túi, hãy đóng kín và để nơi thoáng mát, hoặc ngăn mát tủ lạnh nếu dùng lâu.`,
  },
  {
    title: 'Chế độ Keto cho người Việt: nên ăn hạt gì?', category: 'dinh-duong', cover: '/images/products/macadamia-3.jpg', reviewer: 'ThS. Dinh dưỡng Nguyễn Hà',
    summary: 'Không phải loại hạt nào cũng "thân thiện" với Keto. Bảng so sánh carb ròng của các loại hạt phổ biến.',
    content: `Chế độ Keto giới hạn carbohydrate (thường dưới 20–50 g/ngày). Carb ròng = tổng carb − chất xơ.

## Carb ròng trên 30 g
- Hồ đào: ~1 g
- Macca: ~1,5 g
- Hạnh nhân: ~2,5 g
- Óc chó: ~2 g
- Hạt điều: ~8 g (nên hạn chế)
- Hạt dẻ cười: ~5 g

## Gợi ý
Ưu tiên macca, hồ đào, hạnh nhân và óc chó. Hạt bí và hạt chia cũng là lựa chọn tốt nhờ nhiều chất xơ. Keto không phù hợp với mọi người – hãy tham khảo bác sĩ nếu bạn có bệnh lý nền.`,
  },
  {
    title: 'Bữa sáng Eat Clean 5 phút với yến mạch & granola', category: 'cong-thuc', cover: '/images/recipes/recipe-chia-jars.jpg', reviewer: 'Bếp trưởng NUTRIO',
    summary: '3 công thức bữa sáng nhanh gọn cho người bận rộn, đủ đạm – xơ – chất béo tốt.',
    content: `Một bữa sáng cân bằng nên có nguồn tinh bột phức hợp, đạm và chất béo tốt để giữ no đến trưa.

## 1. Overnight oats
Ngâm 50 g yến mạch, 10 g hạt chia với 200 ml sữa hạt qua đêm. Sáng ra thêm hạnh nhân và trái cây.

## 2. Granola sữa chua
150 g sữa chua Hy Lạp + 50 g granola + quả mọng. Chỉ mất 3 phút.

## 3. Bánh mì bơ hạnh nhân
2 lát bánh mì nguyên cám, 1 thìa bơ hạnh nhân, chuối cắt lát.

Xem công thức chi tiết và thêm toàn bộ nguyên liệu vào giỏ chỉ với một chạm trong mục Công thức.`,
  },
  {
    title: 'Dị ứng hạt cây: dấu hiệu và cách mua sắm an toàn', category: 'dinh-duong', cover: '/images/products/walnut-1.jpg', reviewer: 'BS. Lê Thu Trang',
    summary: 'Dị ứng hạt cây khác dị ứng đậu phộng thế nào? Cách đọc nhãn "có thể chứa".',
    content: `Đậu phộng là cây họ đậu, còn hạnh nhân, óc chó, điều, macca... là hạt cây. Một người có thể dị ứng nhóm này mà không dị ứng nhóm kia, nhưng khoảng 30–40% người dị ứng đậu phộng cũng dị ứng ít nhất một loại hạt cây.

## Dấu hiệu thường gặp
Ngứa miệng, nổi mề đay, sưng môi, đau bụng, khó thở. Phản vệ là tình trạng cấp cứu – cần gọi 115 ngay.

## Mua sắm an toàn trên NUTRIO
- Khai báo thành phần dị ứng trong Hồ sơ sức khỏe: sản phẩm chứa chất đó sẽ được gắn cảnh báo đỏ và không được gợi ý cho bạn.
- Chú ý nhãn "Có thể chứa" – sản phẩm được chế biến chung dây chuyền.

Thông tin chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.`,
  },
];

export const PAGES: { slug: string; title: string; content: string }[] = [
  {
    slug: 'gioi-thieu', title: 'Về NUTRIO',
    content: `NUTRIO ra đời với mong muốn giúp người Việt ăn hạt đúng cách: đúng loại, đúng lượng, đúng nhu cầu.

## Sứ mệnh
Mang đến hạt dinh dưỡng và granola chất lượng cao, minh bạch nguồn gốc, kèm công cụ dinh dưỡng cá nhân hóa để mỗi người biết mình cần ăn bao nhiêu.

## Cam kết
- Nguồn hạt truy xuất được tới từng lô hàng.
- Sấy mộc, không chất bảo quản, không đường tinh luyện ở dòng sấy mộc.
- Thông tin dinh dưỡng rõ ràng cho từng sản phẩm.

## Liên hệ
Hotline 1900 6868 • Email hello@nutrio.vn • 123 Lê Lợi, Quận 1, TP. Hồ Chí Minh`,
  },
  {
    slug: 'chinh-sach-giao-hang', title: 'Chính sách giao hàng',
    content: `## Phạm vi
NUTRIO giao hàng toàn quốc qua đối tác vận chuyển.

## Phí & thời gian
- Giao tiêu chuẩn: 25.000đ, 1–3 ngày. Miễn phí cho đơn từ 300.000đ.
- Giao nhanh 2 giờ (nội thành TP.HCM): 35.000đ. Miễn phí cho đơn từ 500.000đ.
- Thành viên Silver được miễn phí giao tiêu chuẩn từ 200.000đ, Gold miễn phí mọi đơn.

## Kiểm tra hàng
Quý khách được kiểm tra ngoại quan kiện hàng trước khi thanh toán (đơn COD).`,
  },
  {
    slug: 'chinh-sach-doi-tra', title: 'Chính sách đổi trả',
    content: `## Điều kiện đổi trả
- Sản phẩm lỗi do nhà sản xuất, hư hỏng do vận chuyển, giao sai sản phẩm.
- Yêu cầu trong vòng 7 ngày kể từ ngày nhận hàng, kèm hình ảnh/video mở hộp.
- Sản phẩm thực phẩm đã mở bao bì không áp dụng đổi trả vì lý do cá nhân.

## Hoàn tiền
Hoàn tiền trong 3–5 ngày làm việc qua phương thức thanh toán ban đầu hoặc chuyển khoản.

## Hủy đơn
Quý khách có thể tự hủy đơn khi đơn ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận" trong mục Đơn hàng của tôi.`,
  },
  {
    slug: 'chinh-sach-bao-mat', title: 'Chính sách bảo mật',
    content: `NUTRIO chỉ thu thập thông tin cần thiết để xử lý đơn hàng và cá nhân hóa gợi ý dinh dưỡng.

## Dữ liệu sức khỏe
Thông tin chiều cao, cân nặng, dị ứng chỉ dùng để tính toán gợi ý cho chính bạn, không chia sẻ cho bên thứ ba.

## Bảo mật
Mật khẩu được mã hóa một chiều (bcrypt). Kết nối được bảo vệ bằng HTTPS khi triển khai thực tế.`,
  },
  {
    slug: 'huong-dan-mua-hang', title: 'Hướng dẫn mua hàng',
    content: `## 4 bước đặt hàng
1. Chọn sản phẩm và quy cách, nhấn "Thêm vào giỏ".
2. Mở giỏ hàng, chọn sản phẩm muốn thanh toán, nhập mã giảm giá nếu có.
3. Nhập thông tin nhận hàng, chọn phương thức vận chuyển và thanh toán.
4. Kiểm tra và xác nhận đặt hàng.

## Theo dõi đơn
Đăng nhập để xem trong "Đơn hàng của tôi", hoặc tra cứu bằng mã đơn + số điện thoại tại trang Tra cứu đơn hàng.`,
  },
];

/** Quiz: [question, multiple, options: [text, icon, effects, meta]] */
export const QUIZ: { q: string; multiple: boolean; options: { text: string; icon: string; diets?: [string, number][]; categories?: [string, number][]; allergens?: string[]; meta?: Record<string, unknown> }[] }[] = [
  {
    q: 'Mục tiêu sức khỏe chính của bạn là gì?', multiple: false,
    options: [
      { text: 'Giảm cân', icon: 'scale', diets: [['low_calorie', 3], ['low_carb', 2], ['high_protein', 1]] },
      { text: 'Giữ cân, ăn uống lành mạnh', icon: 'heart', diets: [['eat_clean', 3]] },
      { text: 'Tăng cân', icon: 'trending-up', diets: [['high_protein', 2]], categories: [['granola', 3], ['hat-macca', 2]] },
      { text: 'Tăng cơ', icon: 'dumbbell', diets: [['high_protein', 3]], categories: [['tap-gym', 3]] },
      { text: 'Kiểm soát đường huyết', icon: 'activity', diets: [['sugar_free', 3], ['diabetic_friendly', 3], ['low_carb', 2]] },
    ],
  },
  {
    q: 'Thói quen ăn uống của bạn gần nhất với?', multiple: false,
    options: [
      { text: 'Hay bỏ bữa sáng vì bận', icon: 'clock', categories: [['granola', 3], ['eat-clean', 1]] },
      { text: 'Thích ăn vặt giữa giờ', icon: 'cookie', categories: [['mix-hat-dinh-duong', 3]] },
      { text: 'Ăn chay / thuần chay', icon: 'sprout', diets: [['vegan', 3]] },
      { text: 'Đang theo Keto / low-carb', icon: 'flame', diets: [['keto', 4]], categories: [['keto', 2]] },
    ],
  },
  {
    q: 'Mức độ vận động hằng tuần của bạn?', multiple: false,
    options: [
      { text: 'Ít vận động (văn phòng)', icon: 'armchair', diets: [['low_calorie', 2]] },
      { text: 'Vừa phải (2–4 buổi)', icon: 'footprints', diets: [['eat_clean', 1]] },
      { text: 'Tập luyện cường độ cao', icon: 'zap', diets: [['high_protein', 3]], categories: [['tap-gym', 2]] },
    ],
  },
  {
    q: 'Ngân sách cho mỗi sản phẩm?', multiple: false,
    options: [
      { text: 'Dưới 150.000đ', icon: 'wallet', meta: { maxPrice: 150000 } },
      { text: '150.000đ – 300.000đ', icon: 'wallet', meta: { maxPrice: 300000 } },
      { text: 'Không giới hạn', icon: 'gem', meta: {} },
    ],
  },
  {
    q: 'Bạn cần tránh thành phần nào?', multiple: true,
    options: [
      { text: 'Hạt cây (hạnh nhân, óc chó, điều...)', icon: 'nut', allergens: ['tree_nut'] },
      { text: 'Đậu phộng', icon: 'ban', allergens: ['peanut'] },
      { text: 'Sữa', icon: 'milk', allergens: ['milk'] },
      { text: 'Gluten', icon: 'wheat', allergens: ['gluten'] },
      { text: 'Đậu nành', icon: 'bean', allergens: ['soy'] },
      { text: 'Không dị ứng gì', icon: 'check', meta: { exclusive: true } },
    ],
  },
];

export const REVIEW_TEXT: Record<number, string[]> = {
  5: [
    'Hạt rất tươi và giòn, đóng gói cẩn thận. Sẽ ủng hộ dài dài!',
    'Mình ăn mỗi sáng với sữa chua, vị bùi béo tự nhiên, không bị hôi dầu.',
    'Giao nhanh, hạt to đều, ăn không ngán. Đáng tiền.',
    'Chất lượng vượt mong đợi, nhân viên tư vấn khẩu phần rất nhiệt tình.',
    'Đang giảm cân nên rất thích có bảng calo rõ ràng, ăn đúng 30g/ngày là đủ no.',
  ],
  4: [
    'Ngon, giòn. Giá hơi cao một chút nhưng chất lượng tốt.',
    'Sản phẩm ổn, mong shop có thêm size nhỏ để dùng thử.',
    'Vị ngon, túi zip tiện. Giao hàng hơi chậm một ngày.',
  ],
  3: ['Tạm ổn, vài hạt hơi mềm. Có thể do thời tiết ẩm.', 'Vị được, nhưng mình thích loại rang mộc hơn.'],
  2: ['Hạt nhỏ hơn hình, chưa hài lòng lắm.'],
  1: ['Gói bị rách khi nhận, hạt bị ỉu.'],
};
