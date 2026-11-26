import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminCatalogService } from './admin-catalog.service';
import { CategoryInput, ProductInput } from './dto/admin-catalog.dto';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/permissions';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('catalog/meta')
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  meta() {
    return this.catalog.meta();
  }

  @Get('catalog/variants')
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  variants() {
    return this.catalog.variantOptions();
  }

  @Get('products')
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  list(@Query('q') q?: string, @Query('categoryId') categoryId?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.catalog.list({ q, categoryId: categoryId ? Number(categoryId) : undefined, status, page: page ? Number(page) : 1 });
  }

  @Get('products/:id')
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.get(id);
  }

  @Post('products')
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  create(@Body() dto: ProductInput, @CurrentUser() user: CurrentUserPayload) {
    return this.catalog.save(dto, user.id);
  }

  @Put('products/:id')
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: ProductInput, @CurrentUser() user: CurrentUserPayload) {
    return this.catalog.save(dto, user.id, id);
  }

  @Patch('products/:id/visibility')
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  visibility(@Param('id', ParseIntPipe) id: number, @Body('visible') visible: boolean, @CurrentUser() user: CurrentUserPayload) {
    return this.catalog.setStatus(id, visible ? 'active' : 'inactive', user.id);
  }

  @Delete('products/:id')
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.catalog.remove(id, user.id);
  }

  @Get('categories')
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  categories() {
    return this.catalog.categories();
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  createCategory(@Body() dto: CategoryInput) {
    return this.catalog.saveCategory(dto);
  }

  @Put('categories/:id')
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: CategoryInput) {
    return this.catalog.saveCategory(dto, id);
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeCategory(id);
  }
}
