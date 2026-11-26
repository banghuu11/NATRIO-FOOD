'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { PHONE_RE } from '@/lib/vn-provinces';
import { passwordRule } from '@/lib/validation';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { ImageUploader } from '@/components/shop/image-uploader';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  // The account layout renders this page only after the user is loaded
  const [f, setF] = useState(() => ({ fullName: user?.fullName ?? '', phone: user?.phone ?? '', gender: user?.gender ?? '', dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '', avatarUrl: user?.avatarUrl ?? '' }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');

  const save = useMutation({
    mutationFn: () => api.patch('/account/profile', { fullName: f.fullName, phone: f.phone || undefined, gender: f.gender || undefined, dateOfBirth: f.dateOfBirth || undefined, avatarUrl: f.avatarUrl || undefined }),
    onSuccess: async () => {
      await refresh();
      toast.success('Đã cập nhật thông tin');
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const changePw = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (e) => setPwErr(apiError(e)),
  });

  if (!user) return null;
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.fullName.trim().length < 2) e.fullName = 'Vui lòng nhập họ tên';
    if (f.phone && !PHONE_RE.test(f.phone)) e.phone = 'Số điện thoại không hợp lệ';
    if (f.dateOfBirth && new Date(f.dateOfBirth) >= new Date()) e.dateOfBirth = 'Ngày sinh không hợp lệ';
    setErrors(e);
    if (!Object.keys(e).length) save.mutate();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-white p-6">
        <h1 className="mb-5 text-2xl">Thông tin tài khoản</h1>
        <div className="grid gap-6 md:grid-cols-[140px_1fr]">
          <div>
            <div className="mb-2 text-sm font-medium">Ảnh đại diện</div>
            <ImageUploader value={f.avatarUrl ? [f.avatarUrl] : []} onChange={(u) => setF({ ...f, avatarUrl: u[0] ?? '' })} max={1} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên" required error={errors.fullName}><Input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} error={errors.fullName} /></Field>
            <Field label="Email" hint="Email đăng nhập không thể thay đổi"><Input value={user.email} disabled /></Field>
            <Field label="Số điện thoại" error={errors.phone}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={errors.phone} /></Field>
            <Field label="Giới tính">
              <Select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option value="">Chưa chọn</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></Select>
            </Field>
            <Field label="Ngày sinh" error={errors.dateOfBirth}><Input type="date" value={f.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, dateOfBirth: e.target.value })} error={errors.dateOfBirth} /></Field>
            <Field label="Mã giới thiệu của bạn" hint="Bạn bè dùng mã này khi đăng ký">
              <Input value={user.referralCode ?? ''} readOnly rightSlot={<button type="button" onClick={() => { navigator.clipboard.writeText(user.referralCode ?? ''); toast.success('Đã sao chép'); }} className="cursor-pointer p-1.5 text-muted hover:text-forest-700" aria-label="Sao chép"><Copy className="h-4 w-4" /></button>} />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end"><Button loading={save.isPending} onClick={submit}>Lưu thay đổi</Button></div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="mb-5 flex items-center gap-2 font-sans text-xl font-semibold"><KeyRound className="h-5 w-5 text-forest-600" /> Đổi mật khẩu</h2>
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = passwordRule.safeParse(pw.newPassword);
            if (!pw.currentPassword) return setPwErr('Vui lòng nhập mật khẩu hiện tại');
            if (!r.success) return setPwErr(r.error.issues[0].message);
            if (pw.newPassword !== pw.confirm) return setPwErr('Mật khẩu nhập lại không khớp');
            setPwErr('');
            changePw.mutate();
          }}
        >
          <Field label="Mật khẩu hiện tại"><Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="Mật khẩu mới"><Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field>
          <Field label="Nhập lại mật khẩu mới" error={pwErr}><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErr} autoComplete="new-password" /></Field>
          <div className="flex items-center justify-between sm:col-span-3">
            <Link href="/forgot-password" className="text-sm text-forest-700 hover:underline">Quên mật khẩu?</Link>
            <Button type="submit" variant="secondary" loading={changePw.isPending}>Cập nhật mật khẩu</Button>
          </div>
        </form>
      </section>
      <p className="text-xs text-muted">Thành viên từ {formatDate((user as { createdAt?: string }).createdAt)}</p>
    </div>
  );
}
