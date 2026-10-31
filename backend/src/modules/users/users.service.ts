import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateUserInfo(userId: number, dto: UpdateUserDto) {
    const updated = await this.prisma.users.update({
      where: { id: BigInt(userId) },
      data: {
        full_name: dto.fullName,
        phone: dto.phone,
        avatar_url: dto.avatarUrl,
        gender: dto.gender as any,
      },
    });

    return {
      message: 'Cập nhật thông tin thành công',
      user: {
        id: Number(updated.id),
        email: updated.email,
        fullName: updated.full_name,
        phone: updated.phone,
        avatarUrl: updated.avatar_url,
        gender: updated.gender,
      },
    };
  }

  async getAddresses(userId: number) {
    const addresses = await this.prisma.addresses.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return addresses.map((a) => ({
      id: Number(a.id),
      label: a.label,
      recipientName: a.recipient_name,
      phone: a.phone,
      province: a.province,
      district: a.district,
      ward: a.ward,
      street: a.street,
      note: a.note,
      isDefault: a.is_default,
    }));
  }

  async addAddress(userId: number, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.addresses.updateMany({
        where: { user_id: BigInt(userId) },
        data: { is_default: false },
      });
    }

    const address = await this.prisma.addresses.create({
      data: {
        user_id: BigInt(userId),
        label: dto.label,
        recipient_name: dto.recipientName,
        phone: dto.phone,
        province: dto.province,
        district: dto.district,
        ward: dto.ward,
        street: dto.street,
        note: dto.note,
        is_default: dto.isDefault ?? false,
      },
    });

    return {
      message: 'Thêm địa chỉ thành công',
      address: {
        id: Number(address.id),
        recipientName: address.recipient_name,
        phone: address.phone,
        fullAddress: `${address.street}, ${address.ward}, ${address.district}, ${address.province}`,
        isDefault: address.is_default,
      },
    };
  }

  async deleteAddress(userId: number, addressId: number) {
    await this.prisma.addresses.deleteMany({
      where: {
        id: BigInt(addressId),
        user_id: BigInt(userId),
      },
    });

    return { message: 'Đã xóa địa chỉ thành công' };
  }

  async findAllForAdmin(query: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };
    if (query.isActive !== undefined) {
      where.is_active = query.isActive;
    }
    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user_roles: {
            include: { roles: true },
          },
          loyalty_accounts: {
            include: { membership_tiers: true },
          },
          _count: {
            select: { orders: true },
          },
        },
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: Number(u.id),
        email: u.email,
        fullName: u.full_name,
        phone: u.phone,
        avatarUrl: u.avatar_url,
        gender: u.gender,
        isActive: u.is_active,
        roles: u.user_roles.map((ur) => ur.roles.name),
        loyaltyPoints: u.loyalty_accounts?.points_balance || 0,
        tier: u.loyalty_accounts?.membership_tiers?.name || 'Standard',
        orderCount: u._count.orders,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetail(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
      include: {
        user_roles: {
          include: { roles: true },
        },
        addresses: true,
        health_profiles: true,
        loyalty_accounts: {
          include: { membership_tiers: true },
        },
        orders: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng #${userId}`);
    }

    const totalSpend = user.orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + Number(o.total_amount), 0);

    return {
      id: Number(user.id),
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      gender: user.gender,
      isActive: user.is_active,
      roles: user.user_roles.map((ur) => ur.roles.name),
      loyalty: user.loyalty_accounts
        ? {
            points: user.loyalty_accounts.points_balance,
            tier: user.loyalty_accounts.membership_tiers?.name || 'Standard',
          }
        : null,
      healthProfile: user.health_profiles
        ? {
            heightCm: user.health_profiles.height_cm,
            weightKg: user.health_profiles.weight_kg,
            goal: user.health_profiles.goal,
            activityLevel: user.health_profiles.activity_level,
          }
        : null,
      addresses: user.addresses.map((a) => ({
        id: Number(a.id),
        label: a.label,
        recipientName: a.recipient_name,
        phone: a.phone,
        fullAddress: `${a.street}, ${a.ward}, ${a.district}, ${a.province}`,
        isDefault: a.is_default,
      })),
      ordersSummary: {
        totalOrders: user.orders.length,
        totalSpend,
        recentOrders: user.orders.map((o) => ({
          id: Number(o.id),
          orderCode: o.order_number,
          totalAmount: Number(o.total_amount),
          status: o.status,
          createdAt: o.created_at,
        })),
      },
      createdAt: user.created_at,
    };
  }

  async updateUserStatus(userId: number, isActive: boolean) {
    const updated = await this.prisma.users.update({
      where: { id: BigInt(userId) },
      data: { is_active: isActive },
    });

    return {
      message: `Đã ${isActive ? 'kích hoạt' : 'khóa'} tài khoản người dùng thành công`,
      user: {
        id: Number(updated.id),
        email: updated.email,
        isActive: updated.is_active,
      },
    };
  }
}
