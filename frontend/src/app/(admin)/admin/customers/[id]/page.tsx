'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import { Card, PageHeader, Stat, Table } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { Badge, Stars } from '@/components/ui/misc';
import { StatusPill } from '@/components/shop/order-timeline';

const SEG_TONE: Record<string, 'green' | 'brown' | 'warning' | 'neutral' | 'dark'> = { vip: 'dark', loyal: 'green', regular: 'brown', dormant: 'warning', new: 'green', prospect: 'neutral' };
const GOAL: Record<string, string> = { lose_weight: 'Giảm cân', maintain: 'Giữ cân', gain_weight: 'Tăng cân', gain_muscle: 'Tăng cơ', eat_clean: 'Ăn sạch', control_blood_sugar: 'Kiểm soát đường huyết' };

interface C {
  id: number; fullName: string; email: string; phone: string | null; gender: string | null; dateOfBirth: string | null; isActive: boolean; createdAt: string; lastLoginAt: string | null;
  tier: string | null; points: number; lifetimePoints: number; stats: { totalOrders: number; completedOrders: number; spent: number; averageOrder: number }; segment: { code: string; label: string };
  addresses: { id: number; label: string | null; recipientName: string; phone: string; address: string; isDefault: boolean }[];
  health: { heightCm: number; weightKg: number; goal: string; tdee: number; bmi: number } | null; allergens: string[];
  orders: { id: number; orderNumber: string; total: number; status: string; statusLabel: string; placedAt: string }[];
  reviews: { id: number; product: string; rating: number; content: string | null; status: string; createdAt: string }[];
}

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const can = useAuth((s) => s.can);
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-customer', id], queryFn: () => get<C>(`/admin/customers/${id}`) });
  const lock = useMutation({ mutationFn: (locked: boolean) => api.patch(`/admin/customers/${id}/lock`, { locked }), onSuccess: (r) => { toast.success((r.data as { message: string }).message); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorState message={apiError(q.error)} />;
  const c = q.data;
  return (
    <div>
      <Link href="/admin/customers" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-700"><ArrowLeft className="h-4 w-4" /> Khách hàng</Link>
      <PageHeader
        title={c.fullName}
        description={<span className="flex flex-wrap items-center gap-2">{c.email} · {c.phone ?? 'chưa có SĐT'} <Badge tone={SEG_TONE[c.segment.code]}>{c.segment.label}</Badge> <Badge tone={c.isActive ? 'green' : 'danger'}>{c.isActive ? 'Hoạt động' : 'Đã khóa'}</Badge></span>}
        actions={can('customer.manage') && (c.isActive
          ? <Button variant="outline" className="text-danger" onClick={async () => (await ask({ title: `Khóa tài khoản ${c.fullName}?`, description: 'Khách sẽ không thể đăng nhập và đặt hàng bằng tài khoản này.', confirmLabel: 'Khóa tài khoản', tone: 'danger' })).ok && lock.mutate(true)}><Lock className="h-4 w-4" /> Khóa tài khoản</Button>
          : <Button variant="outline" onClick={() => lock.mutate(false)}><Unlock className="h-4 w-4" /> Mở khóa</Button>)}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Tổng chi tiêu" value={formatPrice(c.stats.spent)} />
        <Stat label="Đơn thành công / tổng" value={`${c.stats.completedOrders} / ${c.stats.totalOrders}`} />
        <Stat label="Giá trị đơn TB" value={formatPrice(c.stats.averageOrder)} />
        <Stat label={`Hạng ${c.tier ?? '—'}`} value={`${c.points} điểm`} hint={`Tích lũy ${c.lifetimePoints} điểm`} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Lịch sử mua hàng" padded={false}>
            <Table head={['Mã đơn', 'Ngày', 'Tổng tiền', 'Trạng thái']} empty={!c.orders.length}>
              {c.orders.map((o) => <tr key={o.id}><td className="px-4 py-2.5"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-forest-700">{o.orderNumber}</Link></td><td className="px-4 text-muted">{formatDate(o.placedAt, true)}</td><td className="px-4 font-semibold">{formatPrice(o.total)}</td><td className="px-4"><StatusPill status={o.status} label={o.statusLabel} /></td></tr>)}
            </Table>
          </Card>
          <Card title="Đánh giá gần đây">
            {!c.reviews.length ? <p className="text-sm text-muted">Chưa có đánh giá.</p> : <ul className="space-y-3 text-sm">{c.reviews.map((r) => <li key={r.id}><div className="flex items-center gap-2"><b>{r.product}</b><Stars value={r.rating} size={12} /><Badge>{r.status}</Badge></div><p className="text-ink/80">{r.content}</p></li>)}</ul>}
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Thông tin">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Giới tính</dt><dd>{c.gender === 'male' ? 'Nam' : c.gender === 'female' ? 'Nữ' : c.gender ? 'Khác' : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Ngày sinh</dt><dd>{formatDate(c.dateOfBirth)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Ngày đăng ký</dt><dd>{formatDate(c.createdAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Đăng nhập gần nhất</dt><dd>{formatDate(c.lastLoginAt, true)}</dd></div>
            </dl>
          </Card>
          <Card title="Hồ sơ sức khỏe">
            {c.health ? <div className="space-y-1 text-sm"><div>{c.health.heightCm} cm · {c.health.weightKg} kg · BMI {c.health.bmi}</div><div>Mục tiêu: <b>{GOAL[c.health.goal] ?? c.health.goal}</b> · TDEE {c.health.tdee} kcal</div>{c.allergens.length > 0 && <div className="text-danger">Dị ứng: {c.allergens.join(', ')}</div>}</div> : <p className="text-sm text-muted">Chưa tạo hồ sơ.</p>}
          </Card>
          <Card title="Sổ địa chỉ">
            {!c.addresses.length ? <p className="text-sm text-muted">Chưa có địa chỉ.</p> : <ul className="space-y-2 text-sm">{c.addresses.map((a) => <li key={a.id}><b>{a.recipientName}</b> · {a.phone} {a.isDefault && <Badge tone="green">Mặc định</Badge>}<div className="text-muted">{a.address}</div></li>)}</ul>}
          </Card>
        </div>
      </div>
    </div>
  );
}
