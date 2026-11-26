import { Body, Controller, DefaultValuePipe, Get, Headers, HttpCode, Ip, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CancelOrderDto, CreateOrderDto, QuoteDto, TrackOrderDto } from './dto/order.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Orders')
@ApiHeader({ name: 'x-cart-token', required: false })
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  private owner(user?: CurrentUserPayload, token?: string) {
    return user ? { userId: user.id } : { token };
  }

  @Public()
  @Post('checkout/quote')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tính tiền đơn hàng trước khi đặt (giá, giảm giá, phí ship, điểm thưởng) – tính ở server' })
  quote(@CurrentUser() user: CurrentUserPayload, @Body() dto: QuoteDto, @Headers('x-cart-token') token?: string) {
    return this.orders.quote(this.owner(user, token), dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('orders')
  @ApiOperation({ summary: 'Đặt hàng (khách vãng lai hoặc đã đăng nhập)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateOrderDto, @Ip() ip: string, @Headers('x-cart-token') token?: string) {
    return this.orders.create(this.owner(user, token), dto, ip);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('orders/track')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tra cứu đơn hàng bằng mã đơn + số điện thoại' })
  track(@Body() dto: TrackOrderDto) {
    return this.orders.track(dto.orderNumber, dto.phone);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('orders')
  @ApiOperation({ summary: 'Lịch sử đơn hàng của tôi' })
  mine(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
  ) {
    return this.orders.myOrders(user.id, status, page);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('orders/:id')
  detail(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.orders.detail(user.id, id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('orders/:id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Khách hủy đơn (chỉ khi Chờ xác nhận / Đã xác nhận)' })
  cancel(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: CancelOrderDto) {
    return this.orders.cancel(user.id, id, dto.reason);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('orders/:id/reorder')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mua lại: thêm toàn bộ sản phẩm của đơn cũ vào giỏ' })
  reorder(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.orders.reorder(user.id, id);
  }
}
