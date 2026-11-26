import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

class SubItemDto {
  @ApiProperty() @IsInt() @Min(1) variantId: number;
  @ApiProperty() @IsInt() @Min(1) @Max(20) quantity: number;
}

class CreateSubscriptionDto {
  @ApiProperty() @IsInt() @Min(1) planId: number;
  @ApiProperty() @IsInt() @Min(1) addressId: number;
  @ApiProperty({ type: [SubItemDto] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SubItemDto) items: SubItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
}

class UpdateSubscriptionDto {
  @ApiProperty({ enum: ['pause', 'resume', 'cancel', 'skip'] }) @IsIn(['pause', 'resume', 'cancel', 'skip']) action: 'pause' | 'resume' | 'cancel' | 'skip';
  @ApiPropertyOptional() @IsOptional() @IsDateString() pausedUntil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) reason?: string;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  @Public()
  @Get('plans')
  plans() {
    return this.subs.plans();
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.subs.mine(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateSubscriptionDto) {
    return this.subs.create(user.id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  update(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubscriptionDto) {
    return this.subs.update(user.id, id, dto.action, dto);
  }
}
