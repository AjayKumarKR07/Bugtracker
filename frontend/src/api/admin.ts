import { apiClient } from './client';
import type { AdminDashboardResponse } from '../types/admin';

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardResponse> => {
    const response = await apiClient.get<AdminDashboardResponse>('/admin/dashboard');
    return response.data;
  },
};
