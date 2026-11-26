import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';

/** Strips HTML tags and control chars from user text (defence in depth against XSS). */
export const cleanText = ({ value }: { value: unknown }) =>
  // eslint-disable-next-line no-control-regex -- stripping control characters is intentional
  typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim() : value;

export class CreateReviewDto {
  @ApiProperty() @IsInt() @Min(1)
  orderItemId: number;

  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1, { message: 'Vui lòng chọn số sao' }) @Max(5)
  rating: number;

  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MinLength(10, { message: 'Nhận xét cần ít nhất 10 ký tự' }) @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(5) @IsUrl({ require_tld: false }, { each: true })
  images?: string[];
}

export class UpdateReviewDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5)
  rating?: number;

  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MinLength(10, { message: 'Nhận xét cần ít nhất 10 ký tự' }) @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(5) @IsUrl({ require_tld: false }, { each: true })
  images?: string[];
}
