import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
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
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
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
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
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
  @ApiOperation({ summary: 'Tạo đơn hàng mới (Áp dụng giảm giá, voucher, điểm thưởng & tính phí ship)' })
  @ApiResponse({ status: 201, description: 'Đơn hàng được tạo thành công' })
  createOrder(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Lấy danh sách các đơn hàng của tôi' })
  getMyOrders(@CurrentUser() user: CurrentUserPayload) {
    return this.ordersService.getMyOrders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng & lịch sử trạng thái vận chuyển' })
  getOrderDetail(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderDetail(user.id, id);
  }
}

