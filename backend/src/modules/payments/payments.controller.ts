import { Body, Controller, Get, HttpCode, Ip, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Get('methods')
  @ApiOperation({ summary: 'Phương thức thanh toán đang được hỗ trợ' })
  methods() {
    return this.payments.methods();
  }

  @Public()
  @Get('vnpay/verify')
  @ApiOperation({ summary: 'Xác minh kết quả trả về từ VNPay (frontend gọi sau khi redirect)' })
  vnpayVerify(@Query() q: Record<string, string>) {
    return this.payments.verifyVnpay(q);
  }

  @Public()
  @Get('vnpay/ipn')
  @ApiOperation({ summary: 'IPN VNPay (server-to-server)' })
  async vnpayIpn(@Query() q: Record<string, string>) {
    const r = await this.payments.verifyVnpay(q);
    return { RspCode: r.ok ? '00' : r.code || '99', Message: r.ok ? 'Confirm Success' : r.message };
  }

  @Public()
  @Get('momo/verify')
  momoVerify(@Query() q: Record<string, string>) {
    return this.payments.verifyMomo(q);
  }

  @Public()
  @Post('momo/ipn')
  @HttpCode(204)
  async momoIpn(@Body() body: Record<string, string>) {
    await this.payments.verifyMomo(body);
  }

  @Public()
  @Post('retry/:orderNumber')
  @ApiOperation({ summary: 'Tạo lại liên kết thanh toán online cho đơn chưa thanh toán' })
  retry(@Param('orderNumber') orderNumber: string, @CurrentUser() user: CurrentUserPayload | undefined, @Ip() ip: string) {
    return this.payments.retry(orderNumber, user?.id, ip);
  }
}
