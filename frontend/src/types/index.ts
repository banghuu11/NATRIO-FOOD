export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Nutrition {
  servingSizeG: number | null;
  caloriesKcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  sugarG: number;
  fiberG: number;
  saturatedFatG: number;
  sodiumMg: number;
}

export interface Variant {
  id: number;
  sku: string;
  name: string;
  netWeightG: number;
  unitLabel: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  isDefault: boolean;
  availableStock: number | null;
  nearestExpiry?: string | null;
}

export interface Tag {
  code: string;
  name: string;
}
export interface AllergenTag extends Tag {
  relation: 'contains' | 'may_contain';
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  category: { id: number; name: string; slug: string };
  nutriScoreGrade: string | null;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  createdAt: string;
  image: string;
  hoverImage: string | null;
  defaultVariant: Variant | null;
  variantCount: number;
  inStock: boolean | null;
  nutrition: Nutrition | null;
  diets: Tag[];
  allergens: AllergenTag[];
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  originCountry: string | null;
  storageInstruction: string | null;
  usageInstruction: string | null;
  shelfLifeDays: number | null;
  nutriScorePoints: number | null;
  images: { id: number; url: string; altText: string | null }[];
  variants: Variant[];
  nutritionFacts: Nutrition | null;
  ingredients: { name: string; percentage: number | null }[];
  certifications: { code: string; name: string; issuer: string | null; certificateNumber: string | null }[];
  brand: { name: string; country: string | null } | null;
  farm: { name: string; province: string | null; description: string | null } | null;
  ratingDistribution: { star: number; count: number }[];
  isWishlisted: boolean;
  healthierAlternatives: (ProductCard & { reason?: string | null })[];
}

export interface CategoryNode {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  children: CategoryNode[];
}

export interface CartLine {
  id: number;
  cartItemId: number;
  variantId: number | null;
  bundleId: number | null;
  productId: number | null;
  slug: string | null;
  name: string;
  variantName: string | null;
  image: string;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  weightG: number;
  availableStock: number;
  stockOk: boolean;
  isFlashSale: boolean;
  selected: boolean;
  nutrition: { kcal: number; protein: number; carb: number; fat: number; sugar: number; fiber: number };
}

export interface ShippingOption {
  id: number;
  code: string;
  name: string;
  carrier: string | null;
  fee: number;
  baseFee: number;
  freeShipThreshold: number | null;
  estHoursMin: number | null;
  estHoursMax: number | null;
}

export interface Quote {
  itemCount: number;
  subtotal: number;
  memberDiscount: number;
  couponDiscount: number;
  discountAmount: number;
  shippingFee: number;
  freeShipping: boolean;
  pointsUsed: number;
  pointsDiscount: number;
  maxPointsUsable: number;
  pointsBalance: number;
  totalAmount: number;
  pointsEarned: number;
  totalWeightG: number;
  coupon: { id: number; code: string; description: string | null; discountType: string } | null;
  couponError: string | null;
  tier: { code: string; name: string; discountPercent: number } | null;
  shippingMethod: { id: number; code: string; name: string } | null;
  shippingOptions: ShippingOption[];
  nutrition: { kcal: number; proteinG: number; carbG: number; fatG: number; sugarG: number; fiberG: number };
  allInStock: boolean;
}

export interface Cart {
  cartId: number | null;
  items: CartLine[];
  itemCount: number;
  couponCode: string | null;
  summary: Quote;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  referralCode?: string;
  roles: string[];
  permissions: string[];
  isStaff: boolean;
  loyalty?: { pointsBalance: number; lifetimePoints: number; tierCode: string | null; tier: string | null; discountPercent: number } | null;
  hasHealthProfile?: boolean;
}

export interface Address {
  id: number;
  label: string | null;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
  fullAddress: string;
}

export interface OrderItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  bundleId: number | null;
  slug: string | null;
  image: string | null;
  name: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  reviewed: boolean;
  canReview: boolean;
}

export interface BankTransfer {
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrUrl: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  statusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  canCancel: boolean;
  canRetryPayment: boolean;
  placedAt: string;
  deliveredAt: string | null;
  cancelReason: string | null;
  note: string | null;
  shipping: { recipientName: string; phone: string; address: string; method: string | null };
  pricing: { subtotal: number; discountAmount: number; couponCode: string | null; pointsUsed: number; pointsDiscount: number; shippingFee: number; totalAmount: number; pointsEarned: number };
  items: OrderItem[];
  history: { status: string; label: string; note: string | null; at: string }[];
  shipments: { carrier: string | null; trackingNumber: string | null; status: string; estimatedDeliveryAt: string | null; events: { status: string; location: string | null; description: string | null; at: string }[] }[];
  bankTransfer?: BankTransfer | null;
}

export interface Review {
  id: number;
  productId: number;
  product: { name: string; slug: string; image: string };
  rating: number;
  title: string | null;
  content: string | null;
  author: string;
  avatarUrl: string | null;
  variantName: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  votedHelpful: boolean;
  adminReply: string | null;
  status: string;
  images: string[];
  createdAt: string;
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string;
  prepMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  caloriesPerServing: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  mealTypes: string[];
  diets: Tag[];
  allergens: string[];
  shopIngredientCount: number;
}

export interface Bundle {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string;
  price: number;
  retailPrice: number;
  savePercent: number;
  availableStock: number;
  items: { name: string; slug: string; variantName: string; quantity: number }[];
}

export interface PostCard {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string;
  category: { name: string; slug: string } | null;
  author: string;
  expertReviewer: string | null;
  publishedAt: string;
  readMinutes: number;
}

export interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

export interface NutritionResult {
  bmi: number;
  bmiCategory: { code: string; label: string; advice: string };
  healthyWeightRange: { min: number; max: number };
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  macros: { proteinG: number; carbG: number; fatG: number; proteinPct: number; carbPct: number; fatPct: number };
  waterMl: number;
  explanations: Record<'bmi' | 'bmr' | 'tdee' | 'target' | 'macros', string>;
  disclaimer: string;
}

export interface PlanMeal {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealLabel: string;
  recipeId: number;
  slug: string;
  title: string;
  image: string;
  servings: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  prepMinutes: number;
}
export interface PlanDay {
  day: number;
  meals: PlanMeal[];
  totals: { kcal: number; proteinG: number; carbG: number; fatG: number };
}
