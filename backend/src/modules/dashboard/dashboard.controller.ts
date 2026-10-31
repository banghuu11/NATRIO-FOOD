import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Dashboard & Analytics')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Lấy các chỉ số KPI tổng quan (Doanh thu, Đơn hàng, Khách hàng, Cảnh báo FEFO cận date)',
    description: 'Cung cấp dữ liệu thời gian thực cho trang /admin/dashboard',
  })
  @ApiResponse({ status: 200, description: 'Chỉ số KPI tổng quan' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('fefo-alerts')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Lấy top các lô hàng cận date khẩn cấp nhất (<15 ngày, <30 ngày)',
    description: 'Hiển thị trên widget Cảnh Báo FEFO ở trang Dashboard',
  })
  getFefoAlerts(@Query('limit') limit?: number) {
    return this.dashboardService.getFefoAlerts(limit ? Number(limit) : 5);
  }

  @Get('recent-orders')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Lấy danh sách các đơn hàng mới nhất cần xử lý',
  })
  getRecentOrders(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentOrders(limit ? Number(limit) : 10);
  }
}

