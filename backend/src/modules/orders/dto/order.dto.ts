import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { PHONE_RULE } from '../../auth/dto/auth.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export enum PaymentMethodEnum {
  COD = 'cod',
  BANK_TRANSFER = 'bank_transfer',
  VNPAY = 'vnpay',
  MOMO = 'momo',
}

export class QuoteDto {
  @ApiProperty({ type: [Number], description: 'ID các dòng trong giỏ hàng muốn thanh toán' })
  @IsArray() @ArrayMinSize(1, { message: 'Vui lòng chọn ít nhất một sản phẩm' }) @ArrayMaxSize(100) @IsInt({ each: true })
  cartItemIds: number[];

  @ApiPropertyOptional() @IsOptional() @IsInt()
  shippingMethodId?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)
  couponCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  pointsToUse?: number;
}

export class CreateOrderDto extends QuoteDto {
  @ApiProperty({ example: 'Nguyễn Thị Lan' })
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập họ tên người nhận' }) @MaxLength(150)
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  @Transform(trim) @Matches(PHONE_RULE, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiPropertyOptional({ example: 'lan@example.com', description: 'Bắt buộc khi đặt hàng không đăng nhập' })
  @IsOptional() @Transform(trim) @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng chọn Tỉnh/Thành phố' }) @MaxLength(100)
  province: string;

  @ApiProperty({ example: 'Quận 1' })
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng chọn Quận/Huyện' }) @MaxLength(100)
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng chọn Phường/Xã' }) @MaxLength(100)
  ward: string;

  @ApiProperty({ example: '12 Nguyễn Huệ' })
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ chi tiết' }) @MaxLength(255)
  street: string;

  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ description: 'Lưu địa chỉ vào sổ địa chỉ' }) @IsOptional() @IsBoolean()
  saveAddress?: boolean;

  @ApiProperty({ enum: PaymentMethodEnum })
  @IsEnum(PaymentMethodEnum, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod: PaymentMethodEnum;

  @ApiProperty({ description: 'Mã chống tạo đơn trùng, client sinh ngẫu nhiên cho mỗi lần thanh toán' })
  @IsString() @Matches(/^[A-Za-z0-9-]{16,80}$/, { message: 'Mã yêu cầu không hợp lệ' })
  idempotencyKey: string;
}

export class CancelOrderDto {
  @ApiProperty({ example: 'Tôi muốn đổi địa chỉ nhận hàng' })
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng cho biết lý do hủy đơn' }) @MaxLength(300)
  reason: string;
}

export class TrackOrderDto {
  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(20)
  orderNumber: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(20)
  phone: string;
}
