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
  @ApiPropertyOptional({ example: '100% Nông Sản Mộc Tươi Mới', description: 'Huy hiệu / Tagline đầu banner' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({ example: 'Trọn Vẹn Vị Ngọt Tự Nhiên', description: 'Tiêu đề chính của Banner' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Dinh dưỡng thuần khiết từ các loại hạt sấy mộc tự nhiên.', description: 'Mô tả phụ hoặc tóm tắt' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Hạt điều rang củi nguyên vỏ lụa Bình Phước, macca nứt vỏ gỗ Tây Nguyên, hạnh nhân hổ phách nguyên vỏ mộc và óc chó sấy nhiệt thấp. Giữ trọn 100% hương vị và tinh dầu quý giá.', description: 'Mô tả chi tiết nội dung banner' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên.', description: 'Mô tả phụ tiếng Việt' })
  @IsOptional()
  @IsString()
  vnDescription?: string;

  @ApiPropertyOptional({ example: 'Khám Phá Bộ Sưu Tập', description: 'Nội dung nút bấm hành động' })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional({ example: '/products', description: 'Đường dẫn liên kết của nút bấm' })
  @IsOptional()
  @IsString()
  buttonLink?: string;

  @ApiPropertyOptional({ example: 'Sấy mộc 60°C • Giữ nguyên lớp vỏ tự nhiên', description: 'Ghi chú nổi bật / Tiêu chuẩn thương hiệu' })
  @IsOptional()
  @IsString()
  highlightText?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80', description: 'URL hình ảnh nền đằng sau banner' })
  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @ApiPropertyOptional({ example: 'gradient', description: 'Kiểu lớp phủ ảnh nền: gradient | dark | light | subtle | none' })
  @IsOptional()
  @IsString()
  backgroundOverlay?: string;

  @ApiProperty({ enum: BannerRenderMode, default: BannerRenderMode.MODEL_3D, description: 'Chế độ hiển thị: Ảnh tĩnh hoặc Mô hình 3D tương tác' })
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
