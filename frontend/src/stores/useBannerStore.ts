import { create } from 'zustand';
import { BannerConfig, bannerService } from '@/services/banner.service';

interface BannerStore {
  bannerConfig: BannerConfig;
  setBannerConfig: (config: BannerConfig) => void;
  fetchBannerConfig: () => Promise<void>;
}

export const useBannerStore = create<BannerStore>((set) => ({
  bannerConfig: {
    title: 'Artisan Granola',
    subtitle: 'Dinh dưỡng thuần khiết từ các loại hạt sấy mộc tự nhiên.',
    vnDescription: 'Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên.',
    mode: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    model3dType: 'almond',
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
