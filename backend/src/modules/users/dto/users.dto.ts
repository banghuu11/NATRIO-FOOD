import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn An', description: 'Họ và tên' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567', description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', description: 'Ảnh đại diện avatar' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'male', enum: ['male', 'female', 'other'], description: 'Giới tính' })
  @IsOptional()
  @IsString()
  gender?: 'male' | 'female' | 'other';
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Nhà riêng', description: 'Nhãn địa chỉ (Nhà riêng / Công ty)' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'Nguyễn Văn An', description: 'Tên người nhận' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0901234567', description: 'Số điện thoại người nhận' })
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

  @ApiPropertyOptional({ example: 'Giao giờ hành chính', description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: true, description: 'Đặt làm địa chỉ mặc định' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
