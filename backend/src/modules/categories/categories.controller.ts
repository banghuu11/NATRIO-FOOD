import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả danh mục sản phẩm (Granola, Hạt, Sữa hạt...)' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục đang hoạt động' })
  findAll() {
    return this.categoriesService.findAllCategories();
  }

  @Get('brands')
  @ApiOperation({ summary: 'Lấy danh sách các thương hiệu đối tác' })
  findAllBrands() {
    return this.categoriesService.findAllBrands();
  }

  @Get('certifications')
  @ApiOperation({ summary: 'Lấy danh sách các chứng nhận hữu cơ & an toàn thực phẩm (USDA, VietGAP, HACCP)' })
  findAllCertifications() {
    return this.categoriesService.findAllCertifications();
  }

  @Get('farms')
  @ApiOperation({ summary: 'Lấy danh sách các nông trại hữu cơ liên kết' })
  findAllFarms() {
    return this.categoriesService.findAllFarms();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Lấy chi tiết danh mục theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findCategoryBySlug(slug);
  }
}
