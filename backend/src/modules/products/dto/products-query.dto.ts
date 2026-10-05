import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination.dto';

export enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING = 'rating',
  NEWEST = 'newest',
  BEST_SELLING = 'best_selling',
}

export class ProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Slug của danh mục' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Mã chế độ ăn (ví dụ: eat_clean, keto, vegan, gluten_free)' })
  @IsOptional()
  @IsString()
  dietCode?: string;

  @ApiPropertyOptional({ description: 'Mã dị ứng cần loại trừ (ví dụ: peanut, tree_nut, gluten)' })
  @IsOptional()
  @IsString()
  excludeAllergen?: string;

  @ApiPropertyOptional({ description: 'Xếp hạng Nutri-Score (A, B, C, D, E)' })
  @IsOptional()
  @IsString()
  nutriScore?: string;

  @ApiPropertyOptional({ description: 'Mức calo tối đa trên 100g' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCalories?: number;

  @ApiPropertyOptional({ description: 'Chỉ lấy sản phẩm nổi bật (Featured)', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: SortBy, description: 'Sắp xếp kết quả', default: SortBy.NEWEST })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.NEWEST;
}
