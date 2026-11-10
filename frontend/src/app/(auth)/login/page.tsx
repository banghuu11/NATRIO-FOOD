'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
  Nut,
} from 'lucide-react';
import { toast } from 'sonner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '';

  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    try {
      const user = await login({ email: email.trim(), password });

      const roles = user.roles || (user.role ? [user.role] : []);
      const isAdminUser = roles.some((r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'staff');

      toast.success('Đăng nhập thành công!', {
        description: `Xin chào ${user.fullName || user.email}!`,
      });

      // Role-based navigation
      if (isAdminUser) {
        const dest = returnUrl.startsWith('/admin') ? returnUrl : '/admin/dashboard';
        router.push(dest);
      } else {
        const dest = returnUrl.startsWith('/admin') ? '/' : returnUrl || '/';
        router.push(dest);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.';
      setErrorMsg(message);
      toast.error('Đăng nhập thất bại', { description: message });
    }
  };

  const handleQuickLogin = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-emerald-500/20">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Top Brand Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-700/20 group-hover:scale-105 transition-transform">
            <Nut className="w-6 h-6" />
          </div>
          <span className="font-serif text-3xl font-black tracking-tight text-emerald-900 dark:text-emerald-400">
            NUTRIO
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Đăng Nhập Hệ Thống
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Nền tảng thực phẩm nông sản mộc & dinh dưỡng chuẩn hóa
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {/* shadcn/ui Card Component */}
        <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-4">
            {/* Quick 1-Click Role Switcher Demo Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tài khoản thử nghiệm (1-Click điền):</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('admin@nutrio.vn', 'Admin@123')}
                  className="h-auto py-2 px-2.5 flex-col items-start justify-start text-left bg-white dark:bg-slate-700/70 hover:border-emerald-500"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400">
                    <Shield className="w-3 h-3" />
                    <span>Admin Quản Trị</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    admin@nutrio.vn
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('lan@example.com', 'User@123')}
                  className="h-auto py-2 px-2.5 flex-col items-start justify-start text-left bg-white dark:bg-slate-700/70 hover:border-emerald-500"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                    <User className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                    <span>Khách Hàng</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    lan@example.com
                  </div>
                </Button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </CardHeader>

          {/* Form Content */}
          <CardContent>
            <form id="login-form" className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Địa chỉ Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nutrio.vn"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-800/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          {/* Card Footer: Register Link */}
          <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="font-bold text-emerald-800 dark:text-emerald-400 hover:underline ml-1"
              >
                Đăng ký tài khoản mới
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium transition-colors"
          >
            ← Quay lại trang chủ NUTRIO
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
