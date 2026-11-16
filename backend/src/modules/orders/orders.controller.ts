import { Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Lấy toàn bộ đơn hàng toàn sàn (phân trang, lọc trạng thái, tìm kiếm)' })
  findAllForAdmin(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findAllForAdmin({
      status,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Cập nhật trạng thái đơn hàng (Duyệt, đang xử lý, giao, hủy...)' })
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Body('note') note?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.ordersService.updateOrderStatus(id, status, note, user?.id);
  }

  @Post('admin/:id/shipment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Tạo vận đơn giao hàng và chuyển trạng thái sang Shipping' })
  createShipment(
    @Param('id', ParseIntPipe) id: number,
    @Body('carrier') carrier: string,
    @Body('trackingCode') trackingCode: string,
    @Body('estimatedDelivery') estimatedDelivery?: string,
  ) {
    return this.ordersService.createShipment(id, { carrier, trackingCode, estimatedDelivery });
  }

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới (Hỗ trợ cả khách vãng lai và thành viên)' })
  @ApiResponse({ status: 201, description: 'Đơn hàng được tạo thành công' })
  createOrder(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    let userId: number | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
          if (decoded && (decoded.sub || decoded.id)) {
            userId = Number(decoded.sub || decoded.id);
          }
        }
      } catch (e) {
        // Ignored for guest checkout
      }
    }
    return this.ordersService.createOrder(userId, dto);
  }

  @Post(':id/sepay/checkout')
  @ApiOperation({ summary: 'Tạo link và form thanh toán SePay VietQR cho đơn hàng' })
  createSepayCheckout(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.createSepayCheckout(id);
  }

  @Post('sepay/ipn')
  @ApiOperation({ summary: 'Webhook IPN nhận thông báo giao dịch chuyển khoản thành công từ SePay' })
  handleSepayIpn(
    @Headers('x-secret-key') headerSecret: string | undefined,
    @Body() body: any,
  ) {
    return this.ordersService.handleSepayIpn(headerSecret, body);
  }

  @Get('lookup/:orderNumber')
  @ApiOperation({ summary: 'Tra cứu thông tin đơn hàng theo mã (Dành cho trang xác nhận và theo dõi đơn)' })
  getOrderByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderByOrderNumber(orderNumber);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái thanh toán của đơn hàng (dùng để polling realtime)' })
  getOrderPaymentStatus(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderPaymentStatus(id);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách các đơn hàng của tôi' })
  getMyOrders(@CurrentUser() user: CurrentUserPayload) {
    return this.ordersService.getMyOrders(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng & lịch sử trạng thái vận chuyển' })
  getOrderDetail(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderDetail(user.id, id);
  }
}
