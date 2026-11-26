import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class AddCartItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt() @Min(1)
  variantId?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1)
  bundleId?: number;

  @ApiProperty({ example: 1 })
  @IsInt() @Min(1) @Max(99)
  quantity: number;
}

export class BulkAddDto {
  @ApiProperty({ type: [AddCartItemDto] })
  @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => AddCartItemDto)
  items: AddCartItemDto[];
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2 })
  @IsInt() @Min(1) @Max(99)
  quantity: number;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString() @IsNotEmpty({ message: 'Vui lòng nhập mã giảm giá' }) @MaxLength(40)
  code: string;
}

export class MergeCartDto {
  @ApiProperty()
  @IsString() @MaxLength(80)
  guestToken: string;
}
