import { Injectable } from '@nestjs/common';
import { notification_type, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Db = PrismaService | Prisma.TransactionClient;

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  create(userId: bigint | number, type: notification_type, title: string, body?: string, data: Record<string, unknown> = {}, db: Db = this.prisma) {
    return db.notifications.create({
      data: { user_id: BigInt(userId), type, title, body, data: data as Prisma.InputJsonValue },
    });
  }
}
