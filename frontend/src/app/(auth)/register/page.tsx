'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Nut,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const user = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        referralCode: referralCode.trim() || undefined,
      });

      toast.success('Đăng ký tài khoản thành công!', {
        description: `Chào mừng ${user.fullName} đến với NUTRIO!`,
      });

      router.push('/');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      setErrorMsg(message);
      toast.error('Đăng ký thất bại', { description: message });
    }
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
          Đăng Ký Thành Viên Mới
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Nhận ngay ưu đãi tích điểm thành viên & tư vấn khẩu phần dinh dưỡng
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {/* shadcn/ui Card Component */}
        <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Tạo Tài Khoản</CardTitle>
            <CardDescription className="text-xs">
              Điền thông tin để đăng ký tài khoản khách hàng NUTRIO
            </CardDescription>

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
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-fullname">Họ và tên *</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="reg-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Địa chỉ Email *</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Số điện thoại</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Mật khẩu *</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
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

              {/* Xác nhận mật khẩu */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirmpass">Xác nhận mật khẩu *</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="reg-confirmpass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Mã giới thiệu (tùy chọn) */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-ref">Mã giới thiệu (nếu có)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Gift className="w-4 h-4" />
                  </div>
                  <Input
                    id="reg-ref"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="VD: NUTRIO99"
                    className="pl-10 uppercase"
                  />
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
                      <span>Đang khởi tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Ký Ngay</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          {/* Card Footer: Login Link */}
          <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="font-bold text-emerald-800 dark:text-emerald-400 hover:underline ml-1"
              >
                Đăng nhập tại đây
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
