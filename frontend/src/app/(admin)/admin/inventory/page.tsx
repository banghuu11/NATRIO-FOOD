'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import type { Paged } from '@/types';
import { Card, PageHeader, Table } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Spinner } from '@/components/ui/feedback';
import { Badge, Pagination, Tabs } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';

interface StockRow { variantId: number; sku: string; productName: string; variantName: string; onHand: number; reserved: number; available: number; reorderLevel: number; expiredQty: number; nearestExpiry: string | null; daysToExpiry: number | null; batchCount: number; lowStock: boolean; nearExpiry: boolean }
interface Batch { id: number; batchCode: string; qrCode: string; productName: string; variantName: string; sku: string; manufacturedOn: string | null; expiresOn: string | null; quantityReceived: number; unitCost: number | null; supplier: string | null; daysToExpiry: number | null; stock: { inventoryId: number; warehouse: string; onHand: number; reserved: number; available: number }[] }
interface Move { id: number; typeLabel: string; quantity: number; note: string | null; product: string; variant: string; batchCode: string; warehouse: string; by: string; createdAt: string }
interface Meta { warehouses: { id: number; name: string }[]; suppliers: { id: number; name: string }[] }

function Inventory() {
  const sp = useSearchParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'stock' | 'batches' | 'moves'>((sp.get('tab') as 'batches') || 'stock');
  const [filter, setFilter] = useState(sp.get('filter') || '');
  const [qText, setQText] = useState('');
  const [search, setSearch] = useState('');
  const [moveType, setMoveType] = useState('');
  const [page, setPage] = useState(1);
  const [receive, setReceive] = useState<StockRow | null>(null);
  const [issue, setIssue] = useState<{ b: Batch; s: Batch['stock'][number]; mode: 'issue' | 'adjust' } | null>(null);

  const meta = useQuery({ queryKey: ['admin-catalog-meta'], queryFn: () => get<Meta>('/admin/catalog/meta') });
  const stock = useQuery({ queryKey: ['inv-stock', filter, search], queryFn: () => get<StockRow[]>('/admin/inventory/stock', { filter: filter || undefined, q: search || undefined }), enabled: tab === 'stock' });
  const batches = useQuery({ queryKey: ['inv-batches', search], queryFn: () => get<Batch[]>('/admin/inventory/batches', { q: search || undefined }), enabled: tab === 'batches' });
  const moves = useQuery({ queryKey: ['inv-moves', moveType, search, page], queryFn: () => get<Paged<Move> & { types: { code: string; label: string }[] }>('/admin/inventory/movements', { type: moveType || undefined, q: search || undefined, page }), enabled: tab === 'moves', placeholderData: keepPreviousData });
  const refresh = () => ['inv-stock', 'inv-batches', 'inv-moves'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  return (
    <div>
      <PageHeader title="Kho hàng" description="Tồn kho theo lô, xuất trước – hết hạn trước (FEFO). Hàng được giữ khi khách đặt và trừ kho khi chuyển sang Đang giao." />
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <form className="min-w-56 flex-1" onSubmit={(e) => { e.preventDefault(); setSearch(qText); setPage(1); }}><Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Tên sản phẩm, SKU, mã lô…" leftIcon={<Search className="h-4 w-4" />} /></form>
          {tab === 'stock' && <Select className="w-52" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Tất cả</option><option value="low">Tồn kho thấp</option><option value="expiry">Sắp / đã hết hạn</option></Select>}
          {tab === 'moves' && <Select className="w-52" value={moveType} onChange={(e) => { setMoveType(e.target.value); setPage(1); }}><option value="">Mọi loại phiếu</option>{moves.data?.types.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}</Select>}
        </div>
        <Tabs className="px-2" value={tab} onChange={setTab} tabs={[{ value: 'stock', label: 'Tồn kho' }, { value: 'batches', label: 'Lô hàng & hạn dùng' }, { value: 'moves', label: 'Lịch sử nhập / xuất' }]} />
        {tab === 'stock' && (stock.isLoading ? <Spinner /> : (
          <Table head={['Sản phẩm', 'SKU', 'Tồn thực', 'Đang giữ', 'Khả dụng', 'HSD gần nhất', 'Lô', '']} empty={!stock.data?.length}>
            {stock.data?.map((r) => (
              <tr key={r.variantId} className="hover:bg-sand-50/60">
                <td className="px-4 py-2.5"><div className="font-medium">{r.productName}</div><div className="text-xs text-muted">{r.variantName}</div></td>
                <td className="px-4 font-mono text-xs">{r.sku}</td>
                <td className="px-4">{r.onHand}</td>
                <td className="px-4 text-muted">{r.reserved}</td>
                <td className={cn('px-4 font-bold', r.lowStock && 'text-danger')}>{r.available}{r.lowStock && <div className="text-[11px] font-normal">≤ {r.reorderLevel} – cần nhập</div>}</td>
                <td className={cn('px-4', r.nearExpiry && 'font-semibold text-danger')}>{r.nearestExpiry ? <>{formatDate(r.nearestExpiry)}<div className="text-[11px]">còn {r.daysToExpiry} ngày</div></> : '—'}{r.expiredQty > 0 && <div className="text-[11px] text-danger">{r.expiredQty} sp đã hết hạn</div>}</td>
                <td className="px-4">{r.batchCount}</td>
                <td className="px-4"><Button size="sm" variant="secondary" onClick={() => setReceive(r)}><ArrowDownToLine className="h-4 w-4" /> Nhập kho</Button></td>
              </tr>
            ))}
          </Table>
        ))}
        {tab === 'batches' && (batches.isLoading ? <Spinner /> : (
          <Table head={['Mã lô', 'Sản phẩm', 'NSX / HSD', 'Nhập', 'Tồn theo kho', '']} empty={!batches.data?.length}>
            {batches.data?.map((b) => b.stock.map((s, k) => (
              <tr key={`${b.id}-${s.inventoryId}`} className="hover:bg-sand-50/60">
                {k === 0 && <td className="px-4 py-2.5 align-top" rowSpan={b.stock.length}><div className="font-mono text-xs font-semibold">{b.batchCode}</div><div className="text-[11px] text-muted">QR {b.qrCode}</div></td>}
                {k === 0 && <td className="px-4 align-top" rowSpan={b.stock.length}><div className="font-medium">{b.productName}</div><div className="text-xs text-muted">{b.variantName} · {b.supplier}</div></td>}
                {k === 0 && <td className="px-4 align-top" rowSpan={b.stock.length}>{formatDate(b.manufacturedOn)} →<div className={cn(b.daysToExpiry !== null && b.daysToExpiry <= 30 && 'font-semibold text-danger')}>{formatDate(b.expiresOn)} {b.daysToExpiry !== null && (b.daysToExpiry < 0 ? <Badge tone="danger">Hết hạn</Badge> : b.daysToExpiry <= 30 ? <Badge tone="warning">{b.daysToExpiry} ngày</Badge> : null)}</div></td>}
                {k === 0 && <td className="px-4 align-top" rowSpan={b.stock.length}>{b.quantityReceived}<div className="text-xs text-muted">{b.unitCost ? formatPrice(b.unitCost) : ''}</div></td>}
                <td className="px-4">{s.warehouse}: <b>{s.onHand}</b> <span className="text-xs text-muted">(giữ {s.reserved})</span></td>
                <td className="px-4"><div className="flex justify-end gap-1"><Button size="sm" variant="outline" disabled={s.available <= 0} onClick={() => setIssue({ b, s, mode: 'issue' })}><ArrowUpFromLine className="h-4 w-4" /> Xuất</Button><Button size="sm" variant="ghost" onClick={() => setIssue({ b, s, mode: 'adjust' })}><ClipboardCheck className="h-4 w-4" /> Kiểm kê</Button></div></td>
              </tr>
            )))}
          </Table>
        ))}
        {tab === 'moves' && (moves.isLoading ? <Spinner /> : (
          <>
            <Table head={['Thời gian', 'Loại', 'Sản phẩm / lô', 'Kho', 'Số lượng', 'Người thực hiện', 'Ghi chú']} empty={!moves.data?.data.length}>
              {moves.data?.data.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">{formatDate(m.createdAt, true)}</td>
                  <td className="px-4"><Badge tone={m.quantity > 0 ? 'green' : 'brown'}>{m.typeLabel}</Badge></td>
                  <td className="px-4">{m.product} <span className="text-muted">– {m.variant}</span><div className="font-mono text-[11px] text-muted">{m.batchCode}</div></td>
                  <td className="px-4">{m.warehouse}</td>
                  <td className={cn('px-4 font-bold', m.quantity > 0 ? 'text-forest-700' : 'text-sale')}>{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                  <td className="px-4">{m.by}</td>
                  <td className="px-4 text-xs text-muted">{m.note}</td>
                </tr>
              ))}
            </Table>
            {moves.data && <div className="border-t border-line p-4"><Pagination page={page} totalPages={moves.data.meta.totalPages} onChange={setPage} /></div>}
          </>
        ))}
      </Card>
      {receive && <ReceiveModal row={receive} meta={meta.data} onClose={() => setReceive(null)} onDone={refresh} />}
      {issue && <IssueModal {...issue} onClose={() => setIssue(null)} onDone={refresh} />}
    </div>
  );
}

function ReceiveModal({ row, meta, onClose, onDone }: { row: StockRow; meta?: Meta; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState(() => ({ warehouseId: meta?.warehouses[0]?.id ?? 0, quantity: '', batchCode: '', manufacturedOn: new Date().toISOString().slice(0, 10), expiresOn: new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10), unitCost: '', supplierId: '', note: '' }));
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: async () => (await api.post<{ message: string }>('/admin/inventory/receive', { variantId: row.variantId, warehouseId: Number(f.warehouseId), quantity: Number(f.quantity), batchCode: f.batchCode || undefined, manufacturedOn: f.manufacturedOn || undefined, expiresOn: f.expiresOn, unitCost: f.unitCost ? Number(f.unitCost) : undefined, supplierId: f.supplierId ? Number(f.supplierId) : undefined, note: f.note || undefined })).data,
    onSuccess: (r) => { toast.success(r.message); onDone(); onClose(); },
    onError: (e) => toast.error(apiError(e)),
  });
  return (
    <Modal open onClose={onClose} title={`Nhập kho – ${row.productName} (${row.variantName})`} size="lg" footer={<><Button variant="outline" onClick={onClose}>Hủy</Button><Button loading={m.isPending} onClick={() => { if (!(Number(f.quantity) > 0)) return setErr('Số lượng phải lớn hơn 0'); if (!f.expiresOn || new Date(f.expiresOn) <= new Date()) return setErr('Hạn sử dụng phải sau hôm nay'); setErr(''); m.mutate(); }}>Tạo phiếu nhập</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kho"><Select value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: Number(e.target.value) })}>{meta?.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
        <Field label="Số lượng nhập" required error={err}><Input type="number" min={1} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} error={err} /></Field>
        <Field label="Ngày sản xuất"><Input type="date" value={f.manufacturedOn} onChange={(e) => setF({ ...f, manufacturedOn: e.target.value })} /></Field>
        <Field label="Hạn sử dụng" required><Input type="date" value={f.expiresOn} onChange={(e) => setF({ ...f, expiresOn: e.target.value })} /></Field>
        <Field label="Mã lô" hint="Để trống để hệ thống tự tạo"><Input value={f.batchCode} onChange={(e) => setF({ ...f, batchCode: e.target.value.toUpperCase() })} /></Field>
        <Field label="Giá vốn / đơn vị (₫)"><Input type="number" value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} /></Field>
        <Field label="Nhà cung cấp"><Select value={f.supplierId} onChange={(e) => setF({ ...f, supplierId: e.target.value })}><option value="">Theo sản phẩm</option>{meta?.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Ghi chú"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function IssueModal({ b, s, mode, onClose, onDone }: { b: Batch; s: Batch['stock'][number]; mode: 'issue' | 'adjust'; onClose: () => void; onDone: () => void }) {
  const [qty, setQty] = useState(mode === 'adjust' ? String(s.onHand) : '');
  const [type, setType] = useState('damaged');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: async () => (await api.post<{ message: string }>(mode === 'issue' ? '/admin/inventory/issue' : '/admin/inventory/adjust', mode === 'issue' ? { inventoryId: s.inventoryId, quantity: Number(qty), type, note } : { inventoryId: s.inventoryId, countedQuantity: Number(qty), note })).data,
    onSuccess: (r) => { toast.success(r.message); onDone(); onClose(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const submit = () => {
    const n = Number(qty);
    if (mode === 'issue' && !(n > 0 && n <= s.available)) return setErr(`Số lượng từ 1 đến ${s.available} (phần đã giữ cho đơn không thể xuất)`);
    if (mode === 'adjust' && !(Number.isInteger(n) && n >= s.reserved)) return setErr(`Số thực tế phải ≥ ${s.reserved} (đang giữ cho đơn)`);
    if (!note.trim()) return setErr('Vui lòng ghi lý do');
    setErr('');
    m.mutate();
  };
  return (
    <Modal open onClose={onClose} title={mode === 'issue' ? `Xuất kho – lô ${b.batchCode}` : `Kiểm kê – lô ${b.batchCode}`} footer={<><Button variant="outline" onClick={onClose}>Hủy</Button><Button loading={m.isPending} onClick={submit}>{mode === 'issue' ? 'Xác nhận xuất' : 'Cập nhật tồn'}</Button></>}>
      <p className="mb-4 text-sm text-muted">{b.productName} – {b.variantName} · {s.warehouse}: tồn {s.onHand}, đang giữ {s.reserved}, khả dụng {s.available}</p>
      <div className="space-y-4">
        {mode === 'issue' && <Field label="Loại phiếu xuất"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="damaged">Hủy do hư hỏng</option><option value="expired">Hủy do hết hạn</option><option value="adjustment">Điều chỉnh khác</option><option value="transfer_out">Chuyển kho (xuất)</option></Select></Field>}
        <Field label={mode === 'issue' ? 'Số lượng xuất' : 'Số lượng thực tế đếm được'} error={err}><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} error={err} /></Field>
        <Field label="Lý do / ghi chú" required><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'issue' ? 'VD: Túi bị rách khi vận chuyển' : 'VD: Kiểm kê cuối tháng'} /></Field>
      </div>
    </Modal>
  );
}

export default function InventoryPage() {
  return <Suspense fallback={<Spinner />}><Inventory /></Suspense>;
}
