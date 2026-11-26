/**
 * Nutrition formulas (same rules as the DB trigger trg_health_profile_calc):
 *  - BMI  = kg / m²  (classified with the Asia-Pacific cut-offs used for Vietnamese adults)
 *  - BMR  = Mifflin–St Jeor
 *  - TDEE = BMR × activity factor
 * Results are for reference only and do not replace medical advice.
 */
export type Gender = 'male' | 'female' | 'other';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle' | 'eat_clean' | 'control_blood_sugar';

export const ACTIVITY: Record<Activity, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: 'Ít vận động (văn phòng, hầu như không tập)' },
  light: { factor: 1.375, label: 'Vận động nhẹ (tập 1–3 buổi/tuần)' },
  moderate: { factor: 1.55, label: 'Vận động vừa (tập 3–5 buổi/tuần)' },
  active: { factor: 1.725, label: 'Vận động nhiều (tập 6–7 buổi/tuần)' },
  very_active: { factor: 1.9, label: 'Rất nhiều (lao động nặng / tập 2 lần/ngày)' },
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose_weight: 'Giảm cân',
  maintain: 'Giữ cân',
  gain_weight: 'Tăng cân',
  gain_muscle: 'Tăng cơ',
  eat_clean: 'Ăn sạch',
  control_blood_sugar: 'Kiểm soát đường huyết',
};

/** Diet codes that match each goal – used for product recommendations. */
export const GOAL_DIETS: Record<Goal, string[]> = {
  lose_weight: ['low_calorie', 'low_carb', 'high_protein'],
  maintain: ['eat_clean'],
  gain_weight: ['high_protein'],
  gain_muscle: ['high_protein'],
  eat_clean: ['eat_clean', 'vegan'],
  control_blood_sugar: ['diabetic_friendly', 'sugar_free', 'low_carb'],
};

export interface CalcInput {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: Activity;
  goal: Goal;
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { code: 'underweight', label: 'Thiếu cân', advice: 'Bạn nên tăng nhẹ năng lượng nạp vào, ưu tiên thực phẩm giàu đạm và chất béo tốt như các loại hạt.' };
  if (bmi < 23) return { code: 'normal', label: 'Bình thường', advice: 'Cân nặng của bạn đang ở mức lý tưởng. Hãy duy trì chế độ ăn cân bằng và vận động đều đặn.' };
  if (bmi < 25) return { code: 'overweight', label: 'Thừa cân', advice: 'Bạn hơi thừa cân. Giảm nhẹ năng lượng, tăng rau xanh, đạm nạc và chất xơ sẽ giúp ích.' };
  if (bmi < 30) return { code: 'obese_1', label: 'Béo phì độ I', advice: 'Nên giảm cân từ từ 0,5 kg/tuần, kết hợp vận động. Hãy tham khảo ý kiến bác sĩ nếu có bệnh nền.' };
  return { code: 'obese_2', label: 'Béo phì độ II', advice: 'Bạn nên được bác sĩ hoặc chuyên gia dinh dưỡng tư vấn trực tiếp để có kế hoạch phù hợp.' };
}

export function calculate(input: CalcInput) {
  const { gender, age, heightCm, weightKg, activityLevel, goal } = input;
  const bmi = Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : gender === 'female' ? -161 : -78));
  const tdee = Math.round(bmr * ACTIVITY[activityLevel].factor);
  const target = Math.round(
    goal === 'lose_weight' ? Math.max(tdee - 500, 1200) : goal === 'gain_weight' ? tdee + 400 : goal === 'gain_muscle' ? tdee + 300 : tdee,
  );
  const proteinFactor = goal === 'lose_weight' || goal === 'gain_muscle' ? 2.0 : goal === 'gain_weight' ? 1.8 : 1.6;
  const proteinG = Math.round(weightKg * proteinFactor * 10) / 10;
  const fatG = Math.round(((target * 0.25) / 9) * 10) / 10;
  const carbG = Math.round((Math.max(target - proteinG * 4 - fatG * 9, 0) / 4) * 10) / 10;
  const category = bmiCategory(bmi);
  const minHealthy = Math.round(18.5 * (heightCm / 100) ** 2 * 10) / 10;
  const maxHealthy = Math.round(22.9 * (heightCm / 100) ** 2 * 10) / 10;

  return {
    bmi,
    bmiCategory: category,
    healthyWeightRange: { min: minHealthy, max: maxHealthy },
    bmr,
    tdee,
    dailyCalorieTarget: target,
    macros: {
      proteinG,
      carbG,
      fatG,
      proteinPct: Math.round(((proteinG * 4) / target) * 100),
      carbPct: Math.round(((carbG * 4) / target) * 100),
      fatPct: Math.round(((fatG * 9) / target) * 100),
    },
    waterMl: Math.round(weightKg * 35),
    explanations: {
      bmi: `BMI ${bmi} – ${category.label}. Với chiều cao ${heightCm} cm, cân nặng khỏe mạnh khoảng ${minHealthy}–${maxHealthy} kg. ${category.advice}`,
      bmr: `BMR ${bmr} kcal là năng lượng cơ thể cần để duy trì sự sống khi nghỉ ngơi hoàn toàn (thở, tim đập, giữ thân nhiệt).`,
      tdee: `TDEE ${tdee} kcal là tổng năng lượng bạn tiêu hao mỗi ngày khi tính cả vận động (${ACTIVITY[activityLevel].label.toLowerCase()}).`,
      target:
        goal === 'lose_weight'
          ? `Để giảm cân an toàn (~0,5 kg/tuần), bạn nên nạp khoảng ${target} kcal/ngày (thấp hơn TDEE 500 kcal).`
          : goal === 'gain_weight'
            ? `Để tăng cân lành mạnh, bạn nên nạp khoảng ${target} kcal/ngày (cao hơn TDEE 400 kcal).`
            : goal === 'gain_muscle'
              ? `Để tăng cơ, nạp khoảng ${target} kcal/ngày (dư 300 kcal) kết hợp tập kháng lực và đủ ${proteinG} g đạm.`
              : `Để ${GOAL_LABEL[goal].toLowerCase()}, bạn nên nạp khoảng ${target} kcal/ngày.`,
      macros: `Gợi ý chia bữa: ${proteinG} g đạm, ${carbG} g tinh bột và ${fatG} g chất béo mỗi ngày. Một nắm hạt 30 g cung cấp khoảng 160–200 kcal.`,
    },
    disclaimer: 'Kết quả chỉ mang tính tham khảo, được tính theo công thức Mifflin–St Jeor, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.',
  };
}

export const ageFrom = (dob: Date | null | undefined) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
};
