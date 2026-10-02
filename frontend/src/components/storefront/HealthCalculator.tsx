'use client';

import React from 'react';
import { 
  HeartPulse, 
  Flame, 
  Target, 
  Scale, 
  ShieldAlert, 
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { useHealthStore } from '@/stores/useHealthStore';
import { HealthGoal, ActivityLevel, Allergen } from '@/types';

const ALLERGEN_OPTIONS: { id: Allergen; label: string }[] = [
  { id: 'PEANUTS', label: 'Đậu phộng / Lạc' },
  { id: 'MILK_LACTOSE', label: 'Sữa & Lactose' },
  { id: 'GLUTEN', label: 'Gluten / Lúa mì' },
  { id: 'SEAFOOD', label: 'Hải sản / Tôm cua' },
  { id: 'EGGS', label: 'Trứng gà' },
  { id: 'SOY', label: 'Đậu nành (Soy)' },
];

export default function HealthCalculator() {
  const { profile, setProfile, toggleAllergen } = useHealthStore();

  const getBmiCategory = (bmi?: number) => {
    if (!bmi) return { label: 'Bình thường', color: 'text-emerald-600' };
    if (bmi < 18.5) return { label: 'Gầy / Thiếu cân', color: 'text-amber-600' };
    if (bmi < 24.9) return { label: 'Cân đối lý tưởng', color: 'text-emerald-600' };
    if (bmi < 29.9) return { label: 'Thừa cân nhẹ', color: 'text-orange-600' };
    return { label: 'Béo phì', color: 'text-rose-600' };
  };

  const bmiInfo = getBmiCategory(profile.bmi);

  return (
    <section id="health-calculator" className="py-16 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>ĐỘT PHÁ CÁ NHÂN HÓA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tính Nhu Cầu Calo & Định Lượng Dinh Dưỡng
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            Nhập chỉ số thể trạng để hệ thống tự động tính toán <strong>TDEE</strong> và lượng Macro cần thiết mỗi ngày cho bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form: Inputs */}
          <div className="lg:col-span-7 bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
            
            {/* 1. Giới tính & Tuổi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Giới tính
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfile({ gender: 'MALE' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      profile.gender === 'MALE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile({ gender: 'FEMALE' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      profile.gender === 'FEMALE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Nữ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Độ tuổi (năm)
                </label>
                <input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ age: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="24"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chiều cao (cm)
                </label>
                <input
                  type="number"
                  value={profile.height || ''}
                  onChange={(e) => setProfile({ height: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="170"
                />
              </div>
            </div>

            {/* 2. Cân nặng & Mục tiêu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cân nặng hiện tại (kg)
                </label>
                <input
                  type="number"
                  value={profile.weight || ''}
                  onChange={(e) => setProfile({ weight: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="65"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mục tiêu sức khỏe
                </label>
                <select
                  value={profile.goal}
                  onChange={(e) => setProfile({ goal: e.target.value as HealthGoal })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="LOSE_WEIGHT">Giảm mỡ / Ăn thâm hụt Calo (-500 kcal)</option>
                  <option value="MAINTAIN">Duy trì cân nặng & Tăng đề kháng</option>
                  <option value="GAIN_MUSCLE">Tăng cơ / Tập gym (+300 kcal)</option>
                </select>
              </div>
            </div>

            {/* 3. Mức độ vận động */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tần suất vận động hàng tuần
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'SEDENTARY', label: 'Ít vận động (Văn phòng)' },
                  { id: 'LIGHT', label: 'Nhẹ (1-2 buổi/tuần)' },
                  { id: 'MODERATE', label: 'Vừa phải (3-5 buổi/tuần)' },
                  { id: 'ACTIVE', label: 'Năng động (6-7 buổi/tuần)' },
                  { id: 'VERY_ACTIVE', label: 'VĐV / Lao động nặng' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setProfile({ activityLevel: act.id as ActivityLevel })}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all ${
                      profile.activityLevel === act.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Bộ lọc Dị ứng thực phẩm */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Thành phần bạn bị dị ứng (Tự động ẩn/cảnh báo)
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((item) => {
                  const isChecked = profile.allergens.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleAllergen(item.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-xs font-bold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-rose-600" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Card: Result & Smart Nutrition Output */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/10 flex flex-col justify-between space-y-6">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-emerald-700/60">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  KẾT QUẢ ĐỊNH LƯỢNG CỦA BẠN
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {profile.goal === 'LOSE_WEIGHT' ? 'Giảm mỡ' : profile.goal === 'GAIN_MUSCLE' ? 'Tăng cơ' : 'Cân đối'}
                </span>
              </div>

              {/* Main Calorie Output */}
              <div className="py-6 text-center">
                <div className="text-xs text-emerald-200 font-semibold mb-1">Mức Calo Đề Xuất Mỗi Ngày</div>
                <div className="text-5xl font-black text-white tracking-tight flex items-baseline justify-center gap-2">
                  <Flame className="w-8 h-8 text-orange-400 fill-orange-400 animate-pulse" />
                  <span>{profile.targetCalories || 2000}</span>
                  <span className="text-lg text-emerald-300 font-bold">kcal / ngày</span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-2">
                  (BMR trao đổi chất cơ bản: <strong>{profile.bmr}</strong> kcal • TDEE tiêu thụ thực tế: <strong>{profile.tdee}</strong> kcal)
                </p>
              </div>

              {/* BMI Card */}
              <div className="bg-emerald-900/50 backdrop-blur-xs rounded-2xl p-4 border border-emerald-700/50 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700/60 flex items-center justify-center text-emerald-300 font-bold text-sm">
                    BMI
                  </div>
                  <div>
                    <div className="text-xs text-emerald-200">Chỉ số khối cơ thể</div>
                    <div className="text-base font-extrabold text-white">{profile.bmi || 22.5}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-300 bg-emerald-600/40 px-2.5 py-1 rounded-lg">
                    {bmiInfo.label}
                  </div>
                </div>
              </div>

              {/* Macro Distribution Target */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  Khuyến nghị Macro phân bổ / ngày:
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                    <div className="text-[11px] text-emerald-200">Protein (Đạm)</div>
                    <div className="text-base font-bold text-white">{profile.targetProtein || 140}g</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                    <div className="text-[11px] text-emerald-200">Carbs (Tinh bột)</div>
                    <div className="text-base font-bold text-white">{profile.targetCarbs || 220}g</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                    <div className="text-[11px] text-emerald-200">Fat (Chất béo)</div>
                    <div className="text-base font-bold text-white">{profile.targetFat || 55}g</div>
                  </div>
                </div>
              </div>

            </div>

            <a
              href="#products"
              className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm rounded-xl text-center shadow-lg transition-all cursor-pointer"
            >
              Xem Sản Phẩm Chuẩn {profile.targetCalories} kcal
            </a>

          </div>

        </div>

      </div>
    </section>
  );
}
