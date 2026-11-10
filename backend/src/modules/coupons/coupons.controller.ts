import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { Public, Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Coupons & Flash Sales')
@Controller('promotions')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('coupons')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách mã giảm giá Voucher khả dụng' })
  getActiveCoupons() {
    return this.couponsService.getActiveCoupons();
  }

  @Get('flash-sales')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách chương trình Flash Sale đang diễn ra' })
  getFlashSales() {
    return this.couponsService.getFlashSales();
  }

  @Get('bundles')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách các Combo / Bundle tiết kiệm' })
  getBundles() {
    return this.couponsService.getBundles();
  }

  // --- ADMIN ENDPOINTS ---

  @Get('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Lấy toàn bộ mã giảm giá kèm thống kê sử dụng' })
  findAllCouponsForAdmin() {
    return this.couponsService.findAllCouponsForAdmin();
  }

  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Tạo mã khuyến mãi mới' })
  createCoupon(
    @Body()
    dto: {
      code: string;
      description?: string;
      discountType: 'percent' | 'fixed_amount' | 'free_shipping';
      discountValue: number;
      minOrderAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      firstOrderOnly?: boolean;
      endsAt?: string;
    },
  ) {
    return this.couponsService.createCoupon(dto);
  }

  @Put('admin/coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Cập nhật thông tin mã khuyến mãi' })
  updateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      code?: string;
      description?: string;
      discountType?: 'percent' | 'fixed_amount' | 'free_shipping';
      discountValue?: number;
      minOrderAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      firstOrderOnly?: boolean;
      endsAt?: string;
      isActive?: boolean;
    },
  ) {
    return this.couponsService.updateCoupon(id, dto);
  }

  @Delete('admin/coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Xóa mã khuyến mãi' })
  deleteCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.deleteCoupon(id);
  }

  @Get('admin/flash-sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách toàn bộ chiến dịch Flash Sale' })
  findAllFlashSalesForAdmin() {
    return this.couponsService.findAllFlashSalesForAdmin();
  }

  @Post('admin/flash-sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Tạo chiến dịch Flash Sale mới' })
  createFlashSale(
    @Body()
    dto: {
      name: string;
      startsAt: string;
      endsAt: string;
      items?: { variantId: number; salePrice: number; quantityLimit?: number }[];
    },
  ) {
    return this.couponsService.createFlashSale(dto);
  }

  @Patch('admin/flash-sales/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Bật / Tắt trạng thái Flash Sale' })
  toggleFlashSale(@Param('id', ParseIntPipe) id: number, @Body('isActive') isActive: boolean) {
    return this.couponsService.toggleFlashSale(id, isActive);
  }
}
