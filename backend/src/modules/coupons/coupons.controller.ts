import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { Public } from '../../common/decorators/roles.decorator';

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
}
