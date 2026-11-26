/**
 * NUTRIO demo catalogue. Nutrition values are per 100 g and based on public food-composition
 * data (USDA FoodData Central) for the raw ingredient; they are demo values, not lab results.
 */
export interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  short: string;
  description: string;
  origin: string;
  shelfLifeDays: number;
  featured?: boolean;
  images: string[];
  variants: { sku: string; name: string; g: number; price: number; compare?: number; cost: number; stock: number; expiryDays: number; reorder?: number; unit?: string }[];
  n: [kcal: number, protein: number, carb: number, sugar: number, fiber: number, fat: number, satFat: number, sodium: number];
  serving: number;
  allergens?: [code: string, rel: 'contains' | 'may_contain'][];
  diets: string[];
  certs?: string[];
  ingredients: [name: string, pct?: number][];
  storage?: string;
  usage?: string;
}

const P = '/images/products/';
const STORE = 'Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp. Sau khi mở túi, đóng kín zip và dùng trong 30 ngày.';
const DAILY = 'Dùng trực tiếp 25–30 g/ngày (khoảng một nắm tay) như bữa phụ, hoặc rắc lên salad, sữa chua, yến mạch.';

export const CATEGORY_TREE: { name: string; slug: string; description: string; image: string; children?: { name: string; slug: string; description: string; image: string }[] }[] = [
  {
    name: 'Các loại hạt',
    slug: 'cac-loai-hat',
    description: 'Hạt dinh dưỡng tuyển chọn, sấy mộc, không chất bảo quản.',
    image: `${P}mixed-3.jpg`,
    children: [
      { name: 'Hạt Macca', slug: 'hat-macca', description: 'Macca Đắk Lắk & Úc – béo bùi, giàu chất béo không bão hòa đơn.', image: `${P}macadamia-2.jpg` },
      { name: 'Hạnh nhân', slug: 'hanh-nhan', description: 'Hạnh nhân California giàu vitamin E, đạm và chất xơ.', image: `${P}almond-3.jpg` },
      { name: 'Óc chó', slug: 'oc-cho', description: 'Óc chó Mỹ – nguồn omega-3 thực vật (ALA) dồi dào.', image: `${P}walnut-1.jpg` },
      { name: 'Hạt điều', slug: 'hat-dieu', description: 'Hạt điều Bình Phước loại A cồ, rang củi thơm giòn.', image: `${P}cashew-1.jpg` },
      { name: 'Mix hạt dinh dưỡng', slug: 'mix-hat-dinh-duong', description: 'Phối trộn cân bằng nhiều loại hạt & trái cây sấy.', image: `${P}mixed-2.jpg` },
    ],
  },
  { name: 'Granola', slug: 'granola', description: 'Granola nướng giòn từ yến mạch, hạt và mật ong.', image: `${P}granola-2.jpg` },
  { name: 'Combo dinh dưỡng', slug: 'combo-dinh-duong', description: 'Hộp quà & bộ sản phẩm tiết kiệm theo nhu cầu.', image: `${P}mixed-4.jpg` },
  {
    name: 'Dinh dưỡng chuyên biệt',
    slug: 'dinh-duong-chuyen-biet',
    description: 'Sản phẩm theo mục tiêu: tập luyện, Keto, Eat Clean.',
    image: `${P}pumpkin-1.jpg`,
    children: [
      { name: 'Dành cho người tập gym', slug: 'tap-gym', description: 'Giàu đạm thực vật, hỗ trợ phục hồi cơ bắp.', image: `${P}pumpkin-1.jpg` },
      { name: 'Sản phẩm Keto', slug: 'keto', description: 'Ít tinh bột, giàu chất béo tốt cho chế độ Keto.', image: `${P}macadamia-3.jpg` },
      { name: 'Sản phẩm Eat Clean', slug: 'eat-clean', description: 'Nguyên liệu sạch, tối giản cho bữa ăn lành mạnh.', image: `${P}oats-1.jpg` },
    ],
  },
];

export const PRODUCTS: SeedProduct[] = [
  // ---------------- Macca ----------------
  {
    slug: 'hat-macca-dak-lak-nut-vo', name: 'Hạt Macca Đắk Lắk nứt vỏ sấy mộc', category: 'hat-macca', featured: true,
    short: 'Macca Đắk Lắk size 22–25 mm, nứt vỏ sẵn, kèm dụng cụ tách vỏ. Béo bùi tự nhiên, không tẩm đường.',
    description: 'Macca được thu hoạch tại các nông hộ đối tác ở Krông Năng (Đắk Lắk), phơi tự nhiên rồi sấy ở 60°C trong 48 giờ để giữ trọn vị béo ngậy. Hạt được tạo đường nứt sẵn giúp tách vỏ dễ dàng.\n\nMacca chứa hàm lượng chất béo không bão hòa đơn (omega-7, omega-9) cao, phù hợp chế độ Keto và người cần bổ sung năng lượng lành mạnh.',
    origin: 'Việt Nam (Đắk Lắk)', shelfLifeDays: 270, images: [`${P}macadamia-2.jpg`, `${P}macadamia-3.jpg`],
    variants: [
      { sku: 'MAC-DL-250', name: 'Túi 250g', g: 250, price: 189000, compare: 219000, cost: 120000, stock: 160, expiryDays: 200 },
      { sku: 'MAC-DL-500', name: 'Túi 500g', g: 500, price: 349000, cost: 225000, stock: 120, expiryDays: 220 },
    ],
    n: [718, 7.9, 13.8, 4.6, 8.6, 75.8, 12.1, 5], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['keto', 'low_carb', 'vegan', 'eat_clean'], certs: ['vietgap'],
    ingredients: [['Hạt macca', 100]], storage: STORE, usage: 'Dùng dụng cụ kèm theo để tách vỏ. Khẩu phần khuyến nghị 20–30 g/ngày.',
  },
  {
    slug: 'nhan-macca-rang-muoi-hong', name: 'Nhân Macca rang muối hồng Himalaya', category: 'hat-macca',
    short: 'Nhân macca tách sẵn, rang chín với chút muối hồng – tiện lợi cho dân văn phòng.',
    description: 'Nhân macca loại 1 được rang lửa nhỏ với một lượng rất ít muối hồng Himalaya, giữ độ giòn và vị ngọt béo tự nhiên. Không dầu chiên, không chất bảo quản.',
    origin: 'Việt Nam (Lâm Đồng)', shelfLifeDays: 210, images: [`${P}macadamia-3.jpg`, '/images/nuts/macadamia_hero.jpg'],
    variants: [
      { sku: 'MAC-SALT-200', name: 'Hũ 200g', g: 200, price: 229000, cost: 150000, stock: 90, expiryDays: 150 },
      { sku: 'MAC-SALT-400', name: 'Hũ 400g', g: 400, price: 429000, compare: 459000, cost: 290000, stock: 12, expiryDays: 160, reorder: 15 },
    ],
    n: [718, 7.9, 13.8, 4.6, 8.6, 75.8, 12.1, 180], serving: 25, allergens: [['tree_nut', 'contains']], diets: ['keto', 'low_carb', 'vegan'],
    ingredients: [['Nhân macca', 99], ['Muối hồng Himalaya', 1]], storage: STORE, usage: DAILY,
  },
  {
    slug: 'macca-uc-size-lon', name: 'Macca Úc size lớn nguyên vỏ', category: 'hat-macca',
    short: 'Macca nhập khẩu Úc, hạt to đều 25 mm+, vỏ mỏng, nhân trắng ngà.',
    description: 'Giống macca A16 trồng tại Queensland (Úc), nổi tiếng với nhân to và hàm lượng dầu cao. Phù hợp làm quà biếu.',
    origin: 'Úc', shelfLifeDays: 300, images: [`${P}macadamia-2.jpg`],
    variants: [{ sku: 'MAC-AU-500', name: 'Hộp 500g', g: 500, price: 299000, compare: 329000, cost: 205000, stock: 70, expiryDays: 250 }],
    n: [718, 7.9, 13.8, 4.6, 8.6, 75.8, 12.1, 5], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['keto', 'low_carb', 'vegan'],
    ingredients: [['Hạt macca', 100]], storage: STORE, usage: DAILY,
  },
  // ---------------- Hạnh nhân ----------------
  {
    slug: 'hanh-nhan-my-rang-moc', name: 'Hạnh nhân Mỹ rang mộc', category: 'hanh-nhan', featured: true,
    short: 'Hạnh nhân California loại Nonpareil, rang mộc không muối – giàu vitamin E và đạm.',
    description: 'Hạnh nhân nhập khẩu từ thung lũng Central Valley (California), rang ở nhiệt độ thấp để giữ dưỡng chất. 30 g hạnh nhân cung cấp khoảng 6 g đạm, 3,5 g chất xơ và gần một nửa nhu cầu vitamin E mỗi ngày.',
    origin: 'Mỹ (California)', shelfLifeDays: 300, images: [`${P}almond-3.jpg`, `${P}mixed-4.jpg`],
    variants: [
      { sku: 'ALM-US-250', name: 'Túi 250g', g: 250, price: 139000, cost: 88000, stock: 200, expiryDays: 240 },
      { sku: 'ALM-US-500', name: 'Túi 500g', g: 500, price: 259000, compare: 289000, cost: 170000, stock: 150, expiryDays: 260 },
    ],
    n: [579, 21.2, 21.6, 4.4, 12.5, 49.9, 3.8, 1], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['keto', 'low_carb', 'vegan', 'eat_clean', 'high_protein'], certs: ['haccp', 'non_gmo'],
    ingredients: [['Hạnh nhân', 100]], storage: STORE, usage: DAILY,
  },
  {
    slug: 'hanh-nhan-lat-say-gion', name: 'Hạnh nhân lát sấy giòn', category: 'hanh-nhan',
    short: 'Hạnh nhân cắt lát mỏng 1 mm, sấy giòn – hoàn hảo để làm bánh, rắc granola, sữa chua.',
    description: 'Hạnh nhân đã bóc vỏ lụa, cắt lát đều tay và sấy giòn. Tiện cho làm bánh tuile, florentine hoặc rắc lên bữa sáng.',
    origin: 'Mỹ (California)', shelfLifeDays: 240, images: [`${P}almond-2.jpg`],
    variants: [{ sku: 'ALM-SLICE-200', name: 'Túi 200g', g: 200, price: 109000, cost: 70000, stock: 110, expiryDays: 180 }],
    n: [576, 21, 21.7, 4.8, 12.2, 49.4, 3.7, 1], serving: 15, allergens: [['tree_nut', 'contains']], diets: ['keto', 'vegan', 'gluten_free'],
    ingredients: [['Hạnh nhân bóc vỏ lụa', 100]], storage: STORE, usage: 'Rắc 10–15 g lên sữa chua, salad hoặc dùng làm bánh.',
  },
  {
    slug: 'hanh-nhan-nguyen-vo-rang-bo', name: 'Hạnh nhân nguyên vỏ rang bơ', category: 'hanh-nhan',
    short: 'Hạnh nhân vỏ mỏng rang bơ thơm lừng, tách bằng tay dễ dàng.',
    description: 'Hạnh nhân nguyên vỏ được rang cùng bơ lạt, cho vị béo thơm đặc trưng – món ăn vặt quen thuộc dịp lễ Tết.',
    origin: 'Mỹ (California)', shelfLifeDays: 180, images: [`${P}mixed-4.jpg`],
    variants: [{ sku: 'ALM-BUTTER-500', name: 'Túi 500g', g: 500, price: 159000, cost: 98000, stock: 85, expiryDays: 120 }],
    n: [590, 20.5, 21, 4.5, 11.5, 51.5, 5.2, 60], serving: 30, allergens: [['tree_nut', 'contains'], ['milk', 'contains']], diets: ['vegetarian'],
    ingredients: [['Hạnh nhân nguyên vỏ', 97], ['Bơ lạt', 3]], storage: STORE, usage: DAILY,
  },
  // ---------------- Óc chó ----------------
  {
    slug: 'nhan-oc-cho-vang-my', name: 'Nhân óc chó vàng Mỹ', category: 'oc-cho', featured: true,
    short: 'Nhân óc chó vàng nhạt (Light Halves) – vị bùi, không đắng, giàu omega-3 ALA.',
    description: 'Nhân óc chó loại Light Halves tuyển chọn, tách sẵn. Óc chó là loại hạt có hàm lượng omega-3 thực vật (ALA) cao nhất – khoảng 2,5 g trong mỗi 28 g – hỗ trợ sức khỏe tim mạch và trí não.',
    origin: 'Mỹ (California)', shelfLifeDays: 240, images: [`${P}walnut-1.jpg`, `${P}walnut-2.jpg`],
    variants: [
      { sku: 'WAL-US-250', name: 'Túi 250g', g: 250, price: 169000, cost: 110000, stock: 140, expiryDays: 190 },
      { sku: 'WAL-US-500', name: 'Túi 500g', g: 500, price: 319000, compare: 349000, cost: 210000, stock: 100, expiryDays: 200 },
    ],
    n: [654, 15.2, 13.7, 2.6, 6.7, 65.2, 6.1, 2], serving: 28, allergens: [['tree_nut', 'contains']], diets: ['keto', 'vegan', 'eat_clean', 'low_carb'], certs: ['non_gmo'],
    ingredients: [['Nhân óc chó', 100]], storage: 'Bảo quản ngăn mát tủ lạnh sau khi mở để tránh ôi dầu.', usage: DAILY,
  },
  {
    slug: 'oc-cho-do-nguyen-vo', name: 'Óc chó đỏ nguyên vỏ', category: 'oc-cho',
    short: 'Giống óc chó đỏ hiếm, nhân màu đỏ rượu vang, vị ngọt thanh.',
    description: 'Óc chó đỏ (Red Walnut) có lớp vỏ lụa màu đỏ đặc trưng, vị ít chát và ngọt hơn óc chó thường.',
    origin: 'Mỹ', shelfLifeDays: 300, images: [`${P}walnut-2.jpg`],
    variants: [{ sku: 'WAL-RED-500', name: 'Túi 500g', g: 500, price: 199000, cost: 130000, stock: 9, expiryDays: 240, reorder: 12 }],
    n: [654, 15.2, 13.7, 2.6, 6.7, 65.2, 6.1, 2], serving: 28, allergens: [['tree_nut', 'contains']], diets: ['keto', 'vegan'],
    ingredients: [['Óc chó nguyên vỏ', 100]], storage: STORE, usage: DAILY,
  },
  {
    slug: 'oc-cho-chandler-size-lon', name: 'Óc chó Chandler size lớn', category: 'oc-cho',
    short: 'Giống Chandler cao cấp, vỏ mỏng tách bằng tay, nhân to đầy.',
    description: 'Chandler là giống óc chó phổ biến nhất California nhờ nhân sáng màu, chiếm gần 50% trọng lượng hạt.',
    origin: 'Mỹ (California)', shelfLifeDays: 300, images: [`${P}walnut-1.jpg`],
    variants: [{ sku: 'WAL-CHAN-1KG', name: 'Túi 1kg', g: 1000, price: 459000, compare: 499000, cost: 310000, stock: 60, expiryDays: 260 }],
    n: [654, 15.2, 13.7, 2.6, 6.7, 65.2, 6.1, 2], serving: 28, allergens: [['tree_nut', 'contains']], diets: ['keto', 'vegan'],
    ingredients: [['Óc chó nguyên vỏ', 100]], storage: STORE, usage: DAILY,
  },
  // ---------------- Hạt điều ----------------
  {
    slug: 'hat-dieu-binh-phuoc-rang-muoi', name: 'Hạt điều Bình Phước rang muối (A cồ)', category: 'hat-dieu', featured: true,
    short: 'Điều Bình Phước loại A cồ (W240), rang củi còn vỏ lụa, muối vừa phải.',
    description: 'Hạt điều được thu mua trực tiếp tại Bù Đăng (Bình Phước), rang bằng củi theo phương pháp truyền thống giúp hạt giòn, thơm và giữ lớp vỏ lụa giàu chất chống oxy hóa.',
    origin: 'Việt Nam (Bình Phước)', shelfLifeDays: 180, images: [`${P}cashew-1.jpg`, `${P}cashew-2.jpg`],
    variants: [
      { sku: 'CAS-BP-250', name: 'Hũ 250g', g: 250, price: 129000, cost: 82000, stock: 180, expiryDays: 130 },
      { sku: 'CAS-BP-500', name: 'Hũ 500g', g: 500, price: 239000, compare: 265000, cost: 158000, stock: 130, expiryDays: 140 },
    ],
    n: [574, 15.3, 32.7, 5, 3, 46.4, 9.2, 200], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['vegan', 'high_protein'], certs: ['vietgap', 'haccp'],
    ingredients: [['Hạt điều', 99], ['Muối', 1]], storage: STORE, usage: DAILY,
  },
  {
    slug: 'hat-dieu-say-moc', name: 'Hạt điều sấy mộc không muối', category: 'hat-dieu',
    short: 'Điều trắng bóc vỏ lụa, sấy mộc không muối – phù hợp người cần hạn chế natri.',
    description: 'Lựa chọn lý tưởng cho người ăn kiêng muối hoặc dùng xay sữa hạt, làm sốt hạt điều thuần chay.',
    origin: 'Việt Nam (Bình Phước)', shelfLifeDays: 180, images: [`${P}cashew-1.jpg`],
    variants: [{ sku: 'CAS-RAW-500', name: 'Túi 500g', g: 500, price: 229000, cost: 150000, stock: 95, expiryDays: 140 }],
    n: [553, 18.2, 30.2, 5.9, 3.3, 43.8, 7.8, 12], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['vegan', 'eat_clean', 'gluten_free'],
    ingredients: [['Hạt điều', 100]], storage: STORE, usage: 'Ăn trực tiếp hoặc ngâm 4 giờ rồi xay cùng nước để làm sữa/sốt hạt điều.',
  },
  {
    slug: 'hat-dieu-rang-toi-ot', name: 'Hạt điều rang tỏi ớt', category: 'hat-dieu',
    short: 'Vị cay nhẹ, thơm tỏi – món nhâm nhi cuối tuần.',
    description: 'Hạt điều rang cùng tỏi phi và ớt bột. Lưu ý: hàm lượng natri cao hơn dòng sấy mộc.',
    origin: 'Việt Nam (Bình Phước)', shelfLifeDays: 150, images: [`${P}cashew-2.jpg`],
    variants: [{ sku: 'CAS-CHILI-200', name: 'Hũ 200g', g: 200, price: 99000, cost: 62000, stock: 75, expiryDays: 11 }],
    n: [570, 15, 33, 6, 3.2, 45, 8.9, 380], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['vegan'],
    ingredients: [['Hạt điều', 92], ['Tỏi', 4], ['Ớt bột', 2], ['Muối', 2]], storage: STORE, usage: DAILY,
  },
  // ---------------- Granola ----------------
  {
    slug: 'granola-sieu-hat-mat-ong', name: 'Granola siêu hạt mật ong', category: 'granola', featured: true,
    short: '45% hạt & quả sấy, nướng giòn với mật ong hoa cà phê. Ăn liền với sữa chua hoặc sữa hạt.',
    description: 'Yến mạch Úc nướng cùng hạnh nhân, macca, hạt bí, hạt hướng dương và nam việt quất sấy, tạo vị ngọt nhẹ từ mật ong hoa cà phê Đắk Lắk. Không dùng đường tinh luyện.',
    origin: 'Việt Nam', shelfLifeDays: 180, images: [`${P}granola-2.jpg`, `${P}granola-1.jpg`],
    variants: [
      { sku: 'GRA-HONEY-300', name: 'Túi 300g', g: 300, price: 139000, cost: 80000, stock: 170, expiryDays: 140 },
      { sku: 'GRA-HONEY-500', name: 'Túi 500g', g: 500, price: 209000, compare: 229000, cost: 125000, stock: 120, expiryDays: 150 },
    ],
    n: [471, 10, 60, 18, 7, 21, 3, 25], serving: 45, allergens: [['tree_nut', 'contains'], ['gluten', 'may_contain']], diets: ['eat_clean', 'vegetarian'], certs: ['haccp'],
    ingredients: [['Yến mạch', 45], ['Hạnh nhân', 12], ['Mật ong', 12], ['Hạt bí', 8], ['Macca', 6], ['Nam việt quất sấy', 8], ['Dầu dừa', 5], ['Hạt hướng dương', 4]],
    storage: STORE, usage: 'Dùng 40–50 g với 150 ml sữa chua hoặc sữa hạt cho bữa sáng.',
  },
  {
    slug: 'granola-socola-den', name: 'Granola socola đen 70%', category: 'granola',
    short: 'Granola nướng cùng cacao nguyên chất và socola đen 70% – bữa sáng cho tín đồ chocolate.',
    description: 'Vị đắng nhẹ của cacao Bến Tre kết hợp hạnh nhân và yến mạch giòn. Ít ngọt hơn granola socola thông thường.',
    origin: 'Việt Nam', shelfLifeDays: 180, images: [`${P}granola-1.jpg`],
    variants: [{ sku: 'GRA-CHOC-400', name: 'Túi 400g', g: 400, price: 169000, cost: 98000, stock: 90, expiryDays: 140 }],
    n: [480, 11, 58, 15, 8, 22, 6, 40], serving: 45, allergens: [['tree_nut', 'contains'], ['gluten', 'may_contain'], ['milk', 'may_contain']], diets: ['vegetarian'],
    ingredients: [['Yến mạch', 50], ['Socola đen 70%', 12], ['Hạnh nhân', 12], ['Mật ong', 10], ['Bột cacao', 6], ['Dầu dừa', 6], ['Muối biển', 0.5]],
    storage: STORE, usage: 'Dùng với sữa tươi không đường hoặc sữa chua Hy Lạp.',
  },
  // ---------------- Mix hạt ----------------
  {
    slug: 'mix-5-loai-hat-dinh-duong', name: 'Mix 5 loại hạt dinh dưỡng', category: 'mix-hat-dinh-duong', featured: true,
    short: 'Macca, hạnh nhân, óc chó, hạt điều và hạt bí – cân bằng đạm, chất béo tốt và khoáng chất.',
    description: 'Công thức phối trộn do chuyên gia dinh dưỡng NUTRIO đề xuất: tỉ lệ cân đối giữa hạt giàu omega-3 (óc chó), giàu vitamin E (hạnh nhân), giàu magie (hạt bí) và chất béo không bão hòa đơn (macca).',
    origin: 'Việt Nam', shelfLifeDays: 210, images: [`${P}mixed-3.jpg`, `${P}mixed-2.jpg`],
    variants: [
      { sku: 'MIX5-300', name: 'Hũ 300g', g: 300, price: 179000, cost: 112000, stock: 190, expiryDays: 170 },
      { sku: 'MIX5-500', name: 'Hũ 500g', g: 500, price: 289000, compare: 319000, cost: 185000, stock: 140, expiryDays: 180 },
    ],
    n: [610, 17, 20, 4, 7, 53, 6.5, 6], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['vegan', 'eat_clean', 'low_carb', 'keto'], certs: ['haccp'],
    ingredients: [['Hạnh nhân', 25], ['Hạt điều', 25], ['Óc chó', 20], ['Macca', 15], ['Hạt bí xanh', 15]], storage: STORE, usage: DAILY,
  },
  {
    slug: 'daily-nuts-30-goi', name: 'Daily Nuts – 30 gói hạt mỗi ngày', category: 'mix-hat-dinh-duong',
    short: '30 gói x 25 g chia sẵn khẩu phần: hạt + trái cây sấy, khoảng 130 kcal/gói.',
    description: 'Giải pháp kiểm soát khẩu phần: mỗi gói 25 g gồm hạnh nhân, điều, óc chó, nho khô và nam việt quất. Mang theo dễ dàng, không lo ăn quá đà.',
    origin: 'Việt Nam', shelfLifeDays: 180, images: [`${P}mixed-4.jpg`, `${P}mixed-1.jpg`],
    variants: [{ sku: 'DAILY-30', name: 'Hộp 30 gói x 25g', g: 750, price: 299000, compare: 349000, cost: 190000, stock: 110, expiryDays: 150, unit: 'hộp' }],
    n: [520, 14, 35, 18, 6, 38, 4, 8], serving: 25, allergens: [['tree_nut', 'contains']], diets: ['vegan', 'eat_clean'],
    ingredients: [['Hạnh nhân', 25], ['Hạt điều', 20], ['Óc chó', 20], ['Nho khô', 20], ['Nam việt quất sấy', 15]], storage: STORE, usage: '1 gói/ngày vào bữa phụ sáng hoặc chiều.',
  },
  {
    slug: 'trail-mix-hat-trai-cay-say', name: 'Trail mix hạt & trái cây sấy', category: 'mix-hat-dinh-duong',
    short: 'Đậu phộng, hạt điều, nho khô, xoài sấy – nạp năng lượng nhanh khi leo núi, chạy bộ.',
    description: 'Hỗn hợp năng lượng cao dành cho hoạt động ngoài trời. Có chứa đậu phộng.',
    origin: 'Việt Nam', shelfLifeDays: 150, images: [`${P}mixed-1.jpg`],
    variants: [{ sku: 'TRAIL-400', name: 'Túi 400g', g: 400, price: 149000, cost: 88000, stock: 80, expiryDays: 100 }],
    n: [480, 11, 48, 30, 6, 29, 4.5, 60], serving: 40, allergens: [['peanut', 'contains'], ['tree_nut', 'contains']], diets: ['vegetarian'],
    ingredients: [['Đậu phộng rang', 30], ['Hạt điều', 20], ['Nho khô', 25], ['Xoài sấy', 15], ['Hạt bí', 10]], storage: STORE, usage: 'Dùng 30–40 g trước hoặc trong khi vận động dài.',
  },
  {
    slug: 'hat-de-cuoi-my-rang-muoi', name: 'Hạt dẻ cười Mỹ rang muối', category: 'mix-hat-dinh-duong',
    short: 'Pistachio California tự nứt miệng, rang muối nhẹ, nhân xanh đậm.',
    description: 'Hạt dẻ cười là một trong những loại hạt có tỉ lệ đạm cao (21%) và ít calo hơn đa số loại hạt khác.',
    origin: 'Mỹ (California)', shelfLifeDays: 270, images: [`${P}pistachio-1.jpg`],
    variants: [
      { sku: 'PIS-US-250', name: 'Túi 250g', g: 250, price: 179000, cost: 118000, stock: 120, expiryDays: 220 },
      { sku: 'PIS-US-500', name: 'Túi 500g', g: 500, price: 339000, cost: 225000, stock: 90, expiryDays: 230 },
    ],
    n: [572, 21, 28, 7.7, 10.6, 45.8, 5.9, 310], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['high_protein', 'vegan'],
    ingredients: [['Hạt dẻ cười', 99], ['Muối', 1]], storage: STORE, usage: DAILY,
  },
  // ---------------- Gym ----------------
  {
    slug: 'hat-bi-xanh-tach-vo', name: 'Hạt bí xanh tách vỏ (Pepitas)', category: 'tap-gym', featured: true,
    short: '30% đạm thực vật, giàu magie & kẽm – lựa chọn số 1 cho người tập luyện.',
    description: 'Hạt bí xanh nhập khẩu, tách vỏ, sấy giòn. Một khẩu phần 30 g cung cấp khoảng 9 g đạm và 40% nhu cầu magie mỗi ngày, hỗ trợ co cơ và phục hồi.',
    origin: 'Canada', shelfLifeDays: 270, images: [`${P}pumpkin-1.jpg`],
    variants: [{ sku: 'PUMP-250', name: 'Túi 250g', g: 250, price: 99000, cost: 60000, stock: 150, expiryDays: 220 }],
    n: [559, 30.2, 10.7, 1.4, 6, 49, 8.7, 7], serving: 30, diets: ['high_protein', 'keto', 'vegan', 'gluten_free', 'eat_clean'], certs: ['organic'],
    ingredients: [['Hạt bí xanh', 100]], storage: STORE, usage: 'Ăn trực tiếp sau tập hoặc rắc lên salad, cháo yến mạch.',
  },
  {
    slug: 'thanh-nang-luong-hat-yen-mach', name: 'Thanh năng lượng hạt & yến mạch (10 thanh)', category: 'tap-gym',
    short: '20 g đạm/100 g, ngọt từ chà là – ăn nhẹ trước buổi tập 30 phút.',
    description: 'Thanh năng lượng ép lạnh từ yến mạch, hạnh nhân, đậu phộng, chà là và protein đậu Hà Lan. Mỗi thanh 35 g ~150 kcal.',
    origin: 'Việt Nam', shelfLifeDays: 120, images: [`${P}granola-3.jpg`],
    variants: [{ sku: 'BAR-10', name: 'Hộp 10 thanh x 35g', g: 350, price: 189000, cost: 110000, stock: 14, expiryDays: 80, reorder: 20, unit: 'hộp' }],
    n: [430, 20, 45, 14, 7, 18, 3, 120], serving: 35, allergens: [['tree_nut', 'contains'], ['peanut', 'contains'], ['gluten', 'contains'], ['soy', 'may_contain']], diets: ['high_protein'],
    ingredients: [['Yến mạch', 30], ['Chà là', 25], ['Đậu phộng', 15], ['Hạnh nhân', 12], ['Protein đậu Hà Lan', 12], ['Mật ong', 6]], storage: 'Bảo quản dưới 25°C.', usage: 'Dùng 1 thanh trước hoặc sau tập 30 phút.',
  },
  {
    slug: 'bo-hanh-nhan-nguyen-chat', name: 'Bơ hạnh nhân nguyên chất không đường', category: 'tap-gym',
    short: '100% hạnh nhân rang xay mịn, không đường, không dầu cọ.',
    description: 'Bơ hạnh nhân xay từ hạnh nhân rang, không thêm đường, muối hay dầu. Phết bánh mì nguyên cám, trộn sinh tố hoặc chấm táo.',
    origin: 'Việt Nam', shelfLifeDays: 240, images: [`${P}almond-3.jpg`],
    variants: [{ sku: 'ALMBUT-250', name: 'Hũ 250g', g: 250, price: 149000, cost: 92000, stock: 100, expiryDays: 200, unit: 'hũ' }],
    n: [614, 21, 19, 4.4, 10, 55.5, 4.2, 7], serving: 16, allergens: [['tree_nut', 'contains']], diets: ['high_protein', 'keto', 'vegan', 'sugar_free', 'gluten_free'],
    ingredients: [['Hạnh nhân rang', 100]], storage: 'Khuấy đều trước khi dùng. Dầu tách lớp là hiện tượng tự nhiên.', usage: '1–2 thìa (16–32 g) mỗi lần.',
  },
  // ---------------- Keto ----------------
  {
    slug: 'granola-keto-khong-yen-mach', name: 'Granola Keto không yến mạch', category: 'keto', featured: true,
    short: 'Chỉ 4 g carb ròng/khẩu phần: hạt, dừa sấy, quế – không yến mạch, không đường.',
    description: 'Phiên bản granola dành riêng cho Keto: nền hạnh nhân, macca, hạt bí, dừa sấy và hạt chia, tạo ngọt bằng erythritol. Không gluten.',
    origin: 'Việt Nam', shelfLifeDays: 180, images: [`${P}granola-3.jpg`, `${P}mixed-3.jpg`],
    variants: [{ sku: 'GRA-KETO-300', name: 'Túi 300g', g: 300, price: 189000, cost: 115000, stock: 100, expiryDays: 140 }],
    n: [580, 16, 14, 3, 10, 50, 9, 30], serving: 40, allergens: [['tree_nut', 'contains']], diets: ['keto', 'low_carb', 'gluten_free', 'sugar_free'],
    ingredients: [['Hạnh nhân', 30], ['Dừa sấy', 20], ['Hạt bí', 15], ['Macca', 15], ['Hạt chia', 10], ['Erythritol', 7], ['Quế', 1]], storage: STORE, usage: 'Dùng 40 g với sữa hạt không đường.',
  },
  {
    slug: 'mix-hat-keto', name: 'Mix hạt Keto (macca – hồ đào – hạnh nhân)', category: 'keto',
    short: 'Tổ hợp hạt có tỉ lệ chất béo cao, carb thấp – chuẩn macro Keto.',
    description: 'Ba loại hạt có lượng carb ròng thấp nhất được phối trộn, giúp duy trì trạng thái ketosis.',
    origin: 'Việt Nam', shelfLifeDays: 210, images: [`${P}mixed-2.jpg`],
    variants: [{ sku: 'MIX-KETO-300', name: 'Hũ 300g', g: 300, price: 229000, cost: 148000, stock: 85, expiryDays: 170 }],
    n: [690, 10, 12, 4, 8.5, 70, 8, 3], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['keto', 'low_carb', 'sugar_free', 'vegan'],
    ingredients: [['Macca', 40], ['Hồ đào', 30], ['Hạnh nhân', 30]], storage: STORE, usage: DAILY,
  },
  {
    slug: 'bot-hanh-nhan-sieu-min', name: 'Bột hạnh nhân siêu mịn', category: 'keto',
    short: 'Bột hạnh nhân bóc vỏ, xay siêu mịn – thay bột mì cho bánh Keto, không gluten.',
    description: 'Dùng làm bánh macaron, bánh mì Keto, pancake ít carb.',
    origin: 'Mỹ (California)', shelfLifeDays: 240, images: [`${P}almond-2.jpg`],
    variants: [{ sku: 'ALMFLOUR-500', name: 'Túi 500g', g: 500, price: 189000, cost: 120000, stock: 70, expiryDays: 190 }],
    n: [600, 21, 20, 4, 10, 53, 4, 1], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['keto', 'gluten_free', 'low_carb'],
    ingredients: [['Hạnh nhân bóc vỏ', 100]], storage: STORE, usage: 'Thay thế 1:1 bột mì trong công thức bánh Keto (có thể cần thêm trứng).',
  },
  // ---------------- Eat Clean ----------------
  {
    slug: 'yen-mach-can-vo-uc', name: 'Yến mạch cán vỡ Úc (Quick oats)', category: 'eat-clean',
    short: 'Yến mạch nguyên cám cán vỡ, nấu chín trong 3 phút – giàu beta-glucan.',
    description: 'Yến mạch Úc 100% nguyên cám. Beta-glucan trong yến mạch giúp no lâu và hỗ trợ kiểm soát cholesterol.',
    origin: 'Úc', shelfLifeDays: 365, images: [`${P}oats-1.jpg`],
    variants: [{ sku: 'OAT-QUICK-1KG', name: 'Túi 1kg', g: 1000, price: 119000, cost: 70000, stock: 160, expiryDays: 300 }],
    n: [389, 16.9, 66.3, 1, 10.6, 6.9, 1.2, 2], serving: 40, allergens: [['gluten', 'may_contain']], diets: ['eat_clean', 'vegan', 'high_protein'], certs: ['organic', 'non_gmo'],
    ingredients: [['Yến mạch nguyên cám', 100]], storage: STORE, usage: 'Nấu 40 g với 200 ml nước/sữa trong 3 phút, hoặc ngâm qua đêm.',
  },
  {
    slug: 'sua-hat-macca-khong-duong', name: 'Sữa hạt macca không đường', category: 'eat-clean',
    short: 'Sữa macca nguyên chất 12% hạt, không đường, thanh trùng – 45 kcal/100 ml.',
    description: 'Sữa hạt tươi làm mỗi ngày từ macca và nước lọc, không chất bảo quản. Bảo quản lạnh.',
    origin: 'Việt Nam', shelfLifeDays: 7, images: [`${P}macadamia-3.jpg`],
    variants: [{ sku: 'MILK-MAC-1L', name: 'Chai 1 lít', g: 1000, price: 89000, cost: 52000, stock: 40, expiryDays: 6, unit: 'chai' }],
    n: [45, 0.9, 1.2, 0.3, 0.5, 4.2, 0.7, 30], serving: 200, allergens: [['tree_nut', 'contains']], diets: ['vegan', 'sugar_free', 'low_calorie', 'keto'],
    ingredients: [['Nước lọc', 88], ['Hạt macca', 12]], storage: 'Bảo quản 2–6°C, dùng trong 3 ngày sau khi mở.', usage: 'Lắc đều trước khi dùng.',
  },
  // ---------------- Combo products ----------------
  {
    slug: 'hop-qua-6-loai-hat-cao-cap', name: 'Hộp quà 6 loại hạt cao cấp', category: 'combo-dinh-duong', featured: true,
    short: '6 hũ thủy tinh: macca, hạnh nhân, óc chó, điều, hạt dẻ cười, mix trái cây – quà biếu sang trọng.',
    description: 'Hộp gỗ thông khắc logo NUTRIO, gồm 6 hũ 200 g. Kèm thiệp viết tay theo yêu cầu.',
    origin: 'Việt Nam', shelfLifeDays: 180, images: [`${P}mixed-3.jpg`, `${P}mixed-4.jpg`],
    variants: [{ sku: 'GIFT-6', name: 'Hộp 6 hũ (1,2kg)', g: 1200, price: 699000, compare: 799000, cost: 460000, stock: 45, expiryDays: 150, unit: 'hộp' }],
    n: [600, 16, 24, 6, 7, 50, 6.5, 60], serving: 30, allergens: [['tree_nut', 'contains']], diets: ['vegan'],
    ingredients: [['Macca', 17], ['Hạnh nhân', 17], ['Óc chó', 17], ['Hạt điều', 17], ['Hạt dẻ cười', 16], ['Mix trái cây sấy', 16]], storage: STORE, usage: DAILY,
  },
  {
    slug: 'set-an-vat-van-phong-7-ngay', name: 'Set ăn vặt văn phòng 7 ngày', category: 'combo-dinh-duong',
    short: '7 túi 40 g khác nhau cho 7 ngày làm việc – không ngán, đủ năng lượng.',
    description: 'Mỗi ngày một vị: macca, điều, mix keto, granola, hạt bí, trail mix, hạnh nhân.',
    origin: 'Việt Nam', shelfLifeDays: 150, images: [`${P}mixed-1.jpg`],
    variants: [{ sku: 'OFFICE-7', name: 'Set 7 túi x 40g', g: 280, price: 159000, cost: 95000, stock: 60, expiryDays: 120, unit: 'set' }],
    n: [560, 15, 30, 10, 7, 43, 6, 80], serving: 40, allergens: [['tree_nut', 'contains'], ['peanut', 'contains'], ['gluten', 'may_contain']], diets: ['vegetarian'],
    ingredients: [['Hỗn hợp hạt', 75], ['Granola', 15], ['Trái cây sấy', 10]], storage: STORE, usage: '1 túi/ngày.',
  },
];

/** Re-homing of the 6 products that already exist in 02_seed.sql. */
export const EXISTING_PRODUCTS: Record<string, { category: string; images: string[]; short?: string; description?: string; origin?: string; storage?: string; usage?: string }> = {
  'yen-mach-can-det': { category: 'eat-clean', images: [`${P}oats-1.jpg`], origin: 'Úc', storage: STORE, usage: 'Nấu cháo 5 phút hoặc ngâm qua đêm với sữa hạt.', description: 'Yến mạch nguyên hạt cán dẹt, giữ nguyên lớp cám giàu beta-glucan – nền tảng cho bữa sáng Eat Clean no lâu, ổn định đường huyết.' },
  'hanh-nhan-rang': { category: 'hanh-nhan', images: [`${P}almond-3.jpg`], origin: 'Mỹ (California)', storage: STORE, usage: DAILY },
  'hat-chia': { category: 'keto', images: ['/images/recipes/recipe-chia-jars.jpg'], origin: 'Úc', storage: STORE, usage: 'Ngâm 15 g hạt chia với 100 ml sữa hạt trong 15 phút để làm pudding.', description: 'Hạt chia đen Úc – giàu chất xơ hòa tan (34%) và omega-3 thực vật, nở gấp 10 lần khi ngâm nước giúp no lâu.' },
  'granola-khong-duong': { category: 'granola', images: [`${P}granola-2.jpg`], origin: 'Việt Nam', storage: STORE, usage: 'Dùng 45 g với sữa chua không đường.' },
  'sua-oc-cho-khong-duong': { category: 'oc-cho', images: [`${P}walnut-2.jpg`], origin: 'Việt Nam', storage: 'Bảo quản lạnh 2–6°C.', usage: 'Lắc đều trước khi dùng.' },
  'uc-ga-ap-chao': { category: 'tap-gym', images: ['/images/recipes/recipe-fresh-salad.jpg'], origin: 'Việt Nam', storage: 'Bảo quản lạnh 0–4°C, dùng trong 7 ngày.', usage: 'Hâm nóng bằng chảo hoặc lò vi sóng 1 phút.' },
};

export const BUNDLES = [
  { name: 'Combo Gym Protein', description: 'Hạt bí xanh + Bơ hạnh nhân + Thanh năng lượng: 3 nguồn đạm thực vật cho người tập luyện.', image: `${P}pumpkin-1.jpg`, price: 379000, items: [['PUMP-250', 1], ['ALMBUT-250', 1], ['BAR-10', 1]] as [string, number][] },
  { name: 'Combo Keto khởi đầu', description: 'Granola Keto + Mix hạt Keto + Hạt chia – đủ cho 2 tuần đầu Keto.', image: `${P}macadamia-3.jpg`, price: 449000, items: [['GRA-KETO-300', 1], ['MIX-KETO-300', 1], ['CHIA-200', 1]] as [string, number][] },
  { name: 'Combo Hạt cho mẹ bầu', description: 'Óc chó, hạnh nhân, macca – bổ sung DHA thực vật, vitamin E và chất béo tốt trong thai kỳ.', image: `${P}walnut-1.jpg`, price: 429000, items: [['WAL-US-250', 1], ['ALM-US-250', 1], ['MAC-DL-250', 1]] as [string, number][] },
];
