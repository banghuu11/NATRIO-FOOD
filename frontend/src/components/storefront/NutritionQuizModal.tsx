'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Dumbbell,
  Heart,
  Scale,
  Apple,
  ShoppingBag,
  Loader2,
  RefreshCw,
  Award,
} from 'lucide-react';
import { quizService } from '@/services/quiz.service';
import { useCartStore } from '@/stores/useCartStore';
import { toast } from 'sonner';

interface NutritionQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionOption {
  id: number;
  label: string;
  subLabel?: string;
  icon?: string;
}

interface QuizQuestion {
  id: number;
  stepNumber: number;
  question: string;
  options: QuestionOption[];
}

export default function NutritionQuizModal({ isOpen, onClose }: NutritionQuizModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addItem = useCartStore((state) => state.addItem);

  // Default fallback questions if API is loading or empty
  const defaultQuestions: QuizQuestion[] = [
    {
      id: 1,
      stepNumber: 1,
      question: 'Mục tiêu sức khỏe chính của bạn là gì?',
      options: [
        { id: 1, label: 'Giảm mỡ & Giữ vóc dáng thon gọn', subLabel: 'Kiểm soát calo, hạn chế đường & carbs xấu' },
        { id: 2, label: 'Tăng cơ bắp & Nâng cao thể lực', subLabel: 'Bổ sung giàu protein thực vật & hạt năng lượng' },
        { id: 3, label: 'Ăn sạch (Eat Clean) & Thanh lọc cơ thể', subLabel: '100% nguyên liệu tự nhiên, giàu chất xơ & vitamin' },
        { id: 4, label: 'Bảo vệ tim mạch & Ổn định đường huyết', subLabel: 'Giàu Omega 3-6-9 từ hạt macca, óc chó, hạnh nhân' },
      ],
    },
    {
      id: 2,
      stepNumber: 2,
      question: 'Chế độ ăn uống ưu tiên hàng đầu của bạn?',
      options: [
        { id: 5, label: 'Ăn lành mạnh tổng hợp (Eat Clean / Healthy)', subLabel: 'Ăn đủ nhóm chất tự nhiên, ít gia vị' },
        { id: 6, label: 'Thuần chay (Plant-based / Vegan)', subLabel: '100% nguồn gốc thực vật từ hạt & rau củ' },
        { id: 7, label: 'Low-Carb / Keto thân thiện', subLabel: 'Ít tinh bột, giàu chất béo tốt không bão hòa' },
        { id: 8, label: 'Không đường & Không chứa Gluten', subLabel: 'Phù hợp người kiêng đường hoặc dị ứng lúa mì' },
      ],
    },
    {
      id: 3,
      stepNumber: 3,
      question: 'Mức độ vận động thể chất hàng ngày của bạn?',
      options: [
        { id: 9, label: 'Ít vận động (Dân văn phòng, ngồi nhiều)', subLabel: 'Cần bữa ăn nhẹ ít calo, giàu chất xơ tránh tích mỡ' },
        { id: 10, label: 'Vận động vừa phải (Đi bộ, tập 2-3 buổi/tuần)', subLabel: 'Cân bằng giữa năng lượng và vitamin khoáng chất' },
        { id: 11, label: 'Tập luyện thường xuyên (Gym, chạy bộ 4-6 buổi)', subLabel: 'Cần bổ sung nhiều đạm & phục hồi cơ bắp' },
      ],
    },
  ];

  const [questions, setQuestions] = useState<QuizQuestion[]>(defaultQuestions);

  useEffect(() => {
    if (isOpen) {
      async function loadQuiz() {
        try {
          const res = await quizService.getQuestions();
          if (res && res.length > 0) {
            setQuestions(res);
          }
        } catch (err) {
          // Keep default fallback questions
        }
      }
      loadQuiz();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQ = questions[currentStep];
  const isSelected = (optId: number) => selectedOptions[currentQ.id] === optId;

  const handleSelectOption = (optId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [currentQ.id]: optId,
    }));
  };

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Submit quiz to Backend API
      setSubmitting(true);
      try {
        const optionIds = Object.values(selectedOptions);
        const res = await quizService.submitQuiz(optionIds);
        setResult(res);
      } catch (err) {
        // Fallback recommended results
        setResult({
          goal: 'Ăn Sạch & Giảm Mỡ Lành Mạnh',
          dailyCalories: 1650,
          macros: { protein: '25%', carbs: '45%', fat: '30%' },
          recommendedProducts: [
            {
              id: '1',
              name: 'Granola Siêu Hạt Ăn Kiêng Không Đường (500g)',
              price: 145000,
              thumbnail: 'https://images.unsplash.com/photo-1517093707765-a895311f9f25?auto=format&fit=crop&w=400&q=80',
              calories: 140,
              nutriScore: 'A',
              benefit: 'Chuẩn bữa sáng nhanh no lâu, 0g đường tinh luyện',
            },
            {
              id: '2',
              name: 'Hạt Macca Đắk Lắk Sấy Nứt Vỏ Loại 1 (500g)',
              price: 185000,
              thumbnail: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=400&q=80',
              calories: 190,
              nutriScore: 'A',
              benefit: 'Giàu Omega-7 và chất béo tốt bảo vệ tim mạch',
            },
            {
              id: '3',
              name: 'Hạnh Nhân Mỹ Rang Mộc Nguyên Vị (500g)',
              price: 160000,
              thumbnail: 'https://images.unsplash.com/photo-1508061252445-5350f31934b0?auto=format&fit=crop&w=400&q=80',
              calories: 160,
              nutriScore: 'A',
              benefit: 'Bổ sung Vitamin E và 6g Protein thực vật/khẩu phần',
            },
          ],
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAddAllToCart = () => {
    if (!result?.recommendedProducts) return;
    result.recommendedProducts.forEach((p: any) => {
      addItem(
        {
          id: String(p.id),
          name: p.name,
          slug: `product-${p.id}`,
          price: p.price,
          unit: '500g',
          thumbnail: p.thumbnail,
          category: { id: '1', name: 'Hạt Dinh Dưỡng', slug: 'hat-dinh-duong' },
          categoryId: 'hat-dinh-duong',
          servingSize: '30g',
          calories: p.calories || 150,
          protein: 6,
          carbs: 10,
          fat: 12,
          nutriScore: p.nutriScore || 'A',
          badges: ['ORGANIC', 'GỢI Ý CÁ NHÂN'],
          allergens: [],
          rating: 5,
          reviewCount: 24,
          isAvailable: true,
          stock: 100,
        },
        1
      );
    });
    toast.success('Đã thêm trọn bộ combo dinh dưỡng cá nhân vào giỏ hàng!', {
      description: 'Giúp bạn đạt mục tiêu calo & vóc dáng nhanh chóng.',
    });
    onClose();
  };

  const resetQuiz = () => {
    setSelectedOptions({});
    setCurrentStep(0);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI NUTRITION QUIZ 2026</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Trắc Nghiệm Dinh Dưỡng Cá Nhân Hóa
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Chỉ 3 câu hỏi nhanh để NUTRIO xây dựng thực đơn thực phẩm chuẩn calo & thể trạng riêng bạn.
          </p>

          {/* Progress Bar */}
          {!result && (
            <div className="mt-4 flex items-center gap-2">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    idx <= currentStep ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {submitting ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đang phân tích dữ liệu dinh dưỡng...</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Thuật toán NUTRIO đang tính toán lượng calo và gợi ý combo thực phẩm tối ưu.
                </p>
              </div>
            </div>
          ) : result ? (
            /* Quiz Result Screen */
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    KẾT QUẢ ĐỀ XUẤT CHO BẠN
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{result.goal}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Khuyến nghị nạp: <strong>{result.dailyCalories} kcal/ngày</strong> để đạt hiệu quả cao nhất.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-emerald-200 text-center shrink-0">
                  <div className="text-[10px] text-slate-500 font-semibold">Tỷ lệ Macros tối ưu</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    Đạm {result.macros?.protein} • Carb {result.macros?.carbs} • Béo {result.macros?.fat}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Combo Thực Phẩm Phù Hợp Nhất (Gợi ý 1-Click)</span>
                </h4>

                <div className="space-y-3">
                  {result.recommendedProducts?.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-emerald-500/50 bg-slate-50/50 transition-all"
                    >
                      <img
                        src={p.thumbnail}
                        alt={p.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                            Nutri {p.nutriScore}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">~{p.calories} kcal/khẩu phần</span>
                        </div>
                        <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate mt-0.5">
                          {p.name}
                        </h5>
                        <p className="text-[11px] text-emerald-700 font-medium line-clamp-1">{p.benefit}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black text-slate-900">
                          {p.price.toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Quiz Questions Flow */
            <div className="space-y-4">
              <div className="mb-2">
                <span className="text-xs font-bold text-emerald-700">
                  Câu hỏi {currentStep + 1} / {questions.length}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {currentQ?.question}
                </h3>
              </div>

              <div className="space-y-2.5">
                {currentQ?.options?.map((opt) => {
                  const selected = isSelected(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-bold ${selected ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {opt.label}
                        </div>
                        {opt.subLabel && (
                          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          selected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {result ? (
            <>
              <button
                type="button"
                onClick={resetQuiz}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm Lại</span>
              </button>
              <button
                type="button"
                onClick={handleAddAllToCart}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Thêm Trọn Gói Combo Này</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  currentStep === 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-white cursor-pointer'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay Lại</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedOptions[currentQ?.id]}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all ${
                  selectedOptions[currentQ?.id]
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{currentStep === questions.length - 1 ? 'Xem Kết Quả Đề Xuất' : 'Tiếp Tục'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
