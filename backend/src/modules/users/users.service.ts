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
}
