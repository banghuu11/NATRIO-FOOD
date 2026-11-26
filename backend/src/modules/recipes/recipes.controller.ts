import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { meal_type } from '@prisma/client';
import { RecipesService } from './recipes.service';
import { GeneratePlanDto, PlanCartDto, SavePlanDto, SwapMealDto } from './dto/recipes.dto';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Recipes & Meal Plans')
@Controller()
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  @Public()
  @Get('recipes')
  @ApiOperation({ summary: 'Công thức Eat Clean / Keto / Vegan (lọc theo chế độ, bữa, calo)' })
  list(
    @Query('diet') diet?: string,
    @Query('mealType') mealType?: meal_type,
    @Query('maxCalories') maxCalories?: string,
    @Query('q') q?: string,
    @Query('excludeAllergens') ex?: string,
  ) {
    return this.recipes.list({ diet, mealType, maxCalories: maxCalories ? Number(maxCalories) : undefined, search: q, excludeAllergens: ex?.split(',').filter(Boolean) });
  }

  @Public()
  @Get('recipes/:slug')
  detail(@Param('slug') slug: string) {
    return this.recipes.detail(slug);
  }

  @Public()
  @Post('meal-plans/generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tạo thực đơn 7 ngày theo mục tiêu calo và dị ứng' })
  generate(@Body() dto: GeneratePlanDto) {
    return this.recipes.generate(dto);
  }

  @Public()
  @Post('meal-plans/swap')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đổi món cho một bữa trong thực đơn' })
  swap(@Body() dto: SwapMealDto) {
    return this.recipes.swap(dto);
  }

  @Public()
  @Post('meal-plans/cart-items')
  @HttpCode(200)
  @ApiOperation({ summary: 'Quy đổi nguyên liệu của thực đơn thành sản phẩm để thêm vào giỏ' })
  cartItems(@Body() dto: PlanCartDto) {
    return this.recipes.planCartItems(dto.meals);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('meal-plans')
  @ApiOperation({ summary: 'Lưu thực đơn vào tài khoản' })
  save(@CurrentUser() user: CurrentUserPayload, @Body() dto: SavePlanDto) {
    return this.recipes.savePlan(user.id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('meal-plans/mine')
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.recipes.myPlan(user.id);
  }
}
