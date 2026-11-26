import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AddressDto, PriceAlertDto, UpdateProfileDto } from './dto/users.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Account')
@ApiBearerAuth('JWT-auth')
@Controller('account')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân / ảnh đại diện' })
  updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Get('addresses')
  addresses(@CurrentUser() user: CurrentUserPayload) {
    return this.users.addresses(user.id);
  }

  @Post('addresses')
  addAddress(@CurrentUser() user: CurrentUserPayload, @Body() dto: AddressDto) {
    return this.users.saveAddress(user.id, dto);
  }

  @Put('addresses/:id')
  updateAddress(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: AddressDto) {
    return this.users.saveAddress(user.id, dto, id);
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.users.deleteAddress(user.id, id);
  }

  @Get('wishlist')
  wishlist(@CurrentUser() user: CurrentUserPayload) {
    return this.users.wishlist(user.id);
  }

  @Get('wishlist/ids')
  wishlistIds(@CurrentUser() user: CurrentUserPayload) {
    return this.users.wishlistIds(user.id);
  }

  @Post('wishlist')
  addWishlist(@CurrentUser() user: CurrentUserPayload, @Body() dto: PriceAlertDto) {
    return this.users.addWishlist(user.id, dto.productId);
  }

  @Delete('wishlist/:productId')
  removeWishlist(@CurrentUser() user: CurrentUserPayload, @Param('productId', ParseIntPipe) productId: number) {
    return this.users.removeWishlist(user.id, productId);
  }

  @Post('wishlist/:productId/price-alert')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bật/tắt thông báo khi sản phẩm yêu thích giảm giá' })
  priceAlert(@CurrentUser() user: CurrentUserPayload, @Param('productId', ParseIntPipe) productId: number, @Query('active') active = 'true') {
    return this.users.togglePriceAlert(user.id, productId, active !== 'false');
  }

  @Get('notifications')
  notifications(@CurrentUser() user: CurrentUserPayload, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.users.notifications(user.id, page);
  }

  @Post('notifications/read')
  @HttpCode(200)
  readAll(@CurrentUser() user: CurrentUserPayload, @Query('id') id?: string) {
    return this.users.markNotificationsRead(user.id, id ? Number(id) : undefined);
  }

  @Get('loyalty')
  @ApiOperation({ summary: 'Điểm thưởng, hạng thành viên Bronze/Silver/Gold, lịch sử điểm' })
  loyalty(@CurrentUser() user: CurrentUserPayload) {
    return this.users.loyalty(user.id);
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'Voucher có thể sử dụng' })
  vouchers(@CurrentUser() user: CurrentUserPayload) {
    return this.users.vouchers(user.id);
  }
}
