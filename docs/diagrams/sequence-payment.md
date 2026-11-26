# Sơ đồ tuần tự – Thanh toán

Căn cứ: `payments.service.ts`, `payments.controller.ts`, `admin-orders.controller.ts` (`confirmPayment`), `order-lifecycle.service.ts` (`markPaid`, `transition`), `orders.cron.ts`.

> VNPay/MoMo chỉ hoạt động khi `.env` có khóa sandbox. Trong dự án hiện tại hai cổng này **chưa được kiểm thử với cổng thật**. Luồng chuyển khoản và COD đã có trong bộ E2E.

## 1. Chuyển khoản (VietQR) – nhân viên xác nhận

```mermaid
sequenceDiagram
  autonumber
  actor C as Khách hàng
  actor S as NV bán hàng (payment.confirm)
  participant FE as Next.js
  participant API as NestJS
  participant L as OrderLifecycleService
  participant DB as PostgreSQL

  C->>FE: Đặt hàng, chọn "Chuyển khoản"
  FE->>API: POST /orders
  API-->>FE: bankTransfer {qrUrl, số TK, số tiền, nội dung = mã đơn}
  C->>C: Quét VietQR bằng app ngân hàng (ngoài hệ thống)
  S->>FE: Mở chi tiết đơn, bấm "Xác nhận thanh toán"
  FE->>FE: Hộp xác nhận "Xác nhận đã nhận tiền?"
  FE->>API: POST /admin/orders/:id/confirm-payment
  API->>API: RolesGuard: cần payment.confirm (NV kho bị 403)
  API->>L: markPaid(orderId, actorId)
  L->>DB: BEGIN
  alt Đơn đã hủy / hoàn trả
    L-->>FE: 400 "Đơn hàng đã hủy, không thể xác nhận thanh toán"
  else Hợp lệ
    L->>DB: UPDATE payments SET status = paid, paid_at
    L->>DB: UPDATE orders SET payment_status = paid
    L->>DB: INSERT notifications
    L->>DB: COMMIT
    L-->>FE: 200 → "Đã xác nhận thanh toán"
  end
```

## 2. COD

```mermaid
sequenceDiagram
  autonumber
  actor S as Nhân viên (order.update)
  participant API as NestJS
  participant L as OrderLifecycleService
  participant DB as PostgreSQL
  S->>API: PATCH /admin/orders/:id/status {status: delivered}
  API->>L: transition(id, delivered)
  L->>DB: SELECT … FOR UPDATE, kiểm tra shipping → delivered hợp lệ
  L->>DB: payment_method = cod → payments.status = paid, orders.payment_status = paid
  L->>DB: sold_count += qty, shipments → delivered, loyalty_transactions earn
  L-->>API: Đơn đã cập nhật
```

## 3. VNPay (MoMo tương tự, ký HMAC-SHA256)

```mermaid
sequenceDiagram
  autonumber
  actor C as Khách hàng
  participant FE as Next.js
  participant API as NestJS PaymentsService
  participant VP as VNPay sandbox
  participant DB as PostgreSQL
  participant Cron as OrdersCron (10 phút)

  FE->>API: POST /orders {paymentMethod: vnpay}
  API->>DB: orders.payment_status = pending
  API->>API: Tạo URL, ký vnp_SecureHash = HMAC-SHA512(VNPAY_HASH_SECRET)
  API-->>FE: redirectUrl
  FE->>VP: Chuyển hướng khách sang VNPay
  C->>VP: Thanh toán
  par Redirect về trình duyệt
    VP-->>FE: /payment/result?vnp_…
    FE->>API: GET /payments/vnpay/verify?vnp_…
  and IPN server-to-server
    VP->>API: GET /payments/vnpay/ipn?vnp_…
  end
  API->>API: Tính lại chữ ký, so khớp vnp_SecureHash, kiểm tra số tiền
  alt Hợp lệ và mã phản hồi 00
    API->>DB: markPaid() + payment_transactions (success)
  else Sai chữ ký / thất bại
    API-->>FE: Báo thất bại, cho phép "Thanh toán lại" (POST /payments/retry/:orderNumber)
  end
  Note over Cron,DB: Đơn VNPay/MoMo còn pending quá 60 phút
  Cron->>DB: transition(cancelled) → nhả hàng, hoàn điểm, trả lượt mã
```
