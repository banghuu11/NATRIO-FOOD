'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Sparkles } from 'lucide-react';
import { bannerService, BannerConfig } from '@/services/banner.service';
import { toast } from 'sonner';

// Dynamic import 3D Canvas
const Nut3DCanvas = dynamic(() => import('./Nut3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <div className="w-10 h-10 rounded-full border-3 border-[#5F7E66]/20 border-t-[#5F7E66] animate-spin" />
    </div>
  ),
});

export default function HeroBanner() {
  // Banner config from Backend
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    title: 'Artisan Granola',
    subtitle: 'An organic healthy food, roasted nuts, and warm botanical.',
    vnDescription: 'Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên.',
    mode: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    model3dType: 'nut_bowl',
    enable3dRotation: true,
  });

  // Calculator state
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(28);
  const [height, setHeight] = useState<number>(178);
  const [weight, setWeight] = useState<number>(75);
  const [activity, setActivity] = useState<number>(1.55); // Moderate

  // Fetch dynamic Banner & 3D Config from Backend
  useEffect(() => {
    async function fetchBanner() {
      try {
        const res = await bannerService.getHeroBanner();
        if (res) {
          setBannerConfig(res);
        }
      } catch (err) {
        // Keep default config
      }
    }
    fetchBanner();
  }, []);

  // Calculations
  const calculations = useMemo(() => {
    // 1. BMI = weight (kg) / (height (m))^2
    const hM = height / 100;
    const bmi = hM > 0 ? (weight / (hM * hM)).toFixed(1) : '23.7';

    // 2. BMR (Mifflin-St Jeor)
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    const bmrVal = Math.round(bmr);

    // 3. Daily Target (TDEE)
    const tdee = Math.round(bmrVal * activity);

    return {
      bmi,
      bmr: bmrVal.toLocaleString('vi-VN'),
      tdee: tdee.toLocaleString('vi-VN'),
    };
  }, [gender, age, height, weight, activity]);

  const handleGetPlan = () => {
    toast.success('Đã nhận kế hoạch dinh dưỡng!', {
      description: `Mục tiêu hằng ngày: ${calculations.tdee} kcal • BMI: ${calculations.bmi}`,
    });
  };

  return (
    <section className="pt-4 pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* 1. Left Card: Artisan Granola Hero Banner (~68% width) */}
          <div className="lg:col-span-8 bg-[#F4EFE6] border border-[#E8DFC8] rounded-[32px] p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-xs">
            
            {/* Soft decorative botanical leaf in bottom-left */}
            <div className="absolute -bottom-8 -left-8 w-44 h-44 opacity-20 pointer-events-none text-[#5F7E66]">
              <svg viewBox="0 0 200 200" fill="currentColor" className="w-full h-full">
                <path d="M40,160 Q20,100 80,40 Q140,20 160,80 Q140,140 40,160 Z" />
              </svg>
            </div>

            {/* Headline & Description */}
            <div className="relative z-10 max-w-sm space-y-3 mb-6 md:mb-0 text-left">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C3E30] tracking-tight leading-tight">
                {bannerConfig.title || 'Artisan Granola'}
              </h1>
              <p className="text-sm sm:text-base text-[#5A6E5E] font-medium leading-relaxed">
                {bannerConfig.subtitle || 'An organic healthy food, roasted nuts, and warm botanical.'}
              </p>
              {bannerConfig.vnDescription && (
                <p className="text-xs text-[#7A8E7E] italic pt-1">
                  {bannerConfig.vnDescription}
                </p>
              )}
            </div>

            {/* Right Visual: 3D Interactive Model OR High-Res Food Image */}
            <div className="relative z-10 w-full md:w-auto flex justify-center">
              {bannerConfig.mode === '3d' ? (
                <div className="w-full sm:w-[440px] lg:w-[480px] h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-xl">
                  <Nut3DCanvas />
                </div>
              ) : (
                <div className="relative w-64 sm:w-76 lg:w-88 aspect-4/3 sm:aspect-square rounded-3xl overflow-hidden flex items-center justify-center bg-transparent">
                  <img
                    src={bannerConfig.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85'}
                    alt={bannerConfig.title}
                    className="w-full h-full object-cover rounded-3xl drop-shadow-md"
                  />
                </div>
              )}
            </div>

          </div>

          {/* 2. Right Card: Quick Nutrition Calculator Widget (~32% width) */}
          <div className="lg:col-span-4 bg-white border border-[#EFE8DE] rounded-[32px] p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-black text-[#2C3E30] tracking-tight">
                  Quick Nutrition Calculator
                </h2>
                <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-0.5">
                  YOUR PERSONAL NUTRITION PLAN
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3">
                
                {/* Row 1: Gender & Age */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-[#F4EFE6] rounded-xl text-xs font-bold text-center">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          gender === 'male'
                            ? 'bg-white text-[#2C3E30] shadow-xs font-black'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          gender === 'female'
                            ? 'bg-white text-[#2C3E30] shadow-xs font-black'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-[#F4EFE6] border border-transparent rounded-xl text-xs sm:text-sm font-bold text-[#2C3E30] text-center focus:outline-none focus:bg-white focus:border-[#5F7E66]"
                    />
                  </div>
                </div>

                {/* Row 2: Height, Weight & Activity Level */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Height
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full pl-2 pr-5 py-1.5 bg-[#F4EFE6] rounded-xl text-xs font-bold text-[#2C3E30] focus:outline-none focus:bg-white focus:border-[#5F7E66]"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-medium">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Weight
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full pl-2 pr-5 py-1.5 bg-[#F4EFE6] rounded-xl text-xs font-bold text-[#2C3E30] focus:outline-none focus:bg-white focus:border-[#5F7E66]"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-medium">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1 truncate">
                      Activity Level
                    </label>
                    <div className="relative">
                      <select
                        value={activity}
                        onChange={(e) => setActivity(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-[#F4EFE6] rounded-xl text-xs font-bold text-[#2C3E30] appearance-none pr-5 cursor-pointer focus:outline-none focus:bg-white focus:border-[#5F7E66]"
                      >
                        <option value={1.2}>Sedentary</option>
                        <option value={1.375}>Light</option>
                        <option value={1.55}>Moderate</option>
                        <option value={1.725}>Active</option>
                        <option value={1.9}>Very Active</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

              </div>

              {/* 3 Metrics Result Row */}
              <div className="grid grid-cols-3 gap-2 py-3.5 my-2 border-y border-[#EFE8DE] text-center">
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase">BMI</div>
                  <div className="text-base sm:text-lg font-black text-[#2C3E30]">
                    {calculations.bmi}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase">BMR</div>
                  <div className="text-xs sm:text-sm font-black text-[#2C3E30] mt-0.5">
                    {calculations.bmr} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase">Daily Target</div>
                  <div className="text-xs sm:text-sm font-black text-[#C5853B] mt-0.5">
                    {calculations.tdee} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width Caramel Button: GET PLAN */}
            <button
              type="button"
              onClick={handleGetPlan}
              className="w-full py-3 rounded-2xl bg-[#C5853B] hover:bg-[#B4752E] text-white font-black text-xs sm:text-sm tracking-wide uppercase shadow-sm hover:shadow-md transition-all cursor-pointer mt-2"
            >
              GET PLAN
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
