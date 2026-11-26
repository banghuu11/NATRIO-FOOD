'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, apiError } from '@/lib/api';
import { AuthCard } from '@/components/shop/auth-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Notice } from '@/components/ui/feedback';
import { passwordRule } from '@/lib/validation';

function Reset() {
  const token = useSearchParams().get('token') || '';
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const reset = useMutation({ mutationFn: async () => (await api.post<{ message: string }>('/auth/reset-password', { token, password: pw })).data });
  if (!token) return <AuthCard title="Liên kết không hợp lệ"><ButtonLink href="/forgot-password">Yêu cầu liên kết mới</ButtonLink></AuthCard>;
  return (
    <AuthCard title="Đặt lại mật khẩu">
      {reset.isSuccess ? (
        <div className="space-y-4"><Notice tone="success">{reset.data.message}</Notice><ButtonLink href="/login" className="w-full">Đăng nhập</ButtonLink></div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const r = passwordRule.safeParse(pw);
            if (!r.success) return setErr(r.error.issues[0].message);
            if (pw !== confirm) return setErr('Mật khẩu nhập lại không khớp');
            setErr('');
            reset.mutate();
          }}
        >
          {reset.isError && <Notice tone="danger">{apiError(reset.error)} <Link href="/forgot-password" className="underline">Yêu cầu lại</Link></Notice>}
          <Field label="Mật khẩu mới" hint="Ít nhất 8 ký tự, gồm chữ và số"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
          <Field label="Nhập lại mật khẩu" error={err}><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={err} autoComplete="new-password" /></Field>
          <Button type="submit" size="lg" className="w-full" loading={reset.isPending}>Đặt lại mật khẩu</Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPage() {
  return <Suspense><Reset /></Suspense>;
}
