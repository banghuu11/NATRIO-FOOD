import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FefoQueryDto {
  @ApiPropertyOptional({ description: 'ID kho hàng cần lọc (ví dụ: 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  warehouseId?: number;

  @ApiPropertyOptional({
    description: 'Trạng thái cận hạn (critical: <15 ngày, warning: <30 ngày, good: an toàn, all: tất cả)',
    enum: ['all', 'critical', 'warning', 'good'],
    default: 'all',
  })
  @IsOptional()
  @IsString()
  status?: string = 'all';

  @ApiPropertyOptional({ description: 'Tìm kiếm theo mã lô, tên sản phẩm hoặc mã QR', example: 'LOT-GRA' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

