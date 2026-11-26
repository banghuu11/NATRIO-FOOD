import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductsQueryDto } from './dto/products-query.dto';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Products')
@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm: tìm kiếm, lọc (danh mục, giá, mục tiêu dinh dưỡng, đánh giá, dị ứng), sắp xếp, phân trang' })
  async findAll(@Query() query: ProductsQueryDto, @CurrentUser() user?: CurrentUserPayload) {
    const result = await this.products.findAll(query);
    if (query.q && query.page === 1) void this.products.logSearch(query.q, result.meta.total, user?.id);
    return result;
  }

  @Get('collections')
  @ApiOperation({ summary: 'Sản phẩm nổi bật, bán chạy, mới nhất (trang chủ)' })
  collections() {
    return this.products.collections();
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Gợi ý từ khóa / sản phẩm khi đang gõ tìm kiếm' })
  suggest(@Query('q') q: string) {
    return this.products.suggest(q);
  }

  @Get('popular-searches')
  @ApiOperation({ summary: 'Từ khóa được tìm nhiều' })
  popular() {
    return this.products.popularSearches();
  }

  @Get('by-ids')
  @ApiQuery({ name: 'ids', example: '1,2,3' })
  @ApiOperation({ summary: 'Lấy nhiều sản phẩm theo ID (đã xem gần đây...)' })
  byIds(@Query('ids') ids = '') {
    return this.products.cardsByIds(this.parseIds(ids, 24));
  }

  @Get('compare')
  @ApiQuery({ name: 'ids', example: '1,2,3' })
  @ApiOperation({ summary: 'So sánh 2–3 sản phẩm' })
  compare(@Query('ids') ids = '') {
    const list = this.parseIds(ids, 3);
    if (list.length < 1) throw new BadRequestException('Chọn ít nhất 1 sản phẩm để so sánh');
    return this.products.compare(list);
  }

  @Get('traceability/:qrCode')
  @ApiOperation({ summary: 'Truy xuất nguồn gốc lô hàng qua mã QR' })
  trace(@Param('qrCode') qr: string) {
    return this.products.traceability(qr);
  }

  @Get(':id/related')
  related(@Param('id', ParseIntPipe) id: number) {
    return this.products.related(id);
  }

  @Get(':id/frequently-bought')
  frequentlyBought(@Param('id', ParseIntPipe) id: number) {
    return this.products.frequentlyBoughtTogether(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo slug' })
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.products.findBySlug(slug, user?.id);
  }

  private parseIds(ids: string, max: number) {
    return ids
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, max);
  }
}
