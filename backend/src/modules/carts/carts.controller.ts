import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartsService, CartOwner } from './carts.service';
import { AddCartItemDto, ApplyCouponDto, BulkAddDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Carts')
@ApiHeader({ name: 'x-cart-token', required: false, description: 'Mã giỏ hàng của khách chưa đăng nhập' })
@Controller('cart')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  private owner(user: CurrentUserPayload | undefined, token?: string): CartOwner {
    return user ? { userId: user.id } : { token };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Giỏ hàng + tổng tiền + dinh dưỡng (selected = id các dòng muốn thanh toán)' })
  get(@CurrentUser() user: CurrentUserPayload, @Headers('x-cart-token') token?: string, @Query('selected') selected?: string) {
    const ids = selected ? selected.split(',').map(Number).filter((n) => n > 0) : undefined;
    return this.carts.getCart(this.owner(user, token), ids);
  }

  @Public()
  @Post('items')
  add(@CurrentUser() user: CurrentUserPayload, @Body() dto: AddCartItemDto, @Headers('x-cart-token') token?: string) {
    return this.carts.addItem(this.owner(user, token), dto);
  }

  @Public()
  @Post('items/bulk')
  @ApiOperation({ summary: 'Thêm nhiều sản phẩm một lần (công thức, thực đơn, mua lại)' })
  bulk(@CurrentUser() user: CurrentUserPayload, @Body() dto: BulkAddDto, @Headers('x-cart-token') token?: string) {
    return this.carts.addMany(this.owner(user, token), dto.items);
  }

  @Public()
  @Patch('items/:id')
  update(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCartItemDto, @Headers('x-cart-token') token?: string) {
    return this.carts.updateQuantity(this.owner(user, token), id, dto.quantity);
  }

  @Public()
  @Delete('items/:id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number, @Headers('x-cart-token') token?: string) {
    return this.carts.removeItem(this.owner(user, token), id);
  }

  @Public()
  @Delete()
  clear(@CurrentUser() user: CurrentUserPayload, @Headers('x-cart-token') token?: string) {
    return this.carts.clear(this.owner(user, token));
  }

  @Public()
  @Post('coupon')
  applyCoupon(@CurrentUser() user: CurrentUserPayload, @Body() dto: ApplyCouponDto, @Headers('x-cart-token') token?: string) {
    return this.carts.applyCoupon(this.owner(user, token), dto.code);
  }

  @Public()
  @Delete('coupon')
  removeCoupon(@CurrentUser() user: CurrentUserPayload, @Headers('x-cart-token') token?: string) {
    return this.carts.removeCoupon(this.owner(user, token));
  }

  @ApiBearerAuth('JWT-auth')
  @Post('merge')
  @ApiOperation({ summary: 'Gộp giỏ hàng khách vãng lai vào tài khoản sau khi đăng nhập' })
  merge(@CurrentUser() user: CurrentUserPayload, @Body() dto: MergeCartDto) {
    return this.carts.merge(user.id, dto.guestToken);
  }
}
