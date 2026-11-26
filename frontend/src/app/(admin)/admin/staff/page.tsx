'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Lock, Play, Plus, Unlock, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { passwordRule } from '@/lib/validation';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import { Card, PageHeader, Table } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { Checkbox, ChipGroup, Field, Input } from '@/components/ui/form';
import { Notice, Spinner } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';

interface Staff { id: number; email: string; fullName: string; isActive: boolean; lastLoginAt: string | null; roles: { code: string; name: string }[] }
interface Roles { roles: { code: string; name: string; description: string | null; userCount: number; editable: boolean; permissions: string[] }[]; permissions: { code: string; label: string }[] }
const ROLE_OPTS = [{ value: 'admin', label: 'Super Admin' }, { value: 'staff_sales', label: 'Bán hàng' }, { value: 'staff_warehouse', label: 'Kho' }, { value: 'staff_support', label: 'CSKH' }];

export default function StaffPage() {
  const me = useAuth((s) => s.user);
  const ask = useUi((s) => s.ask);
  const staff = useQuery({ queryKey: ['admin-staff'], queryFn: () => get<Staff[]>('/admin/staff') });
  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: () => get<Roles>('/admin/roles') });
  const [create, setCreate] = useState<{ email: string; fullName: string; password: string; roles: string[] } | null>(null);
  const [editRoles, setEditRoles] = useState<{ id: number; name: string; roles: string[] } | null>(null);
  // Unsaved checkbox edits per role; everything else comes straight from the server
  const [edits, setEdits] = useState<Record<string, string[]>>({});
  const matrix: Record<string, string[]> = { ...Object.fromEntries((roles.data?.roles ?? []).map((r) => [r.code, r.permissions])), ...edits };
  const setMatrix = (m: Record<string, string[]>) => setEdits(m);
  const [err, setErr] = useState('');

  const createM = useMutation({ mutationFn: () => api.post('/admin/staff', create), onSuccess: () => { toast.success('Đã tạo tài khoản nhân viên'); setCreate(null); staff.refetch(); roles.refetch(); }, onError: (e) => setErr(apiError(e)) });
  const rolesM = useMutation({ mutationFn: () => api.put(`/admin/staff/${editRoles!.id}/roles`, { roles: editRoles!.roles }), onSuccess: () => { toast.success('Đã cập nhật vai trò'); setEditRoles(null); staff.refetch(); roles.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const lockM = useMutation({ mutationFn: ({ id, locked }: { id: number; locked: boolean }) => api.patch(`/admin/customers/${id}/lock`, { locked }), onSuccess: (r) => { toast.success((r.data as { message: string }).message); staff.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const permM = useMutation({ mutationFn: (code: string) => api.put(`/admin/roles/${code}/permissions`, { permissions: matrix[code] }), onSuccess: (_r, code) => { toast.success('Đã lưu phân quyền. Áp dụng ngay cho nhân viên thuộc vai trò này.'); setEdits((e) => { const n = { ...e }; delete n[code]; return n; }); roles.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const runSubs = useMutation({ mutationFn: async () => (await api.post<{ processed: number; results: { ok: boolean; message: string }[] }>('/admin/subscriptions/run')).data, onSuccess: (r) => toast.success(`Đã xử lý ${r.processed} gói giao định kỳ đến hạn${r.results.length ? `: ${r.results.map((x) => x.message).join(', ')}` : ''}`), onError: (e) => toast.error(apiError(e)) });

  return (
    <div>
      <PageHeader title="Nhân viên & phân quyền" description="Mỗi vai trò chỉ thấy và thao tác được các chức năng đã cấp – kiểm tra ở cả máy chủ." actions={<Button onClick={() => { setErr(''); setCreate({ email: '', fullName: '', password: '', roles: ['staff_sales'] }); }}><Plus className="h-4 w-4" /> Thêm nhân viên</Button>} />
      <Card title="Tài khoản nhân viên" padded={false}>
        {staff.isLoading ? <Spinner /> : (
          <Table head={['Nhân viên', 'Vai trò', 'Đăng nhập gần nhất', 'Trạng thái', '']}>
            {staff.data?.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2.5"><div className="font-medium">{s.fullName}</div><div className="text-xs text-muted">{s.email}</div></td>
                <td className="px-4"><div className="flex flex-wrap gap-1">{s.roles.map((r) => <Badge key={r.code} tone={r.code === 'admin' ? 'dark' : 'brown'}>{r.name}</Badge>)}</div></td>
                <td className="px-4 text-muted">{formatDate(s.lastLoginAt, true)}</td>
                <td className="px-4"><Badge tone={s.isActive ? 'green' : 'danger'}>{s.isActive ? 'Hoạt động' : 'Đã khóa'}</Badge></td>
                <td className="px-4"><div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditRoles({ id: s.id, name: s.fullName, roles: s.roles.map((r) => r.code) })}><UserCog className="h-4 w-4" /> Vai trò</Button>
                  {s.id !== me?.id && <Button size="sm" variant="ghost" className={s.isActive ? 'text-danger' : ''} onClick={async () => (s.isActive ? (await ask({ title: `Khóa tài khoản ${s.fullName}?`, confirmLabel: 'Khóa', tone: 'danger' })).ok : true) && lockM.mutate({ id: s.id, locked: s.isActive })}>{s.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</Button>}
                </div></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-5" title="Ma trận phân quyền">
        {roles.isLoading || !roles.data ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-line text-left"><th className="py-2 pr-4 font-semibold">Quyền</th>{roles.data.roles.map((r) => <th key={r.code} className="px-3 py-2 text-center font-semibold">{r.name}<div className="text-[11px] font-normal text-muted">{r.userCount} người</div></th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {roles.data.permissions.map((p) => (
                  <tr key={p.code}>
                    <td className="py-2 pr-4">{p.label}<div className="font-mono text-[11px] text-muted">{p.code}</div></td>
                    {roles.data.roles.map((r) => (
                      <td key={r.code} className="px-3 text-center">
                        <div className="flex justify-center"><Checkbox disabled={!r.editable} checked={!r.editable || (matrix[r.code] ?? []).includes(p.code)} onChange={(v) => setMatrix({ ...matrix, [r.code]: v ? [...(matrix[r.code] ?? []), p.code] : (matrix[r.code] ?? []).filter((x) => x !== p.code) })} label={<span className="sr-only">{p.label}</span>} /></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td />{roles.data.roles.map((r) => <td key={r.code} className="px-3 pt-3 text-center">{r.editable ? <Button size="sm" variant="secondary" loading={permM.isPending && permM.variables === r.code} onClick={() => permM.mutate(r.code)}>Lưu</Button> : <span className="text-xs text-muted">Toàn quyền</span>}</td>)}</tr></tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-5" title="Tác vụ hệ thống">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted">Giao hàng định kỳ tự chạy lúc 07:00 hằng ngày. Có thể chạy ngay để tạo đơn cho các gói đến hạn.</p>
          <Button variant="outline" loading={runSubs.isPending} onClick={() => runSubs.mutate()}><Play className="h-4 w-4" /> Chạy giao định kỳ ngay</Button>
        </div>
      </Card>

      <Modal open={!!create} onClose={() => setCreate(null)} title="Thêm nhân viên" footer={<><Button variant="outline" onClick={() => setCreate(null)}>Hủy</Button><Button loading={createM.isPending} onClick={() => { const c = create!; if (!/^\S+@\S+\.\S+$/.test(c.email)) return setErr('Email không hợp lệ'); if (c.fullName.trim().length < 2) return setErr('Nhập họ tên'); const p = passwordRule.safeParse(c.password); if (!p.success) return setErr(p.error.issues[0].message); if (!c.roles.length) return setErr('Chọn ít nhất một vai trò'); setErr(''); createM.mutate(); }}>Tạo tài khoản</Button></>}>
        {create && (
          <div className="space-y-4">
            {err && <Notice tone="danger">{err}</Notice>}
            <Field label="Họ tên"><Input value={create.fullName} onChange={(e) => setCreate({ ...create, fullName: e.target.value })} /></Field>
            <Field label="Email đăng nhập"><Input type="email" value={create.email} onChange={(e) => setCreate({ ...create, email: e.target.value })} /></Field>
            <Field label="Mật khẩu tạm" hint="Ít nhất 8 ký tự gồm chữ và số – nhân viên nên đổi sau khi đăng nhập"><Input value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} /></Field>
            <Field label="Vai trò"><ChipGroup multiple value={create.roles} onChange={(v: string[]) => setCreate({ ...create, roles: v })} options={ROLE_OPTS} /></Field>
          </div>
        )}
      </Modal>
      <Modal open={!!editRoles} onClose={() => setEditRoles(null)} title={`Vai trò của ${editRoles?.name}`} footer={<><Button variant="outline" onClick={() => setEditRoles(null)}>Hủy</Button><Button loading={rolesM.isPending} disabled={!editRoles?.roles.length} onClick={() => rolesM.mutate()}>Lưu</Button></>}>
        {editRoles && <ChipGroup multiple value={editRoles.roles} onChange={(v: string[]) => setEditRoles({ ...editRoles, roles: v })} options={ROLE_OPTS} />}
      </Modal>
    </div>
  );
}
