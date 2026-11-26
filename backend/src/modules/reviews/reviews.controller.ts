import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Đánh giá đã duyệt của sản phẩm (lọc theo sao / có ảnh)' })
  forProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('star') star?: string,
    @Query('withImages') withImages?: string,
    @Query('sort') sort?: string,
  ) {
    return this.reviews.forProduct(productId, { page, star: star ? Number(star) : undefined, withImages: withImages === 'true', sort }, user?.id);
  }

  @Public()
  @Get('testimonials')
  testimonials() {
    return this.reviews.testimonials();
  }

  @ApiBearerAuth('JWT-auth')
  @Get('eligible')
  @ApiOperation({ summary: 'Sản phẩm đã nhận hàng nhưng chưa đánh giá' })
  eligible(@CurrentUser() user: CurrentUserPayload) {
    return this.reviews.eligible(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('mine')
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.reviews.mine(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Viết đánh giá (chỉ người đã mua và nhận hàng)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  update(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
    return this.reviews.update(user.id, id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.remove(user.id, id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/helpful')
  @HttpCode(200)
  helpful(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.toggleHelpful(user.id, id);
  }
}
