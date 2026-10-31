import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class NutritionFactsDto {
  @ApiProperty({ description: 'Năng lượng trên 100g (kcal)', example: 540 })
  @Type(() => Number)
  @IsNumber()
  caloriesKcal: number;

  @ApiProperty({ description: 'Chất đạm Protein (g)', example: 18.5 })
  @Type(() => Number)
  @IsNumber()
  proteinG: number;

  @ApiProperty({ description: 'Tổng Carbohydrate (g)', example: 45.2 })
  @Type(() => Number)
  @IsNumber()
  carbohydratesG: number;

  @ApiPropertyOptional({ description: 'Đường tinh luyện (g)', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sugarsG?: number;

  @ApiProperty({ description: 'Chất béo tổng Fat (g)', example: 38.0 })
  @Type(() => Number)
  @IsNumber()
  fatG: number;

  @ApiPropertyOptional({ description: 'Chất xơ Fiber (g)', example: 9.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fiberG?: number;

  @ApiPropertyOptional({ description: 'Natri Sodium (mg)', example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sodiumMg?: number;
}

export class InitialVariantDto {
  @ApiProperty({ description: 'Mã SKU duy nhất', example: 'ALM-MOC-250' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Tên biến thể đóng gói', example: 'Hũ thủy tinh 250g' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Khối lượng tịnh (g)', example: 250 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  netWeightG: number;

  @ApiProperty({ description: 'Giá bán lẻ niêm yết (VND)', example: 135000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Giá so sánh trước khi giảm (VND)', example: 150000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  compareAtPrice?: number;

  @ApiPropertyOptional({ description: 'Giá vốn ước tính (VND)', example: 90000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Mức cảnh báo cần nhập thêm hàng', example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reorderLevel?: number = 10;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Tên sản phẩm', example: 'Hạt Hạnh Nhân Sấy Mộc Tự Nhiên' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Đường dẫn URL thân thiện (slug)', example: 'hat-hanh-nhan-say-moc' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'ID danh mục sản phẩm', example: 1 })
  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @ApiPropertyOptional({ description: 'ID thương hiệu', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;

  @ApiPropertyOptional({ description: 'ID nông trại canh tác', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  farmId?: number;

  @ApiPropertyOptional({ description: 'Mô tả ngắn hiển thị trên thẻ card', example: 'Sấy mộc 60°C, giữ nguyên lớp vỏ lụa tự nhiên giàu vitamin E.' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết sản phẩm & câu chuyện nông sản' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Quốc gia xuất xứ', example: 'Việt Nam' })
  @IsOptional()
  @IsString()
  originCountry?: string = 'Việt Nam';

  @ApiPropertyOptional({ description: 'Hạn sử dụng tính bằng ngày', example: 270 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  shelfLifeDays?: number = 270;

  @ApiPropertyOptional({ description: 'Xếp hạng Nutri-Score (A, B, C, D, E)', example: 'A' })
  @IsOptional()
  @IsString()
  nutriScoreGrade?: string = 'A';

  @ApiPropertyOptional({ description: 'Đánh dấu sản phẩm nổi bật trang chủ', example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @ApiPropertyOptional({ description: 'Trạng thái sản phẩm (active, draft, inactive, discontinued)', example: 'active' })
  @IsOptional()
  @IsString()
  status?: 'draft' | 'active' | 'inactive' | 'discontinued' = 'active';

  @ApiPropertyOptional({ description: 'Danh sách URL hình ảnh sản phẩm', example: ['/images/almond-1.jpg'] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Bảng thông tin thành phần dinh dưỡng Nutrition Facts' })
  @IsOptional()
  nutritionFacts?: NutritionFactsDto;

  @ApiPropertyOptional({ description: 'Biến thể đóng gói đầu tiên của sản phẩm' })
  @IsOptional()
  initialVariant?: InitialVariantDto;
}
