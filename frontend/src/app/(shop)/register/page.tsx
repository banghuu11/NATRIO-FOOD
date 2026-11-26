'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { PHONE_RE } from '@/lib/vn-provinces';
import { useAuth } from '@/stores/auth';
import type { User } from '@/types';
import { AuthCard } from '@/components/shop/auth-card';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input } from '@/components/ui/form';
import { Notice } from '@/components/ui/feedback';
import { passwordRule, safeNext } from '@/lib/validation';


const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
    email: z.string().trim().email('Email không hợp lệ'),
    phone: z.union([z.literal(''), z.string().trim().regex(PHONE_RE, 'Số điện thoại không hợp lệ')]),
    password: passwordRule,
    confirm: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Mật khẩu nhập lại không khớp' });

function Register() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();
  const setSession = useAuth((s) => s.setSession);
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState, watch } = useForm({ resolver: zodResolver(schema), defaultValues: { fullName: '', email: '', phone: '', password: '', confirm: '', referralCode: '' } });
  const pw = watch('password');
  const strength = [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const e = formState.errors;

  const onSubmit = handleSubmit(async (v) => {
    if (!agree) return setError('Vui lòng đồng ý với điều khoản sử dụng');
    setError('');
    try {
      const { data } = await api.post<{ accessToken: string; user: User }>('/auth/register', { fullName: v.fullName, email: v.email, phone: v.phone || undefined, password: v.password, referralCode: v.referralCode || undefined });
      await setSession(data.accessToken, data.user);
      qc.invalidateQueries();
      toast.success('Tạo tài khoản thành công! Mã WELCOME10 đang chờ bạn.');
      router.replace(safeNext(sp.get('next'), '/health'));
    } catch (err) {
      setError(apiError(err));
    }
  });

  return (
    <AuthCard title="Tạo tài khoản" subtitle={<>Đã có tài khoản? <Link href="/login" className="font-semibold text-forest-700 underline">Đăng nhập</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Họ và tên" required error={e.fullName?.message}><Input {...register('fullName')} autoComplete="name" error={e.fullName?.message} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" required error={e.email?.message}><Input {...register('email')} type="email" autoComplete="email" error={e.email?.message} /></Field>
          <Field label="Số điện thoại" error={e.phone?.message}><Input {...register('phone')} inputMode="tel" error={e.phone?.message} /></Field>
        </div>
        <Field label="Mật khẩu" required error={e.password?.message} hint="Ít nhất 8 ký tự, gồm chữ và số">
          <Input {...register('password')} type="password" autoComplete="new-password" error={e.password?.message} />
          <div className="mt-2 flex gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${strength >= i ? (strength >= 3 ? 'bg-forest-500' : 'bg-warning') : 'bg-sand-200'}`} />)}</div>
        </Field>
        <Field label="Nhập lại mật khẩu" required error={e.confirm?.message}><Input {...register('confirm')} type="password" autoComplete="new-password" error={e.confirm?.message} /></Field>
        <Field label="Mã giới thiệu (nếu có)"><Input {...register('referralCode')} className="uppercase" /></Field>
        <Checkbox checked={agree} onChange={setAgree} label={<>Tôi đồng ý với <Link href="/pages/chinh-sach-bao-mat" className="text-forest-700 underline">chính sách bảo mật</Link> của NUTRIO</>} />
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Đăng ký</Button>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return <Suspense><Register /></Suspense>;
}
