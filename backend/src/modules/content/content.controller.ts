import { Body, Controller, DefaultValuePipe, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContentService } from './content.service';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { cleanText } from '../reviews/dto/review.dto';

class NewsletterDto {
  @ApiProperty() @Transform(({ value }) => String(value ?? '').trim().toLowerCase()) @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

class ContactDto {
  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập họ tên' }) @MaxLength(150)
  name: string;

  @ApiProperty() @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiPropertyOptional() @IsOptional() @Transform(cleanText) @IsString() @MaxLength(200)
  subject?: string;

  @ApiProperty() @Transform(cleanText) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập nội dung cần tư vấn' }) @MaxLength(3000)
  message: string;
}

@ApiTags('Content')
@Public()
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('home')
  @ApiOperation({ summary: 'Toàn bộ dữ liệu trang chủ' })
  home() {
    return this.content.home();
  }

  @Get('banners')
  banners(@Query('position') position = 'home_hero') {
    return this.content.banners(position);
  }

  @Get('store-info')
  storeInfo() {
    return this.content.settings();
  }

  @Get('posts')
  posts(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('category') category?: string) {
    return this.content.posts(page, 9, category);
  }

  @Get('posts/:slug')
  post(@Param('slug') slug: string) {
    return this.content.post(slug);
  }

  @Get('pages')
  pages() {
    return this.content.pagesList();
  }

  @Get('pages/:slug')
  page(@Param('slug') slug: string) {
    return this.content.page(slug);
  }

  @Get('promotions/coupons')
  coupons() {
    return this.content.coupons();
  }

  @Get('promotions/bundles')
  bundles() {
    return this.content.bundles();
  }

  @Get('promotions/bundles/:slug')
  bundle(@Param('slug') slug: string) {
    return this.content.bundle(slug);
  }

  @Get('promotions/flash-sale')
  flashSale() {
    return this.content.flashSale();
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('newsletter')
  @HttpCode(200)
  newsletter(@Body() dto: NewsletterDto) {
    return this.content.subscribe(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('contact')
  @HttpCode(200)
  @ApiOperation({ summary: 'Gửi yêu cầu tư vấn dinh dưỡng / liên hệ' })
  contact(@Body() dto: ContactDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.content.contact(dto, user?.id);
  }
}
