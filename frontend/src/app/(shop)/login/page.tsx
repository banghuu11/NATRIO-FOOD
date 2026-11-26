'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { safeNext } from '@/lib/validation';
import type { User } from '@/types';
import { AuthCard } from '@/components/shop/auth-card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Notice } from '@/components/ui/feedback';

const schema = z.object({ email: z.string().trim().email('Email không hợp lệ'), password: z.string().min(1, 'Vui lòng nhập mật khẩu') });


function Login() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();
  const setSession = useAuth((s) => s.setSession);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (v) => {
    setError('');
    try {
      const { data } = await api.post<{ accessToken: string; user: User }>('/auth/login', v);
      await setSession(data.accessToken, data.user);
      qc.invalidateQueries();
      toast.success(`Chào mừng ${data.user.fullName}!`);
      router.replace(safeNext(sp.get('next'), data.user.isStaff ? '/admin' : '/'));
    } catch (e) {
      setError(apiError(e));
    }
  });

  return (
    <AuthCard title="Đăng nhập" subtitle={<>Chưa có tài khoản? <Link href={`/register${sp.get('next') ? `?next=${encodeURIComponent(sp.get('next')!)}` : ''}`} className="font-semibold text-forest-700 underline">Đăng ký ngay</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Email" error={formState.errors.email?.message}><Input {...register('email')} type="email" autoComplete="email" leftIcon={<Mail className="h-4 w-4" />} error={formState.errors.email?.message} placeholder="ban@email.com" /></Field>
        <Field label="Mật khẩu" error={formState.errors.password?.message}>
          <Input {...register('password')} type={show ? 'text' : 'password'} autoComplete="current-password" leftIcon={<Lock className="h-4 w-4" />} error={formState.errors.password?.message}
            rightSlot={<button type="button" onClick={() => setShow(!show)} className="cursor-pointer p-1.5 text-muted" aria-label="Hiện mật khẩu">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
        </Field>
        <div className="text-right text-sm"><Link href="/forgot-password" className="font-medium text-forest-700 hover:underline">Quên mật khẩu?</Link></div>
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Đăng nhập</Button>
      </form>
      <div className="mt-6 rounded-2xl bg-sand-50 p-4 text-xs text-muted">
        <div className="mb-1 font-semibold text-ink">Tài khoản demo</div>
        Khách hàng: lan@example.com / User@123 · Super Admin: admin@nutrio.vn / Admin@123 · Bán hàng: sales@nutrio.vn · Kho: kho@nutrio.vn · CSKH: cskh@nutrio.vn (mật khẩu Staff@123)
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return <Suspense><Login /></Suspense>;
}
