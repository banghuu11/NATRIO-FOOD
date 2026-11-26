import { order_status } from '@prisma/client';

export const ORDER_STATUS_LABEL: Record<order_status, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang chuẩn bị hàng',
  shipping: 'Đang giao',
  delivered: 'Giao thành công',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  returned: 'Hoàn trả / Hoàn tiền',
};

/** Allowed status transitions. */
export const ORDER_TRANSITIONS: Record<order_status, order_status[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'returned'],
  delivered: ['completed', 'returned'],
  completed: ['returned'],
  cancelled: [],
  returned: [],
};

/** Customers may cancel by themselves only before the order is being prepared. */
export const CUSTOMER_CANCELLABLE: order_status[] = ['pending', 'confirmed'];

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  vnpay: 'VNPay',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  card: 'Thẻ',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  pending: 'Đang chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền',
  partially_refunded: 'Hoàn tiền một phần',
};
