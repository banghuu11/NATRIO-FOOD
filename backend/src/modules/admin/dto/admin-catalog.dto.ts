import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { cleanText } from '../../reviews/dto/review.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class VariantInput {
  @ApiPropertyOptional() @IsOptional() @IsInt() id?: number;
  @ApiProperty() @Transform(trim) @Matches(/^[A-Z0-9-]{2,60}$/i, { message: 'SKU chỉ gồm chữ, số và dấu gạch ngang' }) sku: string;
  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty({ message: 'Tên biến thể không được trống' }) @MaxLength(150) name: string;
  @ApiProperty() @IsNumber() @Min(1, { message: 'Khối lượng phải > 0' }) netWeightG: number;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) compareAtPrice?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) costPrice?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) reorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) unitLabel?: string;
}

export class NutritionInput {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) servingSizeG?: number | null;
  @ApiProperty() @IsNumber() @Min(0) caloriesKcal: number;
  @ApiProperty() @IsNumber() @Min(0) proteinG: number;
  @ApiProperty() @IsNumber() @Min(0) carbG: number;
  @ApiProperty() @IsNumber() @Min(0) fatG: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sugarG?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) fiberG?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) saturatedFatG?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sodiumMg?: number;
}

export class ImageInput {
  @ApiProperty() @IsString() @MaxLength(1000) url: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) altText?: string;
}

export class AllergenInput {
  @ApiProperty() @IsString() code: string;
  @ApiProperty({ enum: ['contains', 'may_contain'] }) @IsIn(['contains', 'may_contain']) relation: 'contains' | 'may_contain';
}

export class IngredientInput {
  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150) name: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) percentage?: number | null;
}

export class ProductInput {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty({ message: 'Tên sản phẩm không được trống' }) @MaxLength(255) name: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @Matches(/^[a-z0-9-]+$/, { message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang' }) slug?: string;
  @ApiProperty() @Type(() => Number) @IsInt({ message: 'Vui lòng chọn danh mục' }) categoryId: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() brandId?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() farmId?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() supplierId?: number | null;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(500) shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(10000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) originCountry?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(2000) storageInstruction?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(2000) usageInstruction?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) shelfLifeDays?: number | null;
  @ApiProperty({ enum: ['draft', 'active', 'inactive', 'discontinued'] }) @IsEnum(['draft', 'active', 'inactive', 'discontinued'] as const) status: 'draft' | 'active' | 'inactive' | 'discontinued';
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiProperty({ type: [VariantInput] }) @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => VariantInput) variants: VariantInput[];
  @ApiPropertyOptional({ type: [ImageInput] }) @IsOptional() @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => ImageInput) images?: ImageInput[];
  @ApiPropertyOptional({ type: NutritionInput }) @IsOptional() @ValidateNested() @Type(() => NutritionInput) nutrition?: NutritionInput | null;
  @ApiPropertyOptional({ type: [AllergenInput] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AllergenInput) allergens?: AllergenInput[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) diets?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];
  @ApiPropertyOptional({ type: [IngredientInput] }) @IsOptional() @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => IngredientInput) ingredients?: IngredientInput[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) metaTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(320) metaDescription?: string;
}

export class CategoryInput {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty({ message: 'Tên danh mục không được trống' }) @MaxLength(120) name: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @Matches(/^[a-z0-9-]+$/, { message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang' }) slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() parentId?: number | null;
  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(1000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) imageUrl?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
