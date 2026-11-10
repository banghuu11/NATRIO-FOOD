/**
 * ============================================================================
 * NUTRIO FOOD - DESIGN SYSTEM & THEME CONFIGURATION
 * ============================================================================
 * File cấu hình quy chuẩn bảng màu, kích cỡ, viền bo và component preset
 * được thiết kế riêng cho toàn bộ hệ thống (đặc biệt phân hệ Quản trị Admin).
 *
 * Nguyên tắc thiết kế:
 *  1. Nền tảng: Trắng tinh tế (bg-white) trên nền canvas (bg-slate-50).
 *  2. Màu sắc chủ đạo: Xanh Ngọc Tươi (Emerald Green) thể hiện nông sản sạch.
 *  3. Màu sắc ngữ cảnh: Dùng có chọn lọc (Amber cho FEFO/hạn dùng, Rose cho huỷ/xoá).
 *  4. Kích cỡ & Viền bo: Đồng bộ bo tròn chuẩn 12px (rounded-xl) và 16px (rounded-2xl).
 *  5. 100% Tương thích với Lucide Icons và Tailwind CSS v4.
 *
 * Cách sử dụng:
 *  import { THEME, THEME_COMPONENTS, THEME_SIZES } from '@/constants/theme';
 *  hoặc import { THEME } from '@/config/theme';
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. MÃ MÀU NGUYÊN BẢN (HEX VALUES)
// Thích hợp dùng cho Canvas Three.js, inline-style, SVG hoặc biểu đồ
// ----------------------------------------------------------------------------
export const THEME_COLORS = {
  // Brand Emerald - Tông xanh chủ đạo
  brand: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669', // Màu nút bấm chính và điểm nhấn
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  // Slate Neutral - Nền, viền và chữ
  slate: {
    50: '#f8fafc', // Nền toàn trang (Page Canvas)
    100: '#f1f5f9', // Nền input, nút phụ
    200: '#e2e8f0', // Viền card, phân cách
    300: '#cbd5e1',
    400: '#94a3b8', // Placeholder, caption mờ
    500: '#64748b', // Text phụ, nhãn mô tả
    600: '#475569', // Text thứ cấp
    700: '#334155', // Text thân bài, label input
    800: '#1e293b', // Header cột, tiêu đề phụ
    900: '#0f172a', // Sidebar, Tiêu đề chính h1
    950: '#020617', // Sidebar header, viền sâu
  },

  // Functional: Cảnh báo FEFO & Ngày hết hạn (Amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },

  // Functional: Xoá, Nguy cấp & Huỷ đơn (Rose)
  danger: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
  },

  // Pure
  pure: {
    white: '#ffffff',
    black: '#000000',
  },
} as const;

// ----------------------------------------------------------------------------
// 2. KÍCH CỠ & QUY CÁCH CHUẨN (SIZES & SPACING)
// ----------------------------------------------------------------------------
export const THEME_SIZES = {
  // Kích thước chuẩn cho Icon Lucide
  icon: {
    xs: 'w-3 h-3', // 12px - phụ, micro badges
    sm: 'w-3.5 h-3.5', // 14px - text đi kèm nhỏ, pill
    md: 'w-4 h-4', // 16px - Chuẩn trong nút bấm và menu
    lg: 'w-5 h-5', // 20px - Header modal, tab lớn
    xl: 'w-6 h-6', // 24px - Tiêu đề lớn, warning dialog
    '2xl': 'w-8 h-8', // 32px - Spinner loading, biểu tượng to
  },

  // Kích cỡ Nút bấm (Button Padding & Text)
  button: {
    xs: 'px-2.5 py-1 text-[11px] rounded-lg',
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4 py-2 text-xs rounded-xl font-bold', // Chuẩn hành động
    lg: 'px-5 py-2.5 text-xs rounded-xl font-bold', // Nút chính nổi bật (CTA)
    xl: 'px-6 py-3 text-sm rounded-2xl font-bold',
  },

  // Kích cỡ Huy hiệu (Badge / Tag)
  badge: {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-md font-bold',
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-bold',
    md: 'text-xs px-2.5 py-1 rounded-lg font-bold',
  },

  // Bán kính bo góc (Border Radius)
  radius: {
    sm: 'rounded-lg', // 8px - tag nhỏ, ô phụ
    md: 'rounded-xl', // 12px - Nút bấm, input, tab, icon container (Chuẩn)
    lg: 'rounded-2xl', // 16px - Card dữ liệu, dialog con
    xl: 'rounded-3xl', // 24px - Modal lớn, popup
    full: 'rounded-full', // Tròn hoàn toàn
  },

  // Khối Avatar / Thumbnail ảnh
  avatar: {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl',
  },

  // Khung bố cục Admin (Layout Spacing)
  layout: {
    sidebarWidth: 'w-64', // 256px
    sidebarOffset: 'pl-64', // Bù lề trái cho nội dung
    headerHeight: 'h-16', // 64px
    contentPadding: 'p-6 md:p-8',
    gapSection: 'space-y-6 md:space-y-8',
    modalWidthSm: 'max-w-sm w-full',
    modalWidthMd: 'max-w-lg w-full',
    modalWidthLg: 'max-w-2xl w-full',
  },
} as const;

// ----------------------------------------------------------------------------
// 3. CÁC LỚP TAILWIND THÔNG DỤNG (CLASS ATOMS)
// ----------------------------------------------------------------------------
export const THEME_CLASSES = {
  // Nền (Backgrounds)
  bg: {
    canvas: 'bg-slate-50',
    card: 'bg-white',
    cardMuted: 'bg-slate-50/60',
    sidebar: 'bg-slate-900',
    sidebarDarker: 'bg-slate-950/40',
    header: 'bg-white',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryLight: 'bg-emerald-50',
    warningLight: 'bg-amber-50',
    dangerLight: 'bg-rose-50',
  },

  // Chữ (Typography Colors)
  text: {
    heading: 'text-slate-900 font-black',
    body: 'text-slate-700 font-medium',
    muted: 'text-slate-500',
    caption: 'text-slate-400',
    brand: 'text-emerald-600',
    brandDark: 'text-emerald-800',
    brandLight: 'text-emerald-400',
    warning: 'text-amber-800',
    danger: 'text-rose-700',
    inverse: 'text-white',
  },

  // Đường viền (Borders)
  border: {
    default: 'border border-slate-200',
    subtle: 'border border-slate-100',
    brand: 'border border-emerald-200',
    warning: 'border border-amber-200',
    danger: 'border border-rose-200',
    sidebar: 'border-r border-slate-800',
  },

  // Đổ bóng (Shadows)
  shadow: {
    sm: 'shadow-sm',
    card: 'shadow-sm',
    primary: 'shadow-lg shadow-emerald-600/20',
    danger: 'shadow-lg shadow-rose-600/25',
    modal: 'shadow-2xl',
  },

  // Hiệu ứng Focus
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white',
  },
} as const;

// ----------------------------------------------------------------------------
// 4. COMPONENT PRESETS (CỤM CLASS DÙNG NGAY TRONG JSX)
// Copy hoặc đưa trực tiếp vào className mà không cần ghép thủ công
// ----------------------------------------------------------------------------
export const THEME_COMPONENTS = {
  // Nút bấm (Buttons)
  button: {
    // Nút hành động chính (Thêm mới, Lưu, Cập nhật)
    primary:
      'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',

    // Nút phụ nền tối (Xem radar, Link ngoài)
    secondary:
      'px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer',

    // Nút viền mỏng (Bộ lọc, Quay lại)
    outline:
      'px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer',

    // Nút huỷ/xoá nguy cấp (Xoá vĩnh viễn, Ngưng bán)
    danger:
      'px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/25 cursor-pointer disabled:opacity-60',

    // Nút huỷ bỏ không màu (Hủy popup)
    ghost:
      'px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer',

    // Nút icon tròn/vuông nhỏ (Xem mắt, Sửa bút, Thùng rác)
    iconView:
      'p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer',
    iconEdit:
      'p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer',
    iconDelete:
      'p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer',
  },

  // Thẻ Card & Khung giao diện
  card: {
    // Card trắng tiêu chuẩn
    base: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm',

    // Card chỉ số KPI trên cùng
    kpi: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden',

    // Khung chứa bảng dữ liệu
    tableContainer: 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden',

    // Thanh tìm kiếm + bộ lọc
    filterBar:
      'bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4',

    // Khung popup modal
    modal: 'bg-white rounded-3xl w-full p-6 shadow-2xl border border-slate-200',
  },

  // Ô chứa Icon nổi bật (Icon Box)
  iconBox: {
    emerald: 'w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center',
    amber: 'w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center',
    rose: 'w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center',
    slate: 'w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center',
  },

  // Huy hiệu trạng thái (Status Badges)
  badge: {
    // Thành công / Đang bán / Đã giao
    success:
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs',

    // Cận date / Chờ duyệt / Cảnh báo
    warning:
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs',

    // Đã hủy / Đã hết hạn / Cách ly
    danger:
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs',

    // Trung tính / Mặc định
    neutral:
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs',
  },

  // Tab chuyển đổi (Tabs)
  tab: {
    active:
      'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer bg-emerald-600 text-white shadow-sm',
    inactive:
      'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
  },

  // Ô nhập liệu (Form Inputs)
  input: {
    text: 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition',
    search:
      'w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition',
    select:
      'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition',
    label: 'text-xs font-bold text-slate-700 block mb-1',
  },

  // Bảng dữ liệu (Table Layout)
  table: {
    head: 'bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs',
    th: 'py-3.5 px-4',
    tr: 'hover:bg-slate-50/80 transition divide-y divide-slate-100',
    td: 'py-3.5 px-4 text-xs font-medium text-slate-700',
  },

  // Tiêu đề trang (Page Header)
  header: {
    title: 'text-2xl font-black text-slate-900 tracking-tight',
    subtitle: 'text-sm text-slate-500 mt-1',
    pill: 'inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold mb-2',
  },
} as const;

// ----------------------------------------------------------------------------
// 5. DEFAULT THEME EXPORT
// ----------------------------------------------------------------------------
export const THEME = {
  colors: THEME_COLORS,
  sizes: THEME_SIZES,
  classes: THEME_CLASSES,
  components: THEME_COMPONENTS,
} as const;

export default THEME;

