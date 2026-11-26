import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum SortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  BEST_SELLING = 'best_selling',
  RATING = 'rating',
}

const csv = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(value) ? value : undefined;
const bool = ({ value }: { value: unknown }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined);

export class ProductsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60)
  limit?: number = 12;

  @ApiPropertyOptional({ description: 'Từ khóa (tên sản phẩm hoặc nhu cầu: "giàu đạm", "keto", "ít calo"...)' })
  @IsOptional() @IsString() @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ description: 'Slug danh mục (bao gồm danh mục con)' })
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Mã chế độ/mục tiêu dinh dưỡng, phân tách bằng dấu phẩy (keto,high_protein)' })
  @IsOptional() @Transform(csv)
  diets?: string[];

  @ApiPropertyOptional({ description: 'Loại trừ thành phần dị ứng, phân tách bằng dấu phẩy (tree_nut,gluten)' })
  @IsOptional() @Transform(csv)
  excludeAllergens?: string[];

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minPrice?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Đánh giá tối thiểu (1-5)' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Nutri-Score, phân tách bằng dấu phẩy (A,B)' })
  @IsOptional() @Transform(csv)
  nutriScore?: string[];

  @ApiPropertyOptional() @IsOptional() @Transform(bool) @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional() @IsOptional() @Transform(bool) @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional() @IsOptional() @Transform(bool) @IsBoolean()
  onSale?: boolean;

  @ApiPropertyOptional({ enum: SortBy, default: SortBy.NEWEST })
  @IsOptional() @IsEnum(SortBy)
  sort?: SortBy = SortBy.NEWEST;
}
