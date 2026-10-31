import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateAddressDto, UpdateUserDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách toàn bộ người dùng kèm vai trò, điểm loyalty, số đơn hàng' })
  findAllForAdmin(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.usersService.findAllForAdmin({ search, isActive: activeBool, page, limit });
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: '[ADMIN] Chi tiết người dùng: hồ sơ, sổ địa chỉ, lịch sử mua hàng & LTV' })
  getUserDetail(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserDetail(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Khóa hoặc mở khóa tài khoản người dùng' })
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateUserStatus(id, isActive);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin tài khoản (Họ tên, số điện thoại, avatar)' })
  updateUserInfo(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUserInfo(user.id, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Lấy danh sách sổ địa chỉ nhận hàng của người dùng' })
  getAddresses(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ giao hàng mới' })
  addAddress(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(user.id, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Xóa một địa chỉ khỏi sổ địa chỉ' })
  deleteAddress(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteAddress(user.id, id);
  }
}
