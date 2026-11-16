import { apiClient } from '@/lib/api/axios';

export interface UploadResponse {
  message: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
  relativeUrl: string;
}

export interface MultiUploadResponse {
  message: string;
  urls: string[];
  files: Array<{
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
    relativeUrl: string;
  }>;
}

export const uploadService = {
  /**
   * Tải lên 1 ảnh duy nhất (Avatar, Banner, Thumbnail)
   */
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Tải lên nhiều ảnh cùng lúc (cho sản phẩm, thư viện ảnh)
   */
  async uploadMultiple(files: File[]): Promise<MultiUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post<MultiUploadResponse>('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
