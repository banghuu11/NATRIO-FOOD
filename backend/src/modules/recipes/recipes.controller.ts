import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Recipes & Meal Plans')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách các công thức món ăn Eat Clean, Giảm cân, Healthy' })
  findAllRecipes() {
    return this.recipesService.findAllRecipes();
  }

  @Get('meal-plans')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách các kế hoạch thực đơn mẫu (7 ngày Eat Clean, Keto...)' })
  findAllMealPlans() {
    return this.recipesService.findAllMealPlans();
  }

  @Get('meal-plans/:slug')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết thực đơn theo từng ngày' })
  findMealPlanBySlug(@Param('slug') slug: string) {
    return this.recipesService.findMealPlanBySlug(slug);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết công thức món ăn kèm tính năng mua ngay nguyên liệu (Shop the Recipe)' })
  @ApiResponse({ status: 200, description: 'Chi tiết công thức, các bước làm & nguyên liệu' })
  findRecipeBySlug(@Param('slug') slug: string) {
    return this.recipesService.findRecipeBySlug(slug);
  }
}
