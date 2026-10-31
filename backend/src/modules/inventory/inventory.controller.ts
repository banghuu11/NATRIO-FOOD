import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { FefoQueryDto } from './dto/fefo-query.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory & FEFO')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('fefo')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Lấy danh sách các lô hàng theo nguyên tắc FEFO (Hết hạn sớm nhất lên trước)',
    description: 'Tự động tính ngày còn lại (daysLeft), cảnh báo lô nguy cấp (<15 ngày) và cảnh báo (<30 ngày) phục vụ trang /admin/inventory-fefo',
  })
  @ApiResponse({ status: 200, description: 'Danh sách lô hàng xếp theo FEFO kèm tồn kho' })
  getFefoBatches(@Query() query: FefoQueryDto) {
    return this.inventoryService.getFefoBatches(query);
  }

  @Post('batches')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Nhập lô hàng mới vào kho',
    description: 'Tạo lô hàng mới, sinh mã QR truy xuất và ghi nhận tồn kho ban đầu',
  })
  @ApiResponse({ status: 201, description: 'Nhập lô hàng thành công' })
  createBatch(@Body() dto: CreateBatchDto) {
    return this.inventoryService.createBatch(dto);
  }

  @Get('warehouses')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Lấy danh sách các kho bãi (Kho thường, kho lạnh)' })
  getWarehouses() {
    return this.inventoryService.getWarehouses();
  }

  @Get('stock-movements')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Lịch sử luân chuyển tồn kho (Xuất/Nhập/Điều chuyển)' })
  getStockMovements(@Query('limit') limit?: number) {
    return this.inventoryService.getStockMovements(limit ? Number(limit) : 30);
  }

  @Put('batches/:id/quarantine')
  @Roles('admin')
  @ApiOperation({ summary: 'Cách ly lô hàng cận hạn / hỏng (Khóa tồn kho xuất bán)' })
  quarantineBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.inventoryService.quarantineBatch(id, reason);
  }
}

