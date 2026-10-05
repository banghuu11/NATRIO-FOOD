import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ActivityLevelEnum {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

export enum GoalTypeEnum {
  LOSE_WEIGHT = 'lose_weight',
  MAINTAIN = 'maintain',
  GAIN_MUSCLE = 'gain_muscle',
  EAT_CLEAN = 'eat_clean',
  CONTROL_BLOOD_SUGAR = 'control_blood_sugar',
}

export class UpdateHealthProfileDto {
  @ApiProperty({ example: 170.0, description: 'Chiều cao (cm)' })
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm: number;

  @ApiProperty({ example: 68.0, description: 'Cân nặng hiện tại (kg)' })
  @IsNumber()
  @Min(20)
  @Max(300)
  weightKg: number;

  @ApiPropertyOptional({ example: 62.0, description: 'Cân nặng mục tiêu (kg)' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  targetWeightKg?: number;

  @ApiProperty({ enum: ActivityLevelEnum, example: ActivityLevelEnum.MODERATE, description: 'Mức độ vận động' })
  @IsEnum(ActivityLevelEnum)
  activityLevel: ActivityLevelEnum;

  @ApiProperty({ enum: GoalTypeEnum, example: GoalTypeEnum.LOSE_WEIGHT, description: 'Mục tiêu sức khỏe' })
  @IsEnum(GoalTypeEnum)
  goal: GoalTypeEnum;

  @ApiPropertyOptional({ example: 'Không dung nạp đường tinh luyện', description: 'Ghi chú y tế hoặc bệnh lý' })
  @IsOptional()
  @IsString()
  medicalNote?: string;

  @ApiPropertyOptional({ example: ['tree_nut', 'gluten'], description: 'Danh sách mã dị ứng của người dùng' })
  @IsOptional()
  @IsArray()
  allergenCodes?: string[];

  @ApiPropertyOptional({ example: ['eat_clean', 'high_protein'], description: 'Danh sách mã chế độ ăn quan tâm' })
  @IsOptional()
  @IsArray()
  dietCodes?: string[];
}

export class LogWaterDto {
  @ApiProperty({ example: 250, description: 'Lượng nước uống thêm (ml)' })
  @IsInt()
  @Min(50)
  @Max(2000)
  amountMl: number;
}

export class LogFoodDto {
  @ApiPropertyOptional({ example: 1, description: 'ID sản phẩm trong hệ thống (nếu có)' })
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiPropertyOptional({ example: 'Yến mạch ngâm sữa chua', description: 'Tên món ăn tùy chỉnh (nếu không chọn từ sản phẩm)' })
  @IsOptional()
  @IsString()
  customFoodName?: string;

  @ApiProperty({ example: 'breakfast', enum: ['breakfast', 'lunch', 'dinner', 'snack'], description: 'Bữa ăn trong ngày' })
  @IsString()
  @IsNotEmpty()
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  @ApiProperty({ example: 150, description: 'Khối lượng thức ăn (gram)' })
  @IsNumber()
  @Min(1)
  quantityG: number;

  @ApiPropertyOptional({ example: 350, description: 'Lượng Calo (kcal)' })
  @IsOptional()
  @IsNumber()
  caloriesKcal?: number;

  @ApiPropertyOptional({ example: 15, description: 'Lượng Protein (g)' })
  @IsOptional()
  @IsNumber()
  proteinG?: number;

  @ApiPropertyOptional({ example: 45, description: 'Lượng Carb (g)' })
  @IsOptional()
  @IsNumber()
  carbohydrateG?: number;

  @ApiPropertyOptional({ example: 8, description: 'Lượng Fat (g)' })
  @IsOptional()
  @IsNumber()
  fatG?: number;
}
