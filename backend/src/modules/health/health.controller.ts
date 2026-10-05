import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { LogFoodDto, LogWaterDto, UpdateHealthProfileDto } from './dto/health.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Health Profile')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('meta')
  @ApiOperation({ summary: 'Lấy danh sách tất cả dị ứng & chế độ ăn hỗ trợ trong hệ thống' })
  getAllergensAndDiets() {
    return this.healthService.getAllergensAndDiets();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy hồ sơ sức khỏe, BMI, BMR, TDEE & Calo mục tiêu cá nhân' })
  @ApiResponse({ status: 200, description: 'Hồ sơ sức khỏe hiện tại' })
  getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.healthService.getMyHealthProfile(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật chỉ số cơ thể, mục tiêu sức khỏe, dị ứng & chế độ ăn' })
  updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateHealthProfileDto) {
    return this.healthService.updateHealthProfile(user.id, dto);
  }

  @Post('water-log')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ghi nhận lượng nước uống trong ngày (Water Tracker)' })
  logWater(@CurrentUser() user: CurrentUserPayload, @Body() dto: LogWaterDto) {
    return this.healthService.logWater(user.id, dto);
  }

  @Post('food-diary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ghi nhận món ăn vào nhật ký dinh dưỡng (Food Diary Tracker)' })
  logFood(@CurrentUser() user: CurrentUserPayload, @Body() dto: LogFoodDto) {
    return this.healthService.logFood(user.id, dto);
  }
}
