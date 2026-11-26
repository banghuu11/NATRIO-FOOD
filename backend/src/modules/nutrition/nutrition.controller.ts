import { Body, Controller, Get, HttpCode, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { CalculateDto, SaveProfileDto } from './dto/nutrition.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import { Goal } from './nutrition.calc';

@ApiTags('Nutrition')
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  @Public()
  @Get('options')
  options() {
    return this.nutrition.options();
  }

  @Public()
  @Post('calculate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tính BMI, BMR, TDEE, calo & macro khuyến nghị (không cần đăng nhập)' })
  calculate(@Body() dto: CalculateDto) {
    return this.nutrition.calculate(dto);
  }

  @Public()
  @Get('recommendations')
  @ApiOperation({ summary: 'Gợi ý sản phẩm theo mục tiêu, loại trừ thành phần dị ứng' })
  recommendations(@Query('goal') goal: Goal = 'eat_clean', @Query('excludeAllergens') ex = '') {
    return this.nutrition.recommendations(goal, ex.split(',').filter(Boolean));
  }

  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @ApiOperation({ summary: 'Hồ sơ sức khỏe của tôi' })
  profile(@CurrentUser() user: CurrentUserPayload) {
    return this.nutrition.getProfile(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Put('profile')
  @ApiOperation({ summary: 'Lưu hồ sơ sức khỏe (giới tính, tuổi, chiều cao, cân nặng, vận động, mục tiêu, dị ứng)' })
  save(@CurrentUser() user: CurrentUserPayload, @Body() dto: SaveProfileDto) {
    return this.nutrition.saveProfile(user.id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('profile/recommendations')
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.nutrition.myRecommendations(user.id);
  }
}
