import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAllCategories() {
    const categories = await this.prisma.categories.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        _count: {
          select: { products: { where: { status: 'active', deleted_at: null } } },
        },
      },
    });

    return categories.map((c) => ({
      id: Number(c.id),
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.image_url,
      sortOrder: c.sort_order,
      productCount: c._count.products,
    }));
  }

  async findCategoryBySlug(slug: string) {
    const category = await this.prisma.categories.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: { where: { status: 'active', deleted_at: null } } },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục với slug: ${slug}`);
    }

    return {
      id: Number(category.id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      productCount: category._count.products,
    };
  }

  async findAllBrands() {
    const brands = await this.prisma.brands.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });

    return brands.map((b) => ({
      id: Number(b.id),
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo_url,
      country: b.country,
      description: b.description,
    }));
  }

  async findAllCertifications() {
    const certs = await this.prisma.certifications.findMany({
      orderBy: { name: 'asc' },
    });

    return certs.map((c) => ({
      id: Number(c.id),
      code: c.code,
      name: c.name,
      issuer: c.issuer,
      description: c.description,
      logoUrl: c.logo_url,
    }));
  }

  async findAllFarms() {
    const farms = await this.prisma.farms.findMany({
      orderBy: { name: 'asc' },
    });

    return farms.map((f) => ({
      id: Number(f.id),
      name: f.name,
      ownerName: f.owner_name,
      province: f.province,
      address: f.address,
      description: f.description,
      imageUrl: f.image_url,
      latitude: f.latitude ? Number(f.latitude) : null,
      longitude: f.longitude ? Number(f.longitude) : null,
    }));
  }
}
