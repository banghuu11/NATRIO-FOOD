import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodEnum {
  COD = 'cod',
  VNPAY = 'vnpay',
  MOMO = 'momo',
  BANK_TRANSFER = 'bank_transfer',
}

export class OrderItemDto {
  @ApiProperty({ example: 1, description: 'ID của biến thể sản phẩm' })
  @IsInt()
  variantId: number;

  @ApiProperty({ example: 2, description: 'Số lượng đặt mua' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Nguyễn Thị Lan', description: 'Họ tên người nhận' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0901234567', description: 'Số điện thoại nhận hàng' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh', description: 'Tỉnh / Thành phố' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: 'Quận 1', description: 'Quận / Huyện' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé', description: 'Phường / Xã' })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({ example: '12 Nguyễn Huệ', description: 'Địa chỉ chi tiết' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiPropertyOptional({ example: 'Giao giờ hành chính', description: 'Ghi chú đơn hàng' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ enum: PaymentMethodEnum, example: PaymentMethodEnum.COD, description: 'Phương thức thanh toán' })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @ApiPropertyOptional({ example: 1, description: 'ID phương thức vận chuyển' })
  @IsOptional()
  @IsInt()
  shippingMethodId?: number;

  @ApiPropertyOptional({ example: 'WELCOME10', description: 'Mã giảm giá áp dụng' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 0, description: 'Số điểm tích lũy muốn sử dụng (1 điểm = 100đ)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToUse?: number;

  @ApiProperty({ type: [OrderItemDto], description: 'Danh sách sản phẩm đặt mua' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
