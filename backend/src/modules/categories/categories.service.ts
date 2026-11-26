import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CategoryNode {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /** Active categories as a tree; productCount includes products of child categories. */
  async tree(): Promise<CategoryNode[]> {
    const rows = await this.prisma.categories.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: { where: { status: 'active', deleted_at: null } } } } },
    });
    const nodes = new Map<number, CategoryNode>();
    for (const c of rows) {
      nodes.set(Number(c.id), {
        id: Number(c.id),
        parentId: c.parent_id ? Number(c.parent_id) : null,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.image_url,
        sortOrder: c.sort_order,
        productCount: c._count.products,
        children: [],
      });
    }
    const roots: CategoryNode[] = [];
    for (const n of nodes.values()) {
      const parent = n.parentId ? nodes.get(n.parentId) : undefined;
      if (parent) parent.children.push(n);
      else roots.push(n);
    }
    const total = (n: CategoryNode): number => (n.productCount += n.children.reduce((s, c) => s + total(c), 0)) && n.productCount;
    roots.forEach((r) => total(r));
    return roots;
  }

  async findBySlug(slug: string) {
    const c = await this.prisma.categories.findUnique({ where: { slug }, include: { categories: true, other_categories: { where: { is_active: true } } } });
    if (!c || !c.is_active) throw new NotFoundException('Không tìm thấy danh mục');
    return {
      id: Number(c.id),
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.image_url,
      parent: c.categories ? { name: c.categories.name, slug: c.categories.slug } : null,
      children: c.other_categories.map((x) => ({ name: x.name, slug: x.slug })),
    };
  }

  async meta() {
    const [diets, allergens, certifications] = await Promise.all([
      this.prisma.diets.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.allergens.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.certifications.findMany({ orderBy: { id: 'asc' } }),
    ]);
    return {
      diets: diets.map((d) => ({ code: d.code, name: d.name_vi })),
      allergens: allergens.map((a) => ({ code: a.code, name: a.name_vi })),
      certifications: certifications.map((c) => ({ code: c.code, name: c.name, issuer: c.issuer })),
    };
  }
}
