import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
