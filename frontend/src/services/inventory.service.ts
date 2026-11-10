import { apiClient } from '@/lib/api/axios';

export interface FefoBatchItem {
  id: number;
  batchCode: string;
  qrCode: string;
  productName: string;
  productSlug?: string;
  variantName: string;
  variantSku?: string;
  farmName?: string | null;
  farmProvince?: string | null;
  supplierName?: string | null;
  manufacturedDate: string;
  expiryDate: string;
  receivedDate: string;
  daysLeft: number;
  fefoStatus: 'critical' | 'warning' | 'good';
  quantityOnHand: number;
  quantityReserved: number;
  unitCost: number;
  warehouse: string;
  isCold: boolean;
  nutriScore: string;
}

export interface CreateBatchPayload {
  variantId: number;
  warehouseId: number;
  batchCode: string;
  qrCode?: string;
  farmId?: number;
  supplierId?: number;
  manufacturedOn: string;
  expiresOn: string;
  harvestedOn?: string;
  receivedOn?: string;
  quantityReceived: number;
  unitCost: number;
  labResultNote?: string;
}

export interface WarehouseItem {
  id: number;
  code: string;
  name: string;
  address?: string;
  isColdStorage: boolean;
}

export const inventoryService = {
  async getFefoBatches(params?: {
    warehouseId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: FefoBatchItem[];
    meta: { total: number; page: number; limit: number; totalPages: number; criticalCount: number; warningCount: number };
  }> {
    const response = await apiClient.get('/inventory/fefo', { params });
    return response.data;
  },

  async createBatch(data: CreateBatchPayload) {
    const response = await apiClient.post('/inventory/batches', data);
    return response.data;
  },

  async quarantineBatch(id: number, reason?: string) {
    const response = await apiClient.put(`/inventory/batches/${id}/quarantine`, { reason });
    return response.data;
  },

  async getWarehouses(): Promise<WarehouseItem[]> {
    const response = await apiClient.get('/inventory/warehouses');
    return response.data;
  },

  async getStockMovements(limit = 30) {
    const response = await apiClient.get('/inventory/stock-movements', { params: { limit } });
    return response.data;
  },
};

