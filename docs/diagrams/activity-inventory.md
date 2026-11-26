# Sơ đồ hoạt động – Quản lý tồn kho (theo lô, FEFO)

Căn cứ: `admin-inventory.controller.ts` (receive / issue / adjust), `fn_allocate_stock_fefo` (`01_schema.sql`), `order-lifecycle.service.ts`.

```mermaid
flowchart TD
  start([Bắt đầu]) --> A{Sự kiện}

  A -- Nhân viên kho nhập hàng --> R1[Chọn quy cách, kho, số lượng, NSX/HSD, nhà cung cấp]
  R1 --> R2[INSERT product_batches: mã lô + mã QR]
  R2 --> R3[INSERT/UPDATE inventory: on_hand += SL]
  R3 --> R4[stock_movements: purchase_in]

  A -- Xuất hủy / kiểm kê --> X1[Chọn lô, nhập số lượng và lý do]
  X1 --> X2{Sau thay đổi on_hand ≥ reserved và ≥ 0?}
  X2 -- Không --> X3[Từ chối: CHECK của CSDL hoặc kiểm tra ở API]
  X2 -- Có --> X4[Cập nhật on_hand<br/>stock_movements: expired / damaged / adjustment]

  A -- Khách đặt hàng --> O1[fn_allocate_stock_fefo:<br/>duyệt lô còn hạn, ORDER BY expires_on,<br/>khóa dòng FOR UPDATE]
  O1 --> O2{Đủ hàng?}
  O2 -- Không --> O3[RAISE EXCEPTION → rollback đơn]
  O2 -- Có --> O4[reserved += SL từng lô<br/>order_allocations: reserved]

  O4 --> S{Trạng thái đơn tiếp theo}
  S -- Đang giao --> S1[on_hand −= SL, reserved −= SL<br/>allocation: shipped<br/>stock_movements: sale_out]
  S -- Đã hủy --> S2[reserved −= SL<br/>allocation: released]
  S1 -- Hoàn trả --> S3[on_hand += SL<br/>allocation: returned<br/>stock_movements: return_in]

  R4 & X4 & S1 & S2 & S3 --> W[View v_low_stock / v_near_expiry<br/>cập nhật cảnh báo trên Dashboard & trang Kho]
  W --> fin([Kết thúc])
```

**Tồn khả dụng** = Σ (`quantity_on_hand − quantity_reserved`) của các lô còn hạn ở kho đang hoạt động. Đây là con số giỏ hàng dùng để kiểm tra.
