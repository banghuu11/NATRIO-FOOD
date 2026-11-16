import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SePayPgClient } = require('sepay-pg-node');

export interface SePayCheckoutParams {
  invoiceCode: string;
  amount: number;
  description: string;
  customerId?: string;
  successUrl?: string;
  errorUrl?: string;
  cancelUrl?: string;
}

@Injectable()
export class SepayService {
  private getConfig() {
    const merchantId = process.env.SEPAY_MERCHANT_ID || 'SP-TEST-THA45536';
    const secretKey = process.env.SEPAY_SECRET_KEY || 'spsk_test_94Y873ANFoddjKnx8N3frEaLsPYN2EnD';
    const env = process.env.SEPAY_ENV || 'sandbox';
    return { merchantId, secretKey, env };
  }

  private getClient() {
    const { merchantId, secretKey, env } = this.getConfig();
    return new SePayPgClient({
      env,
      merchant_id: merchantId,
      secret_key: secretKey,
    });
  }

  createCheckout(params: SePayCheckoutParams) {
    const client = this.getClient();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const checkoutUrl = client.checkout.initCheckoutUrl();
    const fields = client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: params.invoiceCode,
      order_amount: Number(params.amount),
      currency: 'VND',
      order_description: params.description,
      customer_id: params.customerId || 'GUEST',
      success_url: params.successUrl || `${frontendUrl}/checkout/success?orderCode=${params.invoiceCode}&gateway=sepay`,
      error_url: params.errorUrl || `${frontendUrl}/checkout?payment=error&orderCode=${params.invoiceCode}`,
      cancel_url: params.cancelUrl || `${frontendUrl}/checkout?payment=cancel&orderCode=${params.invoiceCode}`,
    });
    return { checkoutUrl, fields };
  }

  verifyIpnSecret(receivedSecret?: string): boolean {
    const { secretKey } = this.getConfig();
    const received = Buffer.from(String(receivedSecret || ''));
    const expected = Buffer.from(secretKey);
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  }
}
