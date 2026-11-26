# Sơ đồ tuần tự – Quản lý đơn hàng (chuyển trạng thái)

Căn cứ: `admin-orders.controller.ts` (`updateStatus`), `order-lifecycle.service.ts` (`transition`), `order-status.ts` (`ORDER_TRANSITIONS`), trigger `trg_order_status_history`, `trg_order_status_stamp`.

```mermaid
sequenceDiagram
  autonumber
  actor S as Nhân viên (order.update)
  participant FE as Next.js /admin/orders/[id]
  participant AC as AdminOrdersController
  participant L as OrderLifecycleService
  participant DB as PostgreSQL
  participant N as Notifications / Mail

  S->>FE: Mở đơn → khung "Xử lý đơn hàng" chỉ hiện bước hợp lệ
  S->>FE: Chọn trạng thái mới + ghi chú
  FE->>AC: PATCH /admin/orders/:id/status {status, note}
  AC->>AC: RolesGuard: order.update
  opt status = returned
    AC->>AC: Cần thêm payment.confirm (hoặc Super Admin), nếu không → 403
  end
  AC->>L: transition(id, status, {actorId, note})
  L->>DB: BEGIN, set_config(app.current_user_id)
  L->>DB: SELECT id FROM orders WHERE id = ? FOR UPDATE
  L->>L: ORDER_TRANSITIONS[hiện tại] có chứa trạng thái mới?
  alt Không hợp lệ (vd. pending → shipping)
    L-->>FE: 400 "Không thể chuyển đơn từ … sang …"
  else Hợp lệ
    alt shipping
      L->>DB: inventory: on_hand −= q, reserved −= q, allocation → shipped, stock_movements sale_out
      L->>DB: INSERT shipments (NTR…), shipment_events
    else delivered
      L->>DB: COD → paid, products.sold_count += q, shipments → delivered, loyalty earn
    else cancelled
      L->>DB: reserved −= q, allocation → released, loyalty refund, DELETE coupon_usages, paid → refunded + refunds
    else returned
      L->>DB: on_hand += q, allocation → returned, stock_movements return_in
      L->>DB: sold_count −= q, loyalty adjust (−điểm đã cộng), hoàn tiền
    end
    L->>DB: UPDATE orders SET status (trigger ghi order_status_history, đóng dấu thời gian, audit)
    L->>N: Thông báo trong tài khoản khách
    L->>DB: COMMIT
    L--)N: Email trạng thái (confirmed/shipping/delivered/cancelled, nếu có SMTP)
    L-->>FE: 200 → "Đã cập nhật trạng thái"
  end
```

## Bảng chuyển trạng thái (`ORDER_TRANSITIONS`)

```mermaid
stateDiagram-v2
  [*] --> pending: Đặt hàng
  pending --> confirmed
  pending --> cancelled
  confirmed --> processing
  confirmed --> cancelled
  processing --> shipping
  processing --> cancelled
  shipping --> delivered
  shipping --> returned
  delivered --> completed
  delivered --> returned
  completed --> returned
  cancelled --> [*]
  returned --> [*]
```

- Khách tự hủy được khi đơn ở `pending` hoặc `confirmed`.
- Đơn VNPay/MoMo quá 60 phút chưa thanh toán sẽ bị cron hủy.
