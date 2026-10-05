import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum BannerRenderMode {
  IMAGE = 'image',
  MODEL_3D = '3d',
}

export enum Model3DType {
  NUT_BOWL = 'nut_bowl',
  ALMOND = 'almond',
  MACCA = 'macca',
  GRANOLA_JAR = 'granola_jar',
  CHIA_SEED = 'chia_seed',
}

export class UpdateHeroBannerDto {
  @ApiProperty({ example: 'Artisan Granola', description: 'Tiêu đề chính của Banner' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'An organic healthy food, roasted nuts, and warm botanical.', description: 'Mô tả phụ tiếng Anh' })
  @IsString()
  subtitle: string;

  @ApiPropertyOptional({ example: 'Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên.', description: 'Mô tả phụ tiếng Việt' })
  @IsOptional()
  @IsString()
  vnDescription?: string;

  @ApiProperty({ enum: BannerRenderMode, default: BannerRenderMode.IMAGE, description: 'Chế độ hiển thị: Ảnh tĩnh hoặc Mô hình 3D tương tác' })
  @IsEnum(BannerRenderMode)
  mode: BannerRenderMode;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85', description: 'URL hình ảnh nếu chọn chế độ ảnh tĩnh' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: Model3DType, default: Model3DType.NUT_BOWL, description: 'Loại mô hình 3D (Tô hạt dinh dưỡng, Macca, Hạnh nhân...)' })
  @IsOptional()
  @IsEnum(Model3DType)
  model3dType?: Model3DType;

  @ApiPropertyOptional({ default: true, description: 'Bật xoay 360 độ theo con trỏ chuột' })
  @IsOptional()
  @IsBoolean()
  enable3dRotation?: boolean;

  @ApiPropertyOptional({ example: '#F4EFE6', description: 'Mã màu nền của banner' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;
}
