import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { ACTIVITY, ageFrom, calculate, GOAL_DIETS, GOAL_LABEL, Goal } from './nutrition.calc';
import { CalculateDto, SaveProfileDto } from './dto/nutrition.dto';

@Injectable()
export class NutritionService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
  ) {}

  options() {
    return {
      activityLevels: Object.entries(ACTIVITY).map(([code, v]) => ({ code, label: v.label, factor: v.factor })),
      goals: Object.entries(GOAL_LABEL).map(([code, label]) => ({ code, label })),
    };
  }

  calculate(dto: CalculateDto) {
    return calculate(dto);
  }

  async getProfile(userId: number) {
    const uid = BigInt(userId);
    const [user, profile, allergens, diets] = await Promise.all([
      this.prisma.users.findUnique({ where: { id: uid }, select: { gender: true, date_of_birth: true } }),
      this.prisma.health_profiles.findUnique({ where: { user_id: uid } }),
      this.prisma.user_allergens.findMany({ where: { user_id: uid }, include: { allergens: true } }),
      this.prisma.user_diets.findMany({ where: { user_id: uid }, include: { diets: true } }),
    ]);
    const age = ageFrom(user?.date_of_birth);
    const input =
      profile && user?.gender && age
        ? { gender: user.gender, age, heightCm: Number(profile.height_cm), weightKg: Number(profile.weight_kg), activityLevel: profile.activity_level, goal: profile.goal as Goal }
        : null;
    return {
      hasProfile: !!profile,
      input: profile
        ? {
            gender: user?.gender ?? null,
            age,
            heightCm: Number(profile.height_cm),
            weightKg: Number(profile.weight_kg),
            targetWeightKg: profile.target_weight_kg ? Number(profile.target_weight_kg) : null,
            activityLevel: profile.activity_level,
            goal: profile.goal,
            medicalNote: profile.medical_note,
          }
        : { gender: user?.gender ?? null, age },
      result: input ? calculate(input) : null,
      stored: profile
        ? { bmi: Number(profile.bmi), bmr: Number(profile.bmr), tdee: Number(profile.tdee), dailyCalorieTarget: Number(profile.daily_calorie_target), updatedAt: profile.updated_at }
        : null,
      allergens: allergens.map((a) => ({ code: a.allergens.code, name: a.allergens.name_vi, severity: a.severity })),
      diets: diets.map((d) => ({ code: d.diets.code, name: d.diets.name_vi })),
    };
  }

  async saveProfile(userId: number, dto: SaveProfileDto) {
    const uid = BigInt(userId);
    // Store age as an approximate birth date (keeps day/month if the user already has one)
    const user = await this.prisma.users.findUnique({ where: { id: uid } });
    const currentAge = ageFrom(user?.date_of_birth);
    const dob =
      currentAge === dto.age && user?.date_of_birth ? user.date_of_birth : new Date(new Date().getFullYear() - dto.age, user?.date_of_birth?.getMonth() ?? 0, user?.date_of_birth?.getDate() ?? 1);

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({ where: { id: uid }, data: { gender: dto.gender, date_of_birth: dob } });
      const data = {
        height_cm: dto.heightCm,
        weight_kg: dto.weightKg,
        target_weight_kg: dto.targetWeightKg ?? null,
        activity_level: dto.activityLevel,
        goal: dto.goal,
        medical_note: dto.medicalNote ?? null,
        auto_calculate: true,
      };
      await tx.health_profiles.upsert({ where: { user_id: uid }, update: data, create: { ...data, user_id: uid } });
      await tx.weight_logs.upsert({
        where: { user_id_logged_on: { user_id: uid, logged_on: new Date(new Date().toISOString().slice(0, 10)) } },
        update: { weight_kg: dto.weightKg },
        create: { user_id: uid, weight_kg: dto.weightKg },
      });
      if (dto.allergens) {
        const rows = await tx.allergens.findMany({ where: { code: { in: dto.allergens } } });
        await tx.user_allergens.deleteMany({ where: { user_id: uid } });
        if (rows.length) await tx.user_allergens.createMany({ data: rows.map((a) => ({ user_id: uid, allergen_id: a.id })) });
      }
      if (dto.diets) {
        const rows = await tx.diets.findMany({ where: { code: { in: dto.diets } } });
        await tx.user_diets.deleteMany({ where: { user_id: uid } });
        if (rows.length) await tx.user_diets.createMany({ data: rows.map((d) => ({ user_id: uid, diet_id: d.id })) });
      }
    });
    return this.getProfile(userId);
  }

  /** Products matching the goal and free from the given allergens. */
  async recommendations(goal: Goal, allergens: string[] = [], limit = 8) {
    const res = await this.products.findAll({ diets: undefined, excludeAllergens: allergens, limit: 60, page: 1, inStock: true } as any);
    const wanted = new Set(GOAL_DIETS[goal] || []);
    const scored = res.data
      .map((p) => ({ p, score: p.diets.filter((d) => wanted.has(d.code)).length * 10 + (p.nutriScoreGrade === 'A' ? 3 : p.nutriScoreGrade === 'B' ? 2 : 0) + p.avgRating }))
      .filter((x) => x.score >= 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.p);
    return { goal, goalLabel: GOAL_LABEL[goal], products: scored };
  }

  async myRecommendations(userId: number) {
    const profile = await this.getProfile(userId);
    const goal = (profile.input as { goal?: Goal }).goal || 'eat_clean';
    return this.recommendations(goal, profile.allergens.map((a) => a.code));
  }
}
