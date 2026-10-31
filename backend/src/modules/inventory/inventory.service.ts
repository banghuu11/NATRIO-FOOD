import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FefoQueryDto } from './dto/fefo-query.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import * as crypto from 'crypto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách lô hàng theo nguyên tắc FEFO (First-Expired, First-Out)
   * Sắp xếp hạn sử dụng sớm nhất lên trước để ưu tiên xuất kho / flash sale
   */
  async getFefoBatches(query: FefoQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.warehouseId) {
      where.inventory = {
        some: {
          warehouse_id: BigInt(query.warehouseId),
        },
      };
    }

    if (query.search) {
      where.OR = [
        { batch_code: { contains: query.search, mode: 'insensitive' } },
        { qr_code: { contains: query.search, mode: 'insensitive' } },
        {
          product_variants: {
            products: {
              name: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Lấy toàn bộ lô hàng kèm thông tin chi tiết
    const [rawBatches, total] = await Promise.all([
      this.prisma.product_batches.findMany({
        where,
        include: {
          farms: true,
          suppliers: true,
          product_variants: {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  nutri_score_grade: true,
                },
              },
            },
          },
          inventory: {
            include: {
              warehouses: true,
            },
          },
        },
        orderBy: {
          expires_on: 'asc', // FEFO: Ngày hết hạn gần nhất lên trước
        },
      }),
      this.prisma.product_batches.count({ where }),
    ]);

    const now = Date.now();

    // Map dữ liệu và tính toán chỉ số FEFO
    const formattedBatches = rawBatches.map((b) => {
      const expiresTime = new Date(b.expires_on).getTime();
      const diffMs = expiresTime - now;
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let fefoStatus: 'critical' | 'warning' | 'good' = 'good';
      if (daysLeft <= 15) {
        fefoStatus = 'critical';
      } else if (daysLeft <= 30) {
        fefoStatus = 'warning';
      }

      // Tổng tồn kho của lô này trên tất cả các kho
      const totalQuantityOnHand = b.inventory.reduce((sum, inv) => sum + inv.quantity_on_hand, 0);
      const totalQuantityReserved = b.inventory.reduce((sum, inv) => sum + inv.quantity_reserved, 0);

      const primaryInv = b.inventory[0];
      const warehouseName = primaryInv?.warehouses?.name || 'Kho chính';
      const isCold = primaryInv?.warehouses?.is_cold_storage || false;

      return {
        id: Number(b.id),
        batchCode: b.batch_code,
        qrCode: b.qr_code,
        productName: b.product_variants.products.name,
        productSlug: b.product_variants.products.slug,
        variantName: b.product_variants.name,
        variantSku: b.product_variants.sku,
        farmName: b.farms?.name || 'Nông trại liên kết',
        farmProvince: b.farms?.province || null,
        supplierName: b.suppliers?.name || null,
        manufacturedDate: b.manufactured_on,
        expiryDate: b.expires_on,
        receivedDate: b.received_on,
        daysLeft,
        fefoStatus,
        quantityOnHand: totalQuantityOnHand,
        quantityReserved: totalQuantityReserved,
        unitCost: Number(b.unit_cost),
        warehouse: warehouseName,
        isCold,
        nutriScore: b.product_variants.products.nutri_score_grade,
      };
    });

    // Lọc theo trạng thái FEFO nếu có
    let filtered = formattedBatches;
    if (query.status && query.status !== 'all') {
      filtered = formattedBatches.filter((b) => b.fefoStatus === query.status);
    }

    // Áp dụng phân trang sau khi lọc trạng thái
    const paginated = filtered.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        criticalCount: formattedBatches.filter((b) => b.fefoStatus === 'critical').length,
        warningCount: formattedBatches.filter((b) => b.fefoStatus === 'warning').length,
      },
    };
  }

  /**
   * Nhập một lô hàng mới vào kho, tự động sinh mã QR truy xuất và khởi tạo tồn kho
   */
  async createBatch(dto: CreateBatchDto) {
    const variant = await this.prisma.product_variants.findUnique({
      where: { id: BigInt(dto.variantId) },
    });
    if (!variant) {
      throw new NotFoundException(`Không tìm thấy biến thể sản phẩm có ID: ${dto.variantId}`);
    }

    const warehouse = await this.prisma.warehouses.findUnique({
      where: { id: BigInt(dto.warehouseId) },
    });
    if (!warehouse) {
      throw new NotFoundException(`Không tìm thấy kho có ID: ${dto.warehouseId}`);
    }

    // Tự sinh mã QR truy xuất độc bản nếu chưa có
    const qrCode = dto.qrCode || `NUTRIO-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    // Tạo batch trong transaction
    const newBatch = await this.prisma.$transaction(async (tx) => {
      const batch = await tx.product_batches.create({
        data: {
          variant_id: BigInt(dto.variantId),
          farm_id: dto.farmId ? BigInt(dto.farmId) : null,
          supplier_id: dto.supplierId ? BigInt(dto.supplierId) : null,
          batch_code: dto.batchCode,
          qr_code: qrCode,
          harvested_on: dto.harvestedOn ? new Date(dto.harvestedOn) : null,
          manufactured_on: new Date(dto.manufacturedOn),
          expires_on: new Date(dto.expiresOn),
          received_on: dto.receivedOn ? new Date(dto.receivedOn) : new Date(),
          quantity_received: dto.quantityReceived,
          unit_cost: dto.unitCost,
          lab_result_note: dto.labResultNote || null,
        },
      });

      // Tạo tồn kho ban đầu
      await tx.inventory.create({
        data: {
          warehouse_id: BigInt(dto.warehouseId),
          batch_id: batch.id,
          quantity_on_hand: dto.quantityReceived,
          quantity_reserved: 0,
        },
      });

      // Ghi log chuyển động tồn kho (Nhập hàng mới)
      await tx.stock_movements.create({
        data: {
          batch_id: batch.id,
          warehouse_id: BigInt(dto.warehouseId),
          movement_type: 'purchase_in',
          quantity: dto.quantityReceived,
          note: `Nhập kho lô hàng mới ${dto.batchCode}`,
        },
      });

      return batch;
    });

    return {
      message: 'Nhập lô hàng thành công theo tiêu chuẩn FEFO',
      batch: {
        id: Number(newBatch.id),
        batchCode: newBatch.batch_code,
        qrCode: newBatch.qr_code,
        quantityReceived: newBatch.quantity_received,
        expiresOn: newBatch.expires_on,
      },
    };
  }

  /**
   * Danh sách toàn bộ kho hàng (Kho thường, Kho lạnh)
   */
  async getWarehouses() {
    const list = await this.prisma.warehouses.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });
    return list.map((w) => ({
      id: Number(w.id),
      code: w.code,
      name: w.name,
      address: w.address,
      province: w.province,
      isColdStorage: w.is_cold_storage,
    }));
  }

  /**
   * Lịch sử luân chuyển tồn kho (Stock Movements)
   */
  async getStockMovements(limit = 30) {
    const movements = await this.prisma.stock_movements.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        product_batches: {
          include: {
            product_variants: {
              include: {
                products: { select: { name: true } },
              },
            },
          },
        },
        warehouses: true,
      },
    });

    return movements.map((m) => ({
      id: Number(m.id),
      movementType: m.movement_type,
      quantity: m.quantity,
      note: m.note,
      createdAt: m.created_at,
      batchCode: m.product_batches.batch_code,
      productName: m.product_batches.product_variants.products.name,
      warehouseName: m.warehouses.name,
    }));
  }

  /**
   * Cách ly hoặc đánh dấu hủy một lô hàng quá hạn / kiểm định không đạt
   */
  async quarantineBatch(batchId: number, note?: string) {
    const batch = await this.prisma.product_batches.findUnique({
      where: { id: BigInt(batchId) },
      include: { inventory: true },
    });

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy lô hàng ID: ${batchId}`);
    }

    // Trừ tồn kho có thể bán và ghi log cách ly
    await this.prisma.$transaction(async (tx) => {
      for (const inv of batch.inventory) {
        if (inv.quantity_on_hand > 0) {
          await tx.stock_movements.create({
            data: {
              batch_id: batch.id,
              warehouse_id: inv.warehouse_id,
              movement_type: 'damaged',
              quantity: -inv.quantity_on_hand,
              note: `Cách ly lô hàng: ${note || 'Hết hạn sử dụng hoặc kiểm nghiệm không đạt'}`,
            },
          });

          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity_on_hand: 0 },
          });
        }
      }
    });

    return {
      message: `Đã cách ly và khóa tồn kho lô hàng ${batch.batch_code}`,
    };
  }
}
