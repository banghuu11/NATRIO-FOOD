import { apiClient } from '@/lib/api/axios';

export interface BannerConfig {
  title: string;
  subtitle: string;
  vnDescription?: string;
  mode: 'image' | '3d';
  imageUrl?: string;
  model3dType?: 'nut_bowl' | 'almond' | 'macca' | 'granola_jar' | 'chia_seed';
  enable3dRotation?: boolean;
  backgroundColor?: string;
}

export const bannerService = {
  async getHeroBanner(): Promise<BannerConfig> {
    const response = await apiClient.get('/banners/hero');
    return response.data;
  },

  async updateHeroBanner(data: BannerConfig): Promise<BannerConfig> {
    const response = await apiClient.put('/banners/hero', data);
    return response.data;
  },

  async getAllBanners() {
    const response = await apiClient.get('/banners');
    return response.data;
  },
};
