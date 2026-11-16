import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const rawUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres.youqyeuwrppkxxrqpevu:Huubang%4007123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public';
    // Xử lý tự động loại bỏ dấu ngoặc kép nếu user lỡ dán vào Render
    const cleanUrl = rawUrl.replace(/^["']|["']$/g, '').trim();

    super({
      datasources: {
        db: {
          url: cleanUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
