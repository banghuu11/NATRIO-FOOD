import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateAddressDto, UpdateUserDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
