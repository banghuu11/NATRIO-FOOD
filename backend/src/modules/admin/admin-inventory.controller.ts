import { BadRequestException, Body, Controller, Get, NotFoundException, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { movement_type, Prisma } from '@prisma/client';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { pageMeta } from '../../common/utils/serialize';

class ReceiveDto {
  @ApiProperty() @IsInt() @Min(1) variantId: number;
  @ApiProperty() @IsInt() @Min(1) warehouseId: number;
  @ApiProperty() @IsInt() @Min(1, { message: 'Số lượng nhập phải lớn hơn 0' }) quantity: number;
  @ApiPropertyOptional() @IsOptional() @Matches(/^[A-Z0-9-]{3,60}$/i, { message: 'Mã lô chỉ gồm chữ, số, gạch ngang' }) batchCode?: string;
  @ApiProperty() @IsDateString({}, { message: 'Vui lòng nhập hạn sử dụng' }) expiresOn: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() manufacturedOn?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() supplierId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() farmId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) note?: string;
}

class IssueDto {
  @ApiProperty() @IsInt() @Min(1) inventoryId: number;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
  @ApiProperty({ enum: ['damaged', 'expired', 'adjustment', 'transfer_out'] }) @IsIn(['damaged', 'expired', 'adjustment', 'transfer_out']) type: movement_type;
  @ApiProperty() @IsString() @MaxLength(300) note: string;
}

class AdjustDto {
  @ApiProperty() @IsInt() @Min(1) inventoryId: number;
  @ApiProperty() @IsInt() @Min(0) countedQuantity: number;
  @ApiProperty() @IsString() @MaxLength(300) note: string;
}

const MOVEMENT_LABEL: Record<movement_type, string> = {
  purchase_in: 'Nhập kho',
  sale_out: 'Xuất bán',
  return_in: 'Nhập hàng hoàn',
  adjustment: 'Điều chỉnh',
  expired: 'Hủy do hết hạn',
  damaged: 'Hủy do hư hỏng',
  transfer_in: 'Chuyển kho (nhận)',
  transfer_out: 'Chuyển kho (xuất)',
};

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private prisma: PrismaService) {}

  @Get('stock')
  async stock(@Query('q') q?: string, @Query('filter') filter?: string) {
    const search = q?.trim() ? `%${q.trim()}%` : null;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT v.id, v.sku, v.name AS variant_name, v.reorder_level, v.is_active, p.name AS product_name, p.id AS product_id,
             COALESCE(SUM(i.quantity_on_hand) FILTER (WHERE b.expires_on IS NULL OR b.expires_on >= current_date), 0)::int AS on_hand,
             COALESCE(SUM(i.quantity_reserved), 0)::int AS reserved,
             COALESCE(SUM(i.quantity_on_hand) FILTER (WHERE b.expires_on < current_date), 0)::int AS expired_qty,
             MIN(b.expires_on) FILTER (WHERE i.quantity_on_hand > 0 AND b.expires_on >= current_date) AS nearest_expiry,
             COUNT(DISTINCT b.id) FILTER (WHERE i.quantity_on_hand > 0)::int AS batch_count
      FROM product_variants v
      JOIN products p ON p.id = v.product_id AND p.deleted_at IS NULL
      LEFT JOIN product_batches b ON b.variant_id = v.id
      LEFT JOIN inventory i ON i.batch_id = b.id
      WHERE v.is_active ${search ? Prisma.sql`AND (p.name ILIKE ${search} OR v.sku ILIKE ${search})` : Prisma.empty}
      GROUP BY v.id, p.id ORDER BY p.name, v.id`;
    const data = rows.map((r) => {
      const available = r.on_hand - r.reserved;
      const daysLeft = r.nearest_expiry ? Math.ceil((new Date(r.nearest_expiry).getTime() - Date.now()) / 864e5) : null;
      return {
        variantId: Number(r.id), productId: Number(r.product_id), sku: r.sku, productName: r.product_name, variantName: r.variant_name,
        onHand: r.on_hand, reserved: r.reserved, available, reorderLevel: r.reorder_level, expiredQty: r.expired_qty,
        nearestExpiry: r.nearest_expiry, daysToExpiry: daysLeft, batchCount: r.batch_count,
        lowStock: available <= r.reorder_level, nearExpiry: daysLeft !== null && daysLeft <= 30,
      };
    });
    return filter === 'low' ? data.filter((d) => d.lowStock) : filter === 'expiry' ? data.filter((d) => d.nearExpiry || d.expiredQty > 0) : data;
  }

  @Get('batches')
  async batches(@Query('variantId') variantId?: string, @Query('q') q?: string) {
    const rows = await this.prisma.product_batches.findMany({
      where: {
        ...(variantId ? { variant_id: BigInt(variantId) } : {}),
        ...(q ? { OR: [{ batch_code: { contains: q, mode: 'insensitive' } }, { product_variants: { products: { name: { contains: q, mode: 'insensitive' } } } }] } : {}),
      },
      orderBy: [{ expires_on: 'asc' }],
      take: 200,
      include: { inventory: { include: { warehouses: true } }, product_variants: { include: { products: { select: { name: true } } } }, suppliers: true, farms: true },
    });
    return rows.map((b) => ({
      id: Number(b.id), batchCode: b.batch_code, qrCode: b.qr_code, productName: b.product_variants.products.name, variantName: b.product_variants.name, sku: b.product_variants.sku,
      manufacturedOn: b.manufactured_on, expiresOn: b.expires_on, receivedOn: b.received_on, quantityReceived: b.quantity_received, unitCost: b.unit_cost ? Number(b.unit_cost) : null,
      supplier: b.suppliers?.name ?? null, farm: b.farms?.name ?? null,
      daysToExpiry: b.expires_on ? Math.ceil((b.expires_on.getTime() - Date.now()) / 864e5) : null,
      stock: b.inventory.map((i) => ({ inventoryId: Number(i.id), warehouse: i.warehouses.name, onHand: i.quantity_on_hand, reserved: i.quantity_reserved, available: i.quantity_on_hand - i.quantity_reserved })),
    }));
  }

  @Post('receive')
  async receive(@Body() dto: ReceiveDto, @CurrentUser() user: CurrentUserPayload) {
    const variant = await this.prisma.product_variants.findUnique({ where: { id: BigInt(dto.variantId) }, include: { products: true } });
    if (!variant) throw new NotFoundException('Không tìm thấy sản phẩm');
    const exp = new Date(dto.expiresOn);
    if (exp <= new Date()) throw new BadRequestException('Hạn sử dụng phải sau ngày hôm nay');
    if (dto.manufacturedOn && new Date(dto.manufacturedOn) >= exp) throw new BadRequestException('Ngày sản xuất phải trước hạn sử dụng');
    const code = dto.batchCode?.toUpperCase() || `LOT-${variant.sku}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${randomBytes(2).toString('hex').toUpperCase()}`;
    if (await this.prisma.product_batches.findUnique({ where: { batch_code: code } })) throw new BadRequestException('Mã lô đã tồn tại');
    const batch = await this.prisma.$transaction(async (tx) => {
      const b = await tx.product_batches.create({
        data: {
          variant_id: variant.id, batch_code: code, qr_code: `NUTRIO-${randomBytes(5).toString('hex').toUpperCase()}`,
          manufactured_on: dto.manufacturedOn ? new Date(dto.manufacturedOn) : null, expires_on: exp, quantity_received: dto.quantity,
          unit_cost: dto.unitCost ?? variant.cost_price, supplier_id: dto.supplierId ? BigInt(dto.supplierId) : variant.products.supplier_id,
          farm_id: dto.farmId ? BigInt(dto.farmId) : variant.products.farm_id,
        },
      });
      await tx.inventory.create({ data: { warehouse_id: BigInt(dto.warehouseId), batch_id: b.id, quantity_on_hand: dto.quantity } });
      await tx.stock_movements.create({ data: { batch_id: b.id, warehouse_id: BigInt(dto.warehouseId), movement_type: 'purchase_in', quantity: dto.quantity, reference_type: 'receipt', note: dto.note || 'Nhập kho', created_by: BigInt(user.id) } });
      return b;
    });
    return { message: `Đã nhập ${dto.quantity} ${variant.unit_label ?? 'sp'} – lô ${batch.batch_code}`, batchId: Number(batch.id) };
  }

  @Post('issue')
  async issue(@Body() dto: IssueDto, @CurrentUser() user: CurrentUserPayload) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM inventory WHERE id = ${BigInt(dto.inventoryId)} FOR UPDATE`;
      if (!rows.length) throw new NotFoundException('Không tìm thấy tồn kho');
      const inv = await tx.inventory.findUniqueOrThrow({ where: { id: BigInt(dto.inventoryId) } });
      const free = inv.quantity_on_hand - inv.quantity_reserved;
      if (dto.quantity > free) throw new BadRequestException(`Chỉ có thể xuất tối đa ${free} (đã giữ ${inv.quantity_reserved} cho đơn hàng)`);
      await tx.inventory.update({ where: { id: inv.id }, data: { quantity_on_hand: { decrement: dto.quantity } } });
      await tx.stock_movements.create({ data: { batch_id: inv.batch_id, warehouse_id: inv.warehouse_id, movement_type: dto.type, quantity: -dto.quantity, reference_type: 'manual', note: dto.note, created_by: BigInt(user.id) } });
      return { message: `Đã xuất ${dto.quantity} khỏi kho (${MOVEMENT_LABEL[dto.type]})` };
    });
  }

  @Post('adjust')
  async adjust(@Body() dto: AdjustDto, @CurrentUser() user: CurrentUserPayload) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM inventory WHERE id = ${BigInt(dto.inventoryId)} FOR UPDATE`;
      if (!rows.length) throw new NotFoundException('Không tìm thấy tồn kho');
      const inv = await tx.inventory.findUniqueOrThrow({ where: { id: BigInt(dto.inventoryId) } });
      if (dto.countedQuantity < inv.quantity_reserved) throw new BadRequestException(`Số lượng thực tế không thể nhỏ hơn số đang giữ cho đơn (${inv.quantity_reserved})`);
      const diff = dto.countedQuantity - inv.quantity_on_hand;
      if (diff === 0) return { message: 'Số liệu khớp, không cần điều chỉnh' };
      await tx.inventory.update({ where: { id: inv.id }, data: { quantity_on_hand: dto.countedQuantity } });
      await tx.stock_movements.create({ data: { batch_id: inv.batch_id, warehouse_id: inv.warehouse_id, movement_type: 'adjustment', quantity: diff, reference_type: 'stocktake', note: dto.note, created_by: BigInt(user.id) } });
      return { message: `Đã điều chỉnh ${diff > 0 ? '+' : ''}${diff}` };
    });
  }

  @Get('movements')
  async movements(@Query('type') type?: string, @Query('q') q?: string, @Query('page') pageStr?: string) {
    const page = Math.max(1, Number(pageStr) || 1);
    const where: Prisma.stock_movementsWhereInput = {
      ...(type ? { movement_type: type as movement_type } : {}),
      ...(q ? { product_batches: { OR: [{ batch_code: { contains: q, mode: 'insensitive' } }, { product_variants: { products: { name: { contains: q, mode: 'insensitive' } } } }] } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.stock_movements.findMany({
        where, orderBy: { created_at: 'desc' }, take: 30, skip: (page - 1) * 30,
        include: { product_batches: { include: { product_variants: { include: { products: { select: { name: true } } } } } }, warehouses: true, users: { select: { full_name: true } } },
      }),
      this.prisma.stock_movements.count({ where }),
    ]);
    return {
      data: rows.map((m) => ({
        id: Number(m.id), type: m.movement_type, typeLabel: MOVEMENT_LABEL[m.movement_type], quantity: m.quantity, note: m.note,
        product: m.product_batches.product_variants.products.name, variant: m.product_batches.product_variants.name, batchCode: m.product_batches.batch_code,
        warehouse: m.warehouses.name, by: m.users?.full_name ?? 'Hệ thống', reference: m.reference_type, createdAt: m.created_at,
      })),
      meta: pageMeta(page, 30, total),
      types: Object.entries(MOVEMENT_LABEL).map(([code, label]) => ({ code, label })),
    };
  }
}
