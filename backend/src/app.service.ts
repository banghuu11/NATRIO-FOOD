import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const [userCount, productCount, categoryCount] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.products.count(),
      this.prisma.categories.count(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Nutrio Healthy Food Backend API',
      database: {
        connected: true,
        stats: {
          users: userCount,
          products: productCount,
          categories: categoryCount,
        },
      },
    };
  }
}

