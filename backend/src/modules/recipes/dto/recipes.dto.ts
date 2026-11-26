import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export enum MealTypeEnum { BREAKFAST = 'breakfast', LUNCH = 'lunch', DINNER = 'dinner', SNACK = 'snack' }

export class GeneratePlanDto {
  @ApiProperty({ example: 1800 }) @Type(() => Number) @IsInt() @Min(1000, { message: 'Mục tiêu calo tối thiểu 1.000 kcal' }) @Max(5000)
  targetCalories: number;

  @ApiPropertyOptional({ default: 7 }) @IsOptional() @IsInt() @Min(1) @Max(7)
  days?: number;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  excludeAllergens?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  diet?: string;
}

export class SwapMealDto {
  @ApiProperty({ enum: MealTypeEnum }) @IsEnum(MealTypeEnum)
  mealType: MealTypeEnum;

  @ApiProperty() @IsNumber() @Min(50) @Max(3000)
  targetKcal: number;

  @ApiPropertyOptional({ type: [Number] }) @IsOptional() @IsArray() @IsInt({ each: true })
  excludeRecipeIds?: number[];

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true })
  excludeAllergens?: string[];
}

export class PlanMealRefDto {
  @ApiProperty({ enum: MealTypeEnum }) @IsOptional() @IsEnum(MealTypeEnum)
  mealType: MealTypeEnum;

  @ApiProperty() @IsInt() @Min(1)
  recipeId: number;

  @ApiProperty() @IsNumber() @Min(0.25) @Max(4)
  servings: number;
}

export class PlanDayDto {
  @ApiProperty() @IsInt() @Min(1) @Max(7)
  day: number;

  @ApiProperty({ type: [PlanMealRefDto] }) @IsArray() @ArrayMaxSize(6) @ValidateNested({ each: true }) @Type(() => PlanMealRefDto)
  meals: PlanMealRefDto[];
}

export class SavePlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  name?: string;

  @ApiProperty() @IsInt() @Min(1000) @Max(5000)
  targetCalories: number;

  @ApiProperty({ type: [PlanDayDto] }) @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => PlanDayDto)
  days: PlanDayDto[];
}

export class PlanCartDto {
  @ApiProperty({ type: [PlanMealRefDto] }) @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => PlanMealRefDto)
  meals: PlanMealRefDto[];
}
