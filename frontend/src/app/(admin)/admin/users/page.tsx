'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  Shield,
  Phone,
  Mail,
  Award,
  ShoppingBag,
  Loader2,
  X,
  Check,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import {
  userService,
  AdminUserItem,
  AdminUserDetail,
} from '@/services/user.service';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');

  // Detail Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Lock / Unlock Confirmation Modal
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAdminUsers({
        search: searchTerm || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter]);

  const handleOpenDetail = async (user: AdminUserItem) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    try {
      const detail = await userService.getUserDetail(user.id);
      setSelectedUserDetail(detail);
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết người dùng:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    const newStatus = !selectedUser.isActive;
    try {
      await userService.updateUserStatus(selectedUser.id, newStatus);
      showToast(
        newStatus
          ? `Đã mở khóa tài khoản: ${selectedUser.email}`
          : `Đã khóa tài khoản: ${selectedUser.email}`,
      );
      setIsStatusModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Lỗi cập nhật trạng thái:', err);
      alert(err.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Check className="w-5 h-5 bg-white/20 p-1 rounded-full" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Khách Hàng & Hội Viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi danh sách khách hàng, điểm tích lũy Loyalty, hạng hội viên và quản trị trạng thái tài khoản từ CSDL.
          </p>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { key: 'all', label: 'Tất cả tài khoản' },
              { key: 'active', label: 'Đang hoạt động' },
              { key: 'locked', label: 'Bị khóa' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Đang tải danh sách người dùng từ CSDL...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Không tìm thấy người dùng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Thành Viên</th>
                  <th className="py-3.5 px-4">Số Điện Thoại</th>
                  <th className="py-3.5 px-4">Vai Trò</th>
                  <th className="py-3.5 px-4">Hạng & Điểm Thưởng</th>
                  <th className="py-3.5 px-4">Đơn Hàng</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((user) => {
                  const isAdmin = user.roles.includes('Quản trị viên');

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isAdmin
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'KH'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.fullName || 'Khách Hàng'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {user.roles.map((r, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                r === 'Quản trị viên'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Tier & Loyalty */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold text-slate-900">{user.tier || 'Thành viên'}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {user.loyaltyPoints || 0} điểm tích lũy
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.orderCount || 0} đơn</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-rose-600" />
                              <span>Đã khóa</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Xem chi tiết & lịch sử mua"
                            onClick={() => handleOpenDetail(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isAdmin && (
                            <button
                              type="button"
                              title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              onClick={() => {
                                setSelectedUser(user);
                                setIsStatusModalOpen(true);
                              }}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                user.isActive
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: CHI TIẾT NGƯỜI DÙNG ================= */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Hồ Sơ Khách Hàng</h3>
                  <p className="text-xs text-slate-500">Thông tin cá nhân, sổ địa chỉ và lịch sử đơn hàng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <span className="text-xs text-slate-400">Đang tải hồ sơ...</span>
              </div>
            ) : selectedUserDetail ? (
              <div className="space-y-3 text-xs">
                {/* Header Profile */}
                <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedUserDetail.fullName}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{selectedUserDetail.email}</div>
                    <div className="text-slate-500 mt-1">SĐT: {selectedUserDetail.phone || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-xs">
                      {selectedUserDetail.tier || 'Thành viên'}
                    </span>
                    <div className="text-emerald-700 font-bold mt-1">
                      {selectedUserDetail.loyaltyPoints} điểm tích lũy
                    </div>
                  </div>
                </div>

                {/* Sổ địa chỉ */}
                <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5">
                  <div className="font-bold text-slate-800">Sổ Địa Chỉ Giao Hàng:</div>
                  {selectedUserDetail.addresses?.length === 0 ? (
                    <div className="text-slate-400">Khách chưa lưu địa chỉ nhận hàng nào.</div>
                  ) : (
                    selectedUserDetail.addresses?.map((addr) => (
                      <div key={addr.id} className="flex items-start gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {addr.street}, {addr.ward}, {addr.district}, {addr.province} ({addr.phone})
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Lịch sử đơn hàng gần nhất */}
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/50 space-y-2">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Lịch Sử Đơn Hàng ({selectedUserDetail.orders?.length || 0}):</span>
                    <span className="text-emerald-800 font-black">
                      Tổng chi tiêu LTV: {(selectedUserDetail.totalSpent || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {selectedUserDetail.orders?.length === 0 ? (
                    <div className="text-slate-500">Khách chưa có đơn hàng nào hoàn tất.</div>
                  ) : (
                    <div className="space-y-1">
                      {selectedUserDetail.orders?.map((o) => (
                        <div key={o.id} className="flex justify-between text-slate-700">
                          <span className="font-mono font-semibold">{o.orderNumber}</span>
                          <span className="font-bold">{o.totalAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: KHÓA / MỞ KHÓA TÀI KHOẢN ================= */}
      {isStatusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                selectedUser.isActive ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {selectedUser.isActive ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {selectedUser.isActive ? 'Khóa Tài Khoản Này?' : 'Mở Khóa Tài Khoản Này?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tài khoản <strong>{selectedUser.email}</strong> ({selectedUser.fullName}){' '}
                {selectedUser.isActive
                  ? 'sẽ bị từ chối đăng nhập và đặt hàng trên toàn bộ hệ thống.'
                  : 'sẽ được phục hồi quyền truy cập bình thường.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleToggleStatusConfirm}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                  selectedUser.isActive
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25'
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{selectedUser.isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
