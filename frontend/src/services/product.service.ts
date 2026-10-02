import { apiClient } from '@/lib/api/axios';
import { ApiResponse, Product, ProductFilterParams, Category } from '@/types';
import { mockProducts, categories } from '@/lib/mockData';

export const productService = {
  /**
   * Lấy danh sách sản phẩm với bộ lọc & phân trang
   */
  async getProducts(params?: ProductFilterParams): Promise<ApiResponse<Product[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
      return response.data;
    } catch {
      // Fallback sang mock data nếu API chưa khởi chạy
      let filtered = [...mockProducts];
      if (params?.categoryId && params.categoryId !== 'all') {
        filtered = filtered.filter((p) => p.categoryId === params.categoryId);
      }
      if (params?.search) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(params.search!.toLowerCase())
        );
      }
      return {
        statusCode: 200,
        message: 'Success',
        data: filtered,
        meta: {
          total: filtered.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
    }
  },

  /**
   * Lấy chi tiết sản phẩm theo slug
   */
  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.get<ApiResponse<Product>>(`/products/${slug}`);
      return response.data;
    } catch {
      const found = mockProducts.find((p) => p.slug === slug) || mockProducts[0];
      return {
        statusCode: 200,
        message: 'Success',
        data: found,
      };
    }
  },

  /**
   * Lấy danh mục thực phẩm
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
      return response.data;
    } catch {
      return {
        statusCode: 200,
        message: 'Success',
        data: categories,
      };
    }
  },
};
