import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogFoodDto, LogWaterDto, UpdateHealthProfileDto } from './dto/health.dto';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getAllergensAndDiets() {
    const [allergens, diets] = await Promise.all([
      this.prisma.allergens.findMany({ orderBy: { name_vi: 'asc' } }),
      this.prisma.diets.findMany({ orderBy: { name_vi: 'asc' } }),
    ]);

    return {
      allergens: allergens.map((a) => ({
        id: Number(a.id),
        code: a.code,
        nameVi: a.name_vi,
        nameEn: a.name_en,
        description: a.description,
        iconUrl: a.icon_url,
      })),
      diets: diets.map((d) => ({
        id: Number(d.id),
        code: d.code,
        nameVi: d.name_vi,
        nameEn: d.name_en,
        description: d.description,
        iconUrl: d.icon_url,
      })),
    };
  }

  async getMyHealthProfile(userId: number) {
    const profile = await this.prisma.health_profiles.findUnique({
      where: { user_id: BigInt(userId) },
    });

    const [userAllergens, userDiets] = await Promise.all([
      this.prisma.user_allergens.findMany({
        where: { user_id: BigInt(userId) },
        include: { allergens: true },
      }),
      this.prisma.user_diets.findMany({
        where: { user_id: BigInt(userId) },
        include: { diets: true },
      }),
    ]);

    if (!profile) {
      return {
        hasProfile: false,
        profile: null,
        allergens: [],
        diets: [],
      };
    }

    return {
      hasProfile: true,
      profile: {
        heightCm: Number(profile.height_cm),
        weightKg: Number(profile.weight_kg),
        targetWeightKg: profile.target_weight_kg ? Number(profile.target_weight_kg) : null,
        activityLevel: profile.activity_level,
        goal: profile.goal,
        bmi: profile.bmi ? Number(profile.bmi) : null,
        bmr: profile.bmr ? Number(profile.bmr) : null,
        tdee: profile.tdee ? Number(profile.tdee) : null,
        dailyCalorieTarget: profile.daily_calorie_target ? Number(profile.daily_calorie_target) : null,
        dailyProteinG: profile.daily_protein_g ? Number(profile.daily_protein_g) : null,
        dailyCarbG: profile.daily_carb_g ? Number(profile.daily_carb_g) : null,
        dailyFatG: profile.daily_fat_g ? Number(profile.daily_fat_g) : null,
        dailyWaterMl: profile.daily_water_ml,
        medicalNote: profile.medical_note,
      },
      allergens: userAllergens.map((ua) => ({
        code: ua.allergens.code,
        name: ua.allergens.name_vi,
      })),
      diets: userDiets.map((ud) => ({
        code: ud.diets.code,
        name: ud.diets.name_vi,
      })),
    };
  }

  async updateHealthProfile(userId: number, dto: UpdateHealthProfileDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Lưu / Cập nhật health_profile (Trigger PostgreSQL trg_health_profile_calc sẽ tự động tính chính xác các chỉ số BMI/BMR/TDEE/Calo)
    await this.prisma.health_profiles.upsert({
      where: { user_id: BigInt(userId) },
      update: {
        height_cm: dto.heightCm,
        weight_kg: dto.weightKg,
        target_weight_kg: dto.targetWeightKg,
        activity_level: dto.activityLevel as any,
        goal: dto.goal as any,
        medical_note: dto.medicalNote,
        auto_calculate: true,
      },
      create: {
        user_id: BigInt(userId),
        height_cm: dto.heightCm,
        weight_kg: dto.weightKg,
        target_weight_kg: dto.targetWeightKg,
        activity_level: dto.activityLevel as any,
        goal: dto.goal as any,
        medical_note: dto.medicalNote,
        auto_calculate: true,
      },
    });

    // Cập nhật dị ứng
    if (dto.allergenCodes) {
      await this.prisma.user_allergens.deleteMany({ where: { user_id: BigInt(userId) } });
      const allergens = await this.prisma.allergens.findMany({
        where: { code: { in: dto.allergenCodes } },
      });
      if (allergens.length > 0) {
        await this.prisma.user_allergens.createMany({
          data: allergens.map((a) => ({
            user_id: BigInt(userId),
            allergen_id: a.id,
            severity: 2,
          })),
        });
      }
    }

    // Cập nhật chế độ ăn
    if (dto.dietCodes) {
      await this.prisma.user_diets.deleteMany({ where: { user_id: BigInt(userId) } });
      const diets = await this.prisma.diets.findMany({
        where: { code: { in: dto.dietCodes } },
      });
      if (diets.length > 0) {
        await this.prisma.user_diets.createMany({
          data: diets.map((d) => ({
            user_id: BigInt(userId),
            diet_id: d.id,
          })),
        });
      }
    }

    return this.getMyHealthProfile(userId);
  }

  async logWater(userId: number, dto: LogWaterDto) {
    const log = await this.prisma.water_logs.create({
      data: {
        user_id: BigInt(userId),
        amount_ml: dto.amountMl,
      },
    });

    // Tính tổng nước trong ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await this.prisma.water_logs.findMany({
      where: {
        user_id: BigInt(userId),
        logged_at: { gte: today },
      },
    });

    const totalWaterToday = todayLogs.reduce((sum, l) => sum + l.amount_ml, 0);

    return {
      message: 'Đã ghi nhận lượng nước uống',
      log: {
        id: Number(log.id),
        amountMl: log.amount_ml,
        loggedAt: log.logged_at,
      },
      totalWaterToday,
    };
  }

  async logFood(userId: number, dto: LogFoodDto) {
    let calories = dto.caloriesKcal || 0;
    let protein = dto.proteinG || 0;
    let carb = dto.carbohydrateG || 0;
    let fat = dto.fatG || 0;
    let foodName = dto.customFoodName;

    if (dto.productId) {
      const product = await this.prisma.products.findUnique({
        where: { id: BigInt(dto.productId) },
        include: { nutrition_facts: true },
      });

      if (product) {
        foodName = product.name;
        if (product.nutrition_facts) {
          const ratio = dto.quantityG / 100.0;
          calories = Number(product.nutrition_facts.calories_kcal) * ratio;
          protein = Number(product.nutrition_facts.protein_g) * ratio;
          carb = Number(product.nutrition_facts.carbohydrate_g) * ratio;
          fat = Number(product.nutrition_facts.fat_g) * ratio;
        }
      }
    }

    const diary = await this.prisma.food_diary.create({
      data: {
        user_id: BigInt(userId),
        product_id: dto.productId ? BigInt(dto.productId) : null,
        custom_food_name: foodName,
        meal_type: dto.mealType as any,
        quantity_g: dto.quantityG,
        calories_kcal: Math.round(calories * 10) / 10,
        protein_g: Math.round(protein * 10) / 10,
        carbohydrate_g: Math.round(carb * 10) / 10,
        fat_g: Math.round(fat * 10) / 10,
      },
    });

    return {
      message: 'Đã ghi nhận món ăn vào nhật ký dinh dưỡng',
      entry: {
        id: Number(diary.id),
        mealType: diary.meal_type,
        foodName: diary.custom_food_name,
        quantityG: Number(diary.quantity_g),
        caloriesKcal: Number(diary.calories_kcal),
        proteinG: Number(diary.protein_g),
        carbG: Number(diary.carbohydrate_g),
        fatG: Number(diary.fat_g),
      },
    };
  }
}
