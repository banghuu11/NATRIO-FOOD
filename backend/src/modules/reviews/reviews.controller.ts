import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá của một sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách đánh giá đã duyệt kèm media & phản hồi' })
  getReviewsByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.getReviewsByProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đăng đánh giá & chấm sao cho sản phẩm' })
  @ApiResponse({ status: 201, description: 'Đánh giá thành công' })
  createReview(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto);
  }
}
