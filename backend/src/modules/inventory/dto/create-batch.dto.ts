import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBatchDto {
  @ApiProperty({ description: 'ID biến thể sản phẩm', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId: number;

  @ApiPropertyOptional({ description: 'ID nông trại canh tác', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  farmId?: number;

  @ApiPropertyOptional({ description: 'ID nhà cung cấp', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  supplierId?: number;

  @ApiProperty({ description: 'Mã lô hàng sản xuất', example: 'LOT-ALM-2610-01' })
  @IsString()
  @IsNotEmpty()
  batchCode: string;

  @ApiPropertyOptional({ description: 'Mã QR truy xuất nguồn gốc (nếu để trống hệ thống sẽ tự sinh)' })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional({ description: 'Ngày thu hoạch nông sản', example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  harvestedOn?: string;

  @ApiProperty({ description: 'Ngày sản xuất / chế biến / đóng gói', example: '2026-10-10' })
  @IsDateString()
  manufacturedOn: string;

  @ApiProperty({ description: 'Ngày hết hạn sử dụng (FEFO)', example: '2027-04-10' })
  @IsDateString()
  expiresOn: string;

  @ApiPropertyOptional({ description: 'Ngày nhập kho', example: '2026-10-15' })
  @IsOptional()
  @IsDateString()
  receivedOn?: string;

  @ApiProperty({ description: 'Số lượng nhập kho', example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityReceived: number;

  @ApiProperty({ description: 'Giá vốn nhập trên 1 đơn vị (VND)', example: 95000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiProperty({ description: 'ID kho nhập hàng', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId: number;

  @ApiPropertyOptional({ description: 'Ghi chú kết quả kiểm nghiệm ATTP' })
  @IsOptional()
  @IsString()
  labResultNote?: string;
}

