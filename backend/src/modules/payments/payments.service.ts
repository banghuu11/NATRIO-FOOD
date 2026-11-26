import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderLifecycleService } from '../orders/order-lifecycle.service';

/**
 * Payment gateways.
 * - COD & bank transfer always available. Bank transfer stays "unpaid" until staff confirms the money arrived.
 * - VNPay / MoMo are only offered when their sandbox keys exist in .env.
 *   An order is marked paid ONLY after the gateway's signed response is verified.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('Payments');

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private lifecycle: OrderLifecycleService,
  ) {}

  get vnpayEnabled() {
    return !!(this.config.get('VNPAY_TMN_CODE') && this.config.get('VNPAY_HASH_SECRET'));
  }
  get momoEnabled() {
    return !!(this.config.get('MOMO_PARTNER_CODE') && this.config.get('MOMO_ACCESS_KEY') && this.config.get('MOMO_SECRET_KEY'));
  }
  private get frontendUrl() {
    return (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000').replace(/\/$/, '');
  }

  methods() {
    return [
      { code: 'cod', name: 'Thanh toán khi nhận hàng (COD)', description: 'Trả tiền mặt cho nhân viên giao hàng', enabled: true },
      { code: 'bank_transfer', name: 'Chuyển khoản ngân hàng', description: 'Quét mã VietQR, đơn được xác nhận sau khi NUTRIO nhận tiền', enabled: true },
      { code: 'vnpay', name: 'VNPay', description: this.vnpayEnabled ? 'Thẻ ATM / Visa / QR qua cổng VNPay (sandbox)' : 'Chưa cấu hình cổng VNPay', enabled: this.vnpayEnabled },
      { code: 'momo', name: 'Ví MoMo', description: this.momoEnabled ? 'Thanh toán qua ví MoMo (sandbox)' : 'Chưa cấu hình cổng MoMo', enabled: this.momoEnabled },
    ];
  }

  isEnabled(method: string) {
    return this.methods().some((m) => m.code === method && m.enabled);
  }

  bankTransferInfo(orderNumber: string, amount: number) {
    const bin = this.config.get('BANK_BIN') || '970436';
    const acc = this.config.get('BANK_ACCOUNT_NO') || '0000000000';
    const name = this.config.get('BANK_ACCOUNT_NAME') || 'NUTRIO FOOD';
    return {
      bankName: this.config.get('BANK_NAME') || 'Vietcombank',
      accountNo: acc,
      accountName: name,
      amount,
      content: orderNumber,
      qrUrl: `https://img.vietqr.io/image/${bin}-${acc}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(orderNumber)}&accountName=${encodeURIComponent(name)}`,
    };
  }

  /** Builds the redirect URL for an online gateway, or null for offline methods. */
  async createPaymentUrl(order: { id: bigint; order_number: string; total_amount: unknown; payment_method: string }, clientIp: string) {
    if (order.payment_method === 'vnpay') return this.vnpayUrl(order, clientIp);
    if (order.payment_method === 'momo') return this.momoUrl(order);
    return null;
  }

  // ---------------- VNPay ----------------
  private vnpSign(params: Record<string, string>) {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
      .join('&');
    const hash = createHmac('sha512', this.config.getOrThrow<string>('VNPAY_HASH_SECRET')).update(Buffer.from(sorted, 'utf-8')).digest('hex');
    return { query: sorted, hash };
  }

  private vnpayUrl(order: { order_number: string; total_amount: unknown }, ip: string) {
    const now = new Date(Date.now() + 7 * 3600 * 1000); // GMT+7
    const fmt = (d: Date) => d.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.getOrThrow('VNPAY_TMN_CODE'),
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: order.order_number,
      vnp_OrderInfo: `Thanh toan don hang ${order.order_number}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(Number(order.total_amount)) * 100),
      vnp_ReturnUrl: `${this.frontendUrl}/payment/result?gateway=vnpay`,
      vnp_IpAddr: ip || '127.0.0.1',
      vnp_CreateDate: fmt(now),
      vnp_ExpireDate: fmt(new Date(now.getTime() + 15 * 60 * 1000)),
    };
    const { query, hash } = this.vnpSign(params);
    return `${this.config.get('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'}?${query}&vnp_SecureHash=${hash}`;
  }

  /** Verifies a VNPay return/IPN query and marks the order paid when valid. */
  async verifyVnpay(query: Record<string, string>) {
    if (!this.vnpayEnabled) throw new BadRequestException('VNPay chưa được cấu hình');
    const { vnp_SecureHash, vnp_SecureHashType: _t, ...rest } = query;
    const params = Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith('vnp_'))) as Record<string, string>;
    const { hash } = this.vnpSign(params);
    if (!vnp_SecureHash || hash.toLowerCase() !== vnp_SecureHash.toLowerCase()) return { ok: false, code: '97', message: 'Chữ ký không hợp lệ' };
    const order = await this.prisma.orders.findUnique({ where: { order_number: params.vnp_TxnRef } });
    if (!order) return { ok: false, code: '01', message: 'Không tìm thấy đơn hàng' };
    if (Number(params.vnp_Amount) !== Math.round(Number(order.total_amount)) * 100) return { ok: false, code: '04', message: 'Số tiền không khớp', orderNumber: order.order_number };
    if (params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00') {
      await this.lifecycle.markPaid(order.id, { providerTxnId: params.vnp_TransactionNo, gateway: 'vnpay', payload: params });
      return { ok: true, code: '00', message: 'Thanh toán thành công', orderNumber: order.order_number, orderId: Number(order.id) };
    }
    await this.prisma.orders.update({ where: { id: order.id }, data: { payment_status: 'failed' } });
    return { ok: false, code: params.vnp_ResponseCode, message: 'Giao dịch không thành công hoặc đã bị hủy', orderNumber: order.order_number, orderId: Number(order.id) };
  }

  // ---------------- MoMo ----------------
  private async momoUrl(order: { order_number: string; total_amount: unknown }) {
    const partnerCode = this.config.getOrThrow<string>('MOMO_PARTNER_CODE');
    const accessKey = this.config.getOrThrow<string>('MOMO_ACCESS_KEY');
    const secretKey = this.config.getOrThrow<string>('MOMO_SECRET_KEY');
    const requestId = `${order.order_number}-${Date.now()}`;
    const amount = String(Math.round(Number(order.total_amount)));
    const redirectUrl = `${this.frontendUrl}/payment/result?gateway=momo`;
    const ipnUrl = `${(this.config.get('PUBLIC_API_URL') || 'http://localhost:5001').replace(/\/$/, '')}/api/v1/payments/momo/ipn`;
    const orderInfo = `Thanh toan don hang ${order.order_number}`;
    const raw = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${requestId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
    const signature = createHmac('sha256', secretKey).update(raw).digest('hex');
    const res = await fetch(this.config.get('MOMO_ENDPOINT') || 'https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerCode, accessKey, requestId, amount, orderId: requestId, orderInfo, redirectUrl, ipnUrl, extraData: '', requestType: 'captureWallet', signature, lang: 'vi' }),
    });
    const json = (await res.json()) as { payUrl?: string; message?: string };
    if (!json.payUrl) {
      this.logger.error(`MoMo create failed: ${json.message}`);
      throw new BadRequestException('Không tạo được giao dịch MoMo, vui lòng chọn phương thức khác');
    }
    return json.payUrl;
  }

  async verifyMomo(q: Record<string, string>) {
    if (!this.momoEnabled) throw new BadRequestException('MoMo chưa được cấu hình');
    const accessKey = this.config.getOrThrow<string>('MOMO_ACCESS_KEY');
    const raw = `accessKey=${accessKey}&amount=${q.amount}&extraData=${q.extraData ?? ''}&message=${q.message}&orderId=${q.orderId}&orderInfo=${q.orderInfo}&orderType=${q.orderType}&partnerCode=${q.partnerCode}&payType=${q.payType}&requestId=${q.requestId}&responseTime=${q.responseTime}&resultCode=${q.resultCode}&transId=${q.transId}`;
    const sig = createHmac('sha256', this.config.getOrThrow<string>('MOMO_SECRET_KEY')).update(raw).digest('hex');
    if (sig !== q.signature) return { ok: false, message: 'Chữ ký không hợp lệ' };
    const orderNumber = String(q.orderId).split('-')[0];
    const order = await this.prisma.orders.findUnique({ where: { order_number: orderNumber } });
    if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng' };
    if (Number(q.amount) !== Math.round(Number(order.total_amount))) return { ok: false, message: 'Số tiền không khớp', orderNumber };
    if (String(q.resultCode) === '0') {
      await this.lifecycle.markPaid(order.id, { providerTxnId: String(q.transId), gateway: 'momo', payload: q });
      return { ok: true, message: 'Thanh toán thành công', orderNumber, orderId: Number(order.id) };
    }
    await this.prisma.orders.update({ where: { id: order.id }, data: { payment_status: 'failed' } });
    return { ok: false, message: q.message || 'Giao dịch không thành công', orderNumber, orderId: Number(order.id) };
  }

  /** Lets a customer retry payment for an unpaid online order. */
  async retry(orderNumber: string, userId: number | undefined, ip: string) {
    const order = await this.prisma.orders.findUnique({ where: { order_number: orderNumber } });
    if (!order || (order.user_id && Number(order.user_id) !== userId)) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.payment_status === 'paid') throw new BadRequestException('Đơn hàng đã được thanh toán');
    if (order.status !== 'pending') throw new BadRequestException('Đơn hàng không còn ở trạng thái chờ thanh toán');
    const url = await this.createPaymentUrl(order, ip);
    if (!url) throw new BadRequestException('Phương thức thanh toán của đơn không hỗ trợ thanh toán lại');
    return { redirectUrl: url };
  }
}
