import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { AddCartItemDto, ApplyCouponDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin giỏ hàng & bảng dinh dưỡng tổng hợp của các món trong giỏ' })
  @ApiQuery({ name: 'sessionToken', required: false, description: 'Token giỏ hàng khách vãng lai' })
  getCart(@Query('sessionToken') sessionToken?: string, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.cartsService.getCart(userId, sessionToken);
  }

  @Post('items')
  @Public()
  @ApiOperation({ summary: 'Thêm sản phẩm hoặc combo vào giỏ hàng' })
  addItem(@Body() dto: AddCartItemDto, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.cartsService.addItem(userId, dto);
  }

  @Put('items/:id')
  @Public()
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ' })
  @ApiQuery({ name: 'sessionToken', required: false })
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
    @Query('sessionToken') sessionToken?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.cartsService.updateItemQuantity(id, dto, userId, sessionToken);
  }

  @Delete('items/:id')
  @Public()
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  @ApiQuery({ name: 'sessionToken', required: false })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('sessionToken') sessionToken?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.cartsService.removeItem(id, userId, sessionToken);
  }

  @Post('apply-coupon')
  @Public()
  @ApiOperation({ summary: 'Áp dụng mã giảm giá (Voucher Coupon) vào giỏ hàng' })
  applyCoupon(@Body() dto: ApplyCouponDto, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.cartsService.applyCoupon(dto, userId);
  }
}
