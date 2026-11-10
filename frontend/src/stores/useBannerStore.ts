import { create } from 'zustand';
import { BannerConfig, bannerService } from '@/services/banner.service';

interface BannerStore {
  bannerConfig: BannerConfig;
  setBannerConfig: (config: BannerConfig) => void;
  fetchBannerConfig: () => Promise<void>;
}

export const useBannerStore = create<BannerStore>((set) => ({
  bannerConfig: {
    tagline: '100% Nông Sản Mộc Tươi Mới',
    title: 'Trọn Vẹn Vị Ngọt Tự Nhiên',
    subtitle: 'Dinh dưỡng thuần khiết từ các loại hạt sấy mộc tự nhiên.',
    description: 'Hạt điều rang củi nguyên vỏ lụa Bình Phước, macca nứt vỏ gỗ Tây Nguyên, hạnh nhân hổ phách nguyên vỏ mộc và óc chó sấy nhiệt thấp. Giữ trọn 100% hương vị và tinh dầu quý giá.',
    vnDescription: 'Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên.',
    buttonText: 'Khám Phá Bộ Sưu Tập',
    buttonLink: '/products',
    highlightText: 'Sấy mộc 60°C • Giữ nguyên lớp vỏ tự nhiên',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    backgroundOverlay: 'gradient',
    backgroundColor: '#F4EFE6',
    mode: '3d',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    model3dType: 'nut_bowl',
    enable3dRotation: true,
  },
  setBannerConfig: (config) => set({ bannerConfig: config }),
  fetchBannerConfig: async () => {
    try {
      const data = await bannerService.getHeroBanner();
      if (data) {
        set({ bannerConfig: data });
      }
    } catch (e) {
      // Keep fallback
    }
  },
}));
