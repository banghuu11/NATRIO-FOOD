import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductsQueryDto } from './dto/products-query.dto';
import { CreateProductDto, InitialVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Lấy toàn bộ sản phẩm (kèm draft/archived, tồn kho tổng)' })
  findAllForAdmin(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('nutriScore') nutriScore?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAllForAdmin({
      search,
      status,
      nutriScore,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Tạo sản phẩm mới kèm Nutrition Facts & Biến thể' })
  @ApiResponse({ status: 201, description: 'Sản phẩm được tạo thành công' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Cập nhật thông tin sản phẩm & dinh dưỡng' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Lưu trữ / ngưng kinh doanh sản phẩm (Archive)' })
  archiveProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.archiveProduct(id);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[ADMIN] Thêm biến thể đóng gói mới cho sản phẩm' })
  createVariant(@Param('id', ParseIntPipe) id: number, @Body() dto: InitialVariantDto) {
    return this.productsService.createVariant(id, dto);
  }

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

