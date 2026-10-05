import { apiClient } from '@/lib/api/axios';

export const quizService = {
  async getQuestions() {
    const response = await apiClient.get('/quiz/questions');
    return response.data;
  },

  async submitQuiz(optionIds: number[], sessionToken?: string) {
    const response = await apiClient.post('/quiz/submit', { optionIds, sessionToken });
    return response.data;
  },
};

export const promotionService = {
  async getCoupons() {
    const response = await apiClient.get('/promotions/coupons');
    return response.data;
  },

  async getFlashSales() {
    const response = await apiClient.get('/promotions/flash-sales');
    return response.data;
  },

  async getBundles() {
    const response = await apiClient.get('/promotions/bundles');
    return response.data;
  },
};
