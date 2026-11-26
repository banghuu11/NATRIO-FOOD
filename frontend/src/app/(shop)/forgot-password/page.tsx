'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { AuthCard } from '@/components/shop/auth-card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Notice } from '@/components/ui/feedback';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const send = useMutation({ mutationFn: async () => (await api.post<{ message: string; demoResetLink?: string }>('/auth/forgot-password', { email })).data });
  return (
    <AuthCard title="Quên mật khẩu" subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu (hiệu lực 30 phút).">
      {send.data ? (
        <div className="space-y-4">
          <Notice tone="success" icon={<MailCheck className="h-5 w-5" />}>{send.data.message}</Notice>
          {send.data.demoResetLink && (
            <Notice tone="warning">
              <b>Chế độ demo:</b> máy chủ chưa cấu hình SMTP nên email không được gửi. Dùng liên kết sau để tiếp tục:{' '}
              <a href={send.data.demoResetLink.replace(/^https?:\/\/[^/]+/, '')} className="font-semibold break-all underline">Đặt lại mật khẩu</a>
            </Notice>
          )}
          <Link href="/login" className="block text-center text-sm font-semibold text-forest-700">← Quay lại đăng nhập</Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Email không hợp lệ'); setErr(''); send.mutate(); }}>
          {send.isError && <Notice tone="danger">{apiError(send.error)}</Notice>}
          <Field label="Email" error={err}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err} autoComplete="email" /></Field>
          <Button type="submit" size="lg" className="w-full" loading={send.isPending}>Gửi liên kết</Button>
          <Link href="/login" className="block text-center text-sm font-semibold text-forest-700">← Quay lại đăng nhập</Link>
        </form>
      )}
    </AuthCard>
  );
}
