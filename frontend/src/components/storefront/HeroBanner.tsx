'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBannerStore } from '@/stores/useBannerStore';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function HeroBanner() {
  const { bannerConfig } = useBannerStore();

  // Local state for Quick Nutrition Calculator Widget
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(26);
  const [height, setHeight] = useState<number>(172);
  const [weight, setWeight] = useState<number>(65);
  const [activity, setActivity] = useState<number>(1.375); // Light activity

  // Reactive Nutrition Calculations
  const calculations = useMemo(() => {
    // Harris-Benedict Formula
    let bmr = 0;
    if (gender === 'male') {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    }

    const tdee = Math.round(bmr * activity);
    const bmiVal = weight / Math.pow(height / 100, 2);
    const bmi = parseFloat(bmiVal.toFixed(1));

    // Protein recommended for active healthy lifestyle (1.6g / kg)
    const targetProtein = Math.round(weight * 1.6);

    return {
      tdee,
      bmi,
      targetProtein,
    };
  }, [gender, age, height, weight, activity]);

  const handleGetPlan = () => {
    toast.success('Đã tính toán khẩu phần cá nhân hóa!', {
      description: `Mục tiêu hằng ngày: ${calculations.tdee} kcal • BMI: ${calculations.bmi} • Đạm: ${calculations.targetProtein}g`,
    });
  };

  return (
    <section id="hero" className="pt-6 pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* 1. Left Card: Editorial Hero Banner (~65% width) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 relative flex flex-col justify-center shadow-xs transition-colors duration-200">
            
            {/* Headline & Description */}
            <div className="max-w-2xl space-y-4 text-left">
              <span className="text-xs font-bold tracking-widest text-emerald-800 dark:text-emerald-400 uppercase">
                Thương Hiệu Hạt Dinh Dưỡng Mộc
              </span>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {bannerConfig.title || 'Artisan Granola'}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {bannerConfig.subtitle || 'Dinh dưỡng thuần khiết từ các loại hạt sấy mộc tự nhiên.'}
              </p>

              {bannerConfig.vnDescription && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {bannerConfig.vnDescription}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Sấy mộc 60°C</span>
                <span>•</span>
                <span>Chuẩn Nutri-Score A</span>
                <span>•</span>
                <span>0% Đường tinh luyện</span>
              </div>

              <div className="pt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>Khám phá sản phẩm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

          {/* 2. Right Card: Quick Nutrition Calculator Widget (~35% width) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-7 shadow-xs flex flex-col justify-between transition-colors duration-200">
            <div>
              {/* Header */}
              <div className="mb-5">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Công Cụ Định Lượng
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  Tính Khẩu Phần Calo
                </h2>
              </div>

              {/* Form Controls */}
              <div className="space-y-3.5">
                
                {/* Row 1: Gender & Age */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Giới tính
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-center">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          gender === 'male'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Nam
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          gender === 'female'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Nữ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Tuổi
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300"
                    />
                  </div>
                </div>

                {/* Row 2: Height & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Chiều cao (cm)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Cân nặng (kg)
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Mức độ vận động
                  </label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value={1.2}>Ít vận động (Dân văn phòng)</option>
                    <option value={1.375}>Nhẹ (Tập thể thao 1-3 ngày/tuần)</option>
                    <option value={1.55}>Vừa (Tập thể thao 3-5 ngày/tuần)</option>
                    <option value={1.725}>Nhiều (Tập thể thao 6-7 ngày/tuần)</option>
                  </select>
                </div>

                {/* Reactive Result Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mt-2">
                  <div className="grid grid-cols-3 text-center divide-x divide-slate-200 dark:divide-slate-700">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">TDEE</div>
                      <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {calculations.tdee}
                      </div>
                      <div className="text-[9px] text-slate-400">kcal/ngày</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">BMI</div>
                      <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {calculations.bmi}
                      </div>
                      <div className="text-[9px] text-slate-400">chỉ số</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Protein</div>
                      <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {calculations.targetProtein}g
                      </div>
                      <div className="text-[9px] text-slate-400">mục tiêu</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Action button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleGetPlan}
                className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Gợi Ý Khẩu Phần Phù Hợp
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
