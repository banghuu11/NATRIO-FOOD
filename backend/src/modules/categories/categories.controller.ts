import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Categories')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Cây danh mục sản phẩm (cha/con) kèm số lượng sản phẩm' })
  tree() {
    return this.categories.tree();
  }

  @Get('meta')
  @ApiOperation({ summary: 'Danh sách chế độ ăn, thành phần dị ứng, chứng nhận (dùng cho bộ lọc)' })
  meta() {
    return this.categories.meta();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categories.findBySlug(slug);
  }
}
