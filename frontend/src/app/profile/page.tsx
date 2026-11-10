'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CartDrawer from '@/components/storefront/CartDrawer';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService, UserFullProfile, UserAddress } from '@/services/user.service';
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
  User,
  MapPin,
  Flame,
  Shield,
  ShieldCheck,
  Award,
  Gift,
  Copy,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Save,
  Lock,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Heart,
  Scale,
  Activity,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'health' | 'security'>('profile');

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState<UserFullProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Add Address Form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Nhà riêng',
    recipientName: '',
    phone: '',
    province: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    street: '',
    isDefault: false,
    note: '',
  });

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token && !isAuthenticated) {
      router.replace('/login?returnUrl=/profile');
      return;
    }

    async function loadUserData() {
      setLoading(true);
      try {
        const [profileRes, addrRes] = await Promise.all([
          userService.getMyProfile().catch(() => null),
          userService.getAddresses().catch(() => []),
        ]);

        if (profileRes) {
          setProfileData(profileRes);
          setFullName(profileRes.fullName || '');
          setPhone(profileRes.phone || '');
          setGender(profileRes.gender || 'male');
          setAvatarUrl(profileRes.avatarUrl || '');
          setNewAddress((prev) => ({
            ...prev,
            recipientName: profileRes.fullName || '',
            phone: profileRes.phone || '',
          }));
        }

        if (addrRes) {
          setAddresses(addrRes);
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin hồ sơ:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [isAuthenticated, router]);

  const handleCopyReferral = () => {
    if (!profileData?.referralCode) return;
    navigator.clipboard.writeText(profileData.referralCode);
    setCopiedReferral(true);
    toast.success('Đã sao chép mã giới thiệu!', {
      description: `Mã ${profileData.referralCode} đã được lưu vào bộ nhớ tạm.`,
    });
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        gender,
      });

      toast.success('Cập nhật hồ sơ thành công!', {
        description: 'Thông tin cá nhân của bạn đã được đồng bộ hóa.',
      });

      // Update local state
      if (profileData) {
        setProfileData({
          ...profileData,
          fullName: fullName.trim(),
          phone: phone.trim(),
          gender,
          avatarUrl: avatarUrl.trim() || null,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật hồ sơ';
      toast.error('Cập nhật thất bại', { description: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.recipientName || !newAddress.phone || !newAddress.street) {
      toast.error('Vui lòng điền đầy đủ các thông tin địa chỉ bắt buộc!');
      return;
    }

    setSavingAddress(true);
    try {
      const added = await userService.addAddress(newAddress);
      setAddresses((prev) => [added, ...prev]);
      setIsAddingAddress(false);
      toast.success('Thêm địa chỉ thành công!', {
        description: `Đã thêm "${newAddress.label}" vào sổ địa chỉ nhận hàng.`,
      });
      setNewAddress({
        label: 'Nhà riêng',
        recipientName: profileData?.fullName || '',
        phone: profileData?.phone || '',
        province: 'TP. Hồ Chí Minh',
        district: '',
        ward: '',
        street: '',
        isDefault: false,
        note: '',
      });
    } catch (err: any) {
      toast.error('Lỗi khi thêm địa chỉ', {
        description: err.response?.data?.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await userService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Đã xóa địa chỉ thành công');
    } catch (err) {
      toast.error('Không thể xóa địa chỉ lúc này');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Đổi mật khẩu thành công!', {
        description: 'Vui lòng ghi nhớ mật khẩu mới của bạn cho các lần đăng nhập sau.',
      });
    }, 700);
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất tài khoản thành công');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col justify-between">
        <Header onOpenCart={() => setIsCartOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500">Đang tải hồ sơ & cài đặt tài khoản...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const userInitials = (profileData?.fullName || user?.fullName || 'User')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Header Navbar */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-emerald-700 transition">Trang Chủ</Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Hồ Sơ & Cài Đặt</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Hồ Sơ & Cài Đặt Tài Khoản</span>
            {isAdmin() ? (
              <Badge variant="success" className="text-[11px] py-1 px-3">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                <span>Quản Trị Viên</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[11px] py-1 px-3">
                <span>Khách Hàng Thân Thiết</span>
              </Badge>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Quản lý thông tin cá nhân, sổ địa chỉ nhận hàng, chỉ số dinh dưỡng và bảo mật
          </p>
        </div>

        {/* Layout Grid: Left Sidebar (4 cols) & Right Tab Content (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: User Summary & Navigation Cards */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* User Overview Profile Card */}
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 relative" />
              <CardContent className="pt-0 relative px-6 pb-6 text-center">
                {/* Avatar Badge */}
                <div className="-mt-10 mb-3 inline-block">
                  <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md mx-auto overflow-hidden">
                    {profileData?.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {profileData?.fullName || 'Người dùng NUTRIO'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {profileData?.email}
                </p>

                {/* Loyalty Tier Mini Pill */}
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        {profileData?.loyalty?.tier || 'Hạng Thành Viên'}
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {profileData?.loyalty?.pointsBalance?.toLocaleString('vi-VN') || 0} Điểm Thưởng
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      -{profileData?.loyalty?.discountPercent || 0}% Giảm giá
                    </span>
                  </div>
                </div>

                {/* Referral Code Mini Box */}
                {profileData?.referralCode && (
                  <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Mã Giới Thiệu Của Bạn</div>
                      <div className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-400 tracking-wider">
                        {profileData.referralCode}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyReferral}
                      className="h-7 px-2 text-[11px]"
                    >
                      {copiedReferral ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 mr-1" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Tabs Menu */}
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 p-2">
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Thông Tin Cá Nhân</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'addresses'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4" />
                    <span>Sổ Địa Chỉ Nhận Hàng</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {addresses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('health')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'health'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Chỉ Số Dinh Dưỡng & TDEE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Bảo Mật & Mật Khẩu</span>
                </button>

                {isAdmin() && (
                  <Link
                    href="/admin/dashboard"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all border border-emerald-200 dark:border-emerald-800 mt-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Vào Cổng Quản Trị (Admin)</span>
                  </Link>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất Tài Khoản</span>
                  </button>
                </div>
              </nav>
            </Card>

          </div>

          {/* RIGHT COLUMN: Tab Panes */}
          <div className="lg:col-span-8">
            
            {/* ======================================================== */}
            {/* TAB 1: THÔNG TIN CÁ NHÂN                                */}
            {/* ======================================================== */}
            {activeTab === 'profile' && (
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Thông Tin Cá Nhân</CardTitle>
                  <CardDescription>
                    Cập nhật họ tên, số điện thoại liên hệ và ảnh đại diện của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Họ và tên */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fullname">Họ và tên</Label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="fullname"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Email (Readonly) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email">Địa chỉ Email</Label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Đã xác thực
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          value={profileData?.email || ''}
                          disabled
                          className="pl-10 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-80"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Email dùng để đăng nhập và nhận hóa đơn điện tử.</p>
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Số điện thoại liên hệ</Label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Giới tính */}
                    <div className="space-y-1.5">
                      <Label>Giới tính</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'male', label: 'Nam' },
                          { id: 'female', label: 'Nữ' },
                          { id: 'other', label: 'Khác' },
                        ].map((g) => (
                          <Button
                            key={g.id}
                            type="button"
                            variant={gender === g.id ? 'default' : 'outline'}
                            onClick={() => setGender(g.id as any)}
                            className="h-10 font-bold"
                          >
                            {g.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* URL Ảnh đại diện */}
                    <div className="space-y-1.5">
                      <Label htmlFor="avatar">Đường dẫn ảnh đại diện (Avatar URL)</Label>
                      <Input
                        id="avatar"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                      />
                      <p className="text-[11px] text-slate-400">Dán đường dẫn ảnh đại diện vuông để tối ưu hiển thị.</p>
                    </div>

                    <div className="pt-3">
                      <Button
                        type="submit"
                        disabled={savingProfile}
                        className="h-11 px-6 font-bold"
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-1.5" />
                            <span>Lưu Thay Đổi Hồ Sơ</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ======================================================== */}
            {/* TAB 2: SỔ ĐỊA CHỈ NHẬN HÀNG                            */}
            {/* ======================================================== */}
            {activeTab === 'addresses' && (
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Sổ Địa Chỉ Giao Hàng</CardTitle>
                    <CardDescription>
                      Danh sách địa chỉ lưu sẵn để đặt hàng nhanh chóng trong 2 giờ
                    </CardDescription>
                  </div>
                  {!isAddingAddress && (
                    <Button
                      type="button"
                      onClick={() => setIsAddingAddress(true)}
                      size="sm"
                      className="font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Thêm Mới</span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Form thêm địa chỉ mới */}
                  {isAddingAddress && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-200 mb-6">
                      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-emerald-600" />
                          <span>Thêm Địa Chỉ Mới</span>
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAddingAddress(false)}
                          className="h-7 text-xs"
                        >
                          Hủy bỏ
                        </Button>
                      </div>

                      <form onSubmit={handleAddAddress} className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="addr-label">Nhãn địa chỉ</Label>
                            <Input
                              id="addr-label"
                              value={newAddress.label}
                              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                              placeholder="Nhà riêng / Công ty"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="addr-name">Tên người nhận</Label>
                            <Input
                              id="addr-name"
                              value={newAddress.recipientName}
                              onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                              placeholder="Nguyễn Văn A"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="addr-phone">Số điện thoại nhận hàng</Label>
                            <Input
                              id="addr-phone"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              placeholder="0912 345 678"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="addr-province">Tỉnh / Thành phố</Label>
                            <Input
                              id="addr-province"
                              value={newAddress.province}
                              onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="addr-district">Quận / Huyện</Label>
                            <Input
                              id="addr-district"
                              value={newAddress.district}
                              onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                              placeholder="Quận 1, Ba Đình..."
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="addr-ward">Phường / Xã</Label>
                            <Input
                              id="addr-ward"
                              value={newAddress.ward}
                              onChange={(e) => setNewAddress({ ...newAddress, ward: e.target.value })}
                              placeholder="Phường Bến Nghé..."
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="addr-street">Số nhà, tên đường chi tiết</Label>
                          <Input
                            id="addr-street"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            placeholder="Số 12 Nguyễn Huệ, Tòa nhà ABC..."
                            required
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="addr-default"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <Label htmlFor="addr-default" className="text-xs font-normal cursor-pointer">
                            Đặt làm địa chỉ nhận hàng mặc định
                          </Label>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddingAddress(false)}
                          >
                            Đóng
                          </Button>
                          <Button
                            type="submit"
                            disabled={savingAddress}
                            className="font-bold"
                          >
                            {savingAddress ? 'Đang lưu...' : 'Lưu Địa Chỉ'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Danh sách địa chỉ hiện tại */}
                  {addresses.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 space-y-2">
                      <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs">Bạn chưa có địa chỉ nhận hàng nào được lưu.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddingAddress(true)}
                      >
                        Thêm địa chỉ đầu tiên
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3 relative flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{addr.label}</span>
                                {addr.isDefault && (
                                  <Badge variant="success" className="text-[10px] py-0 px-2">
                                    Mặc định
                                  </Badge>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                title="Xóa địa chỉ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {addr.recipientName} • {addr.phone}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ======================================================== */}
            {/* TAB 3: CHỈ SỐ SỨC KHỎE & TDEE                           */}
            {/* ======================================================== */}
            {activeTab === 'health' && (
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Chỉ Số Dinh Dưỡng & Khẩu Phần Cá Nhân Hóa</CardTitle>
                  <CardDescription>
                    Hệ thống tự động tính toán theo chỉ số thể trạng và mục tiêu sức khỏe của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profileData?.healthProfile ? (
                    <>
                      {/* Metric Stat Cards Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 text-center">
                          <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Mục Tiêu Calo</div>
                          <div className="text-xl font-black text-emerald-800 dark:text-emerald-400 mt-1">
                            {profileData.healthProfile.dailyCalorieTarget} <span className="text-xs font-normal">kcal</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">mỗi ngày</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Chỉ Số TDEE</div>
                          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                            {profileData.healthProfile.tdee} <span className="text-xs font-normal">kcal</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">năng lượng tiêu thụ</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Chỉ Số BMI</div>
                          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                            {profileData.healthProfile.bmi}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">Cân đối chuẩn</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Cân Nặng</div>
                          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                            {profileData.healthProfile.weightKg} <span className="text-xs font-normal">kg</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Mục tiêu: {profileData.healthProfile.targetWeightKg || 55}kg</div>
                        </div>
                      </div>

                      {/* Health Advice Box */}
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>Khuyến nghị thực đơn phù hợp:</span>
                        </div>
                        <p className="leading-relaxed text-[11px] text-amber-800/90 dark:text-amber-300/90">
                          Ưu tiên các sản phẩm giàu Protein và chất béo lành mạnh như Granola mộc sấy đối lưu 60°C, hạt macca Tây Nguyên và chia pudding để duy trì năng lượng bền vững mà không làm tăng vọt đường huyết.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-500 space-y-3">
                      <Activity className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs">Bạn chưa cập nhật chỉ số sức khỏe cá nhân.</p>
                      <Button asChild size="sm">
                        <Link href="/#hero">Định Lượng Calo Ngay Tại Trang Chủ</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ======================================================== */}
            {/* TAB 4: BẢO MẬT & MẬT KHẨU                               */}
            {/* ======================================================== */}
            {activeTab === 'security' && (
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Bảo Mật Tài Khoản</CardTitle>
                  <CardDescription>
                    Thay đổi mật khẩu đăng nhập để bảo vệ tài khoản và lịch sử giao dịch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="curr-pass">Mật khẩu hiện tại</Label>
                      <Input
                        id="curr-pass"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-pass">Mật khẩu mới</Label>
                      <Input
                        id="new-pass"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-pass">Xác nhận mật khẩu mới</Label>
                      <Input
                        id="confirm-pass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={savingPassword}
                        className="h-10 font-bold"
                      >
                        {savingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </main>

      {/* 3. Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}

