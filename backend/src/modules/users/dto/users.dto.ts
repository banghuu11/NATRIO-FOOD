import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength, Min } from 'class-validator';
import { PHONE_RULE } from '../../auth/dto/auth.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @IsNotEmpty({ message: 'Họ tên không được để trống' }) @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional() @IsOptional() @Transform(trim) @Matches(PHONE_RULE, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiPropertyOptional({ enum: GenderEnum }) @IsOptional() @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ example: '1999-05-20' }) @IsOptional() @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }, { message: 'Ảnh đại diện không hợp lệ' })
  avatarUrl?: string;
}

export class AddressDto {
  @ApiPropertyOptional({ example: 'Nhà riêng' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(40)
  label?: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập tên người nhận' }) @MaxLength(150)
  recipientName: string;

  @ApiProperty() @Transform(trim) @Matches(PHONE_RULE, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng chọn Tỉnh/Thành phố' }) @MaxLength(100)
  province: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng chọn Quận/Huyện' }) @MaxLength(100)
  district: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng chọn Phường/Xã' }) @MaxLength(100)
  ward: string;

  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ chi tiết' }) @MaxLength(255)
  street: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isDefault?: boolean;
}

export class PriceAlertDto {
  @ApiProperty() @IsInt() @Min(1)
  productId: number;
}
