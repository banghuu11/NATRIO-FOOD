import { Controller, Get, Put, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';

@ApiTags('Banners & 3D Configuration')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get('hero')
  @ApiOperation({ summary: 'Lấy cấu hình Hero Banner & Mô hình 3D tương tác (Storefront & Admin)' })
  @ApiResponse({ status: 200, description: 'Cấu hình Hero Banner hiện tại', type: UpdateHeroBannerDto })
  async getHeroBanner(): Promise<UpdateHeroBannerDto> {
    return this.bannersService.getHeroBanner();
  }

  @Put('hero')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật cấu hình Hero Banner & Mô hình 3D (Admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật cấu hình banner thành công', type: UpdateHeroBannerDto })
  async updateHeroBanner(@Body() dto: UpdateHeroBannerDto): Promise<UpdateHeroBannerDto> {
    return this.bannersService.updateHeroBanner(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các banner' })
  @ApiResponse({ status: 200, description: 'Danh sách banner' })
  async getAllBanners() {
    return this.bannersService.getAllBanners();
  }
}
