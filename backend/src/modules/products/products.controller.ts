import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductsQueryDto } from './dto/products-query.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách sản phẩm (Hỗ trợ lọc theo Calo, Diets, Nutri-Score, Dị ứng & Tìm kiếm)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm kèm thông tin dinh dưỡng tóm tắt' })
  findAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('traceability/:qrCode')
  @ApiOperation({ summary: 'Truy xuất nguồn gốc sản phẩm & nông trại qua mã QR code' })
  getTraceability(@Param('qrCode') qrCode: string) {
    return this.productsService.getTraceabilityByQr(qrCode);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết sản phẩm, Nutrition Facts, thành phần & biến thể' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
