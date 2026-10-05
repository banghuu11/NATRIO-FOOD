import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateHeroBannerDto, BannerRenderMode, Model3DType } from './dto/update-hero-banner.dto';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  // In-memory active hero banner configuration with rich initial defaults
  private heroBannerConfig: UpdateHeroBannerDto = {
    title: 'Artisan Granola',
    subtitle: 'An organic healthy food, roasted nuts, and warm botanical.',
    vnDescription: 'Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên.',
    mode: BannerRenderMode.IMAGE,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    model3dType: Model3DType.NUT_BOWL,
    enable3dRotation: true,
    backgroundColor: '#F4EFE6',
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình Hero Banner hiện tại (hỗ trợ cả ảnh và 3D)
   */
  async getHeroBanner(): Promise<UpdateHeroBannerDto> {
    try {
      // Optional check in DB banners table for position 'home_hero'
      const dbBanner = await this.prisma.banners.findFirst({
        where: { position: 'home_hero', is_active: true },
        orderBy: { id: 'desc' },
      });

      if (dbBanner && dbBanner.link_url) {
        try {
          const parsed = JSON.parse(dbBanner.link_url);
          return {
            ...this.heroBannerConfig,
            ...parsed,
            title: dbBanner.title || this.heroBannerConfig.title,
            imageUrl: dbBanner.image_url || this.heroBannerConfig.imageUrl,
          };
        } catch (e) {
          // Link url is not json, return in-memory config
        }
      }
    } catch (err) {
      this.logger.warn('Lỗi khi truy vấn DB banners, sử dụng cấu hình mặc định', err);
    }
    return this.heroBannerConfig;
  }

  /**
   * Cập nhật cấu hình Hero Banner và mô hình 3D (Admin)
   */
  async updateHeroBanner(dto: UpdateHeroBannerDto): Promise<UpdateHeroBannerDto> {
    this.heroBannerConfig = {
      ...this.heroBannerConfig,
      ...dto,
    };

    try {
      // Upsert to DB banners table
      const existing = await this.prisma.banners.findFirst({
        where: { position: 'home_hero' },
      });

      const payload = JSON.stringify({
        subtitle: dto.subtitle,
        vnDescription: dto.vnDescription,
        mode: dto.mode,
        model3dType: dto.model3dType,
        enable3dRotation: dto.enable3dRotation,
        backgroundColor: dto.backgroundColor,
      });

      if (existing) {
        await this.prisma.banners.update({
          where: { id: existing.id },
          data: {
            title: dto.title,
            image_url: dto.imageUrl || this.heroBannerConfig.imageUrl || '',
            link_url: payload,
            is_active: true,
          },
        });
      } else {
        await this.prisma.banners.create({
          data: {
            title: dto.title,
            image_url: dto.imageUrl || this.heroBannerConfig.imageUrl || '',
            position: 'home_hero',
            link_url: payload,
            is_active: true,
          },
        });
      }
    } catch (err) {
      this.logger.warn('Không thể ghi DB banner, đã cập nhật bộ nhớ đệm', err);
    }

    return this.heroBannerConfig;
  }

  /**
   * Danh sách tất cả các banner quảng cáo
   */
  async getAllBanners() {
    const list = await this.prisma.banners.findMany({
      orderBy: { sort_order: 'asc' },
    });
    return list.map((b) => ({
      id: Number(b.id),
      title: b.title,
      imageUrl: b.image_url,
      linkUrl: b.link_url,
      position: b.position,
      sortOrder: b.sort_order,
      isActive: b.is_active,
    }));
  }
}
