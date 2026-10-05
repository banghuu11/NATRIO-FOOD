import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 1, description: 'ID sản phẩm đánh giá' })
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID mục đơn hàng đã mua (để gắn nhãn Đã mua hàng)' })
  @IsOptional()
  @IsInt()
  orderItemId?: number;

  @ApiProperty({ example: 5, description: 'Số sao đánh giá (1 - 5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Granola rất thơm và giòn, không bị ngọt gắt', description: 'Tiêu đề đánh giá' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Sản phẩm giao nhanh, đóng gói hũ thủy tinh kỹ lưỡng, hạt to đều chất lượng.', description: 'Nội dung nhận xét' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
