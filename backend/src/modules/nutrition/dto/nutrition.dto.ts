import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum GenderEnum { MALE = 'male', FEMALE = 'female', OTHER = 'other' }
export enum ActivityEnum { SEDENTARY = 'sedentary', LIGHT = 'light', MODERATE = 'moderate', ACTIVE = 'active', VERY_ACTIVE = 'very_active' }
export enum GoalEnum { LOSE = 'lose_weight', MAINTAIN = 'maintain', GAIN_WEIGHT = 'gain_weight', GAIN_MUSCLE = 'gain_muscle', EAT_CLEAN = 'eat_clean', BLOOD_SUGAR = 'control_blood_sugar' }

export class CalculateDto {
  @ApiProperty({ enum: GenderEnum }) @IsEnum(GenderEnum, { message: 'Vui lòng chọn giới tính' })
  gender: GenderEnum;

  @ApiProperty({ example: 28 }) @Type(() => Number) @IsInt({ message: 'Tuổi phải là số nguyên' }) @Min(15, { message: 'Tuổi tối thiểu là 15' }) @Max(90, { message: 'Tuổi tối đa là 90' })
  age: number;

  @ApiProperty({ example: 165 }) @Type(() => Number) @IsNumber() @Min(120, { message: 'Chiều cao từ 120 cm' }) @Max(220, { message: 'Chiều cao tối đa 220 cm' })
  heightCm: number;

  @ApiProperty({ example: 60 }) @Type(() => Number) @IsNumber() @Min(30, { message: 'Cân nặng từ 30 kg' }) @Max(250, { message: 'Cân nặng tối đa 250 kg' })
  weightKg: number;

  @ApiProperty({ enum: ActivityEnum }) @IsEnum(ActivityEnum, { message: 'Vui lòng chọn mức độ vận động' })
  activityLevel: ActivityEnum;

  @ApiProperty({ enum: GoalEnum }) @IsEnum(GoalEnum, { message: 'Vui lòng chọn mục tiêu' })
  goal: GoalEnum;
}

export class SaveProfileDto extends CalculateDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(30) @Max(250)
  targetWeightKg?: number;

  @ApiPropertyOptional({ type: [String], example: ['peanut', 'milk'] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional({ type: [String], example: ['eat_clean'] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  diets?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  medicalNote?: string;
}
