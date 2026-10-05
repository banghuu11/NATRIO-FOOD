import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiPropertyOptional({ example: 1, description: 'ID của variant sản phẩm' })
  @IsOptional()
  @IsInt()
  variantId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID của bundle/combo (nếu mua theo combo)' })
  @IsOptional()
  @IsInt()
  bundleId?: number;

  @ApiProperty({ example: 1, description: 'Số lượng mua' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'guest-session-uuid-12345', description: 'Session token dành cho khách vãng lai chưa đăng nhập' })
  @IsOptional()
  @IsString()
  sessionToken?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, description: 'Số lượng mới' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'WELCOME10', description: 'Mã giảm giá voucher' })
  @IsString()
  @IsNotEmpty()
  couponCode: string;

  @ApiPropertyOptional({ example: 'guest-session-uuid-12345', description: 'Session token nếu là khách vãng lai' })
  @IsOptional()
  @IsString()
  sessionToken?: string;
}
