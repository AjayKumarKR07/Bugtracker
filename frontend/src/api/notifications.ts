import { apiClient } from './client';
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationPreference,
  NotificationPreferenceUpdate,
  NotificationType,
  NotificationUnreadCountResponse,
} from '../types/notification';

export interface NotificationListParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
  notification_type?: NotificationType;
}

export const notificationsApi = {
  list: async (params?: NotificationListParams): Promise<NotificationListResponse> => {
    const response = await apiClient.get<NotificationListResponse>('/notifications', {
      params,
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<NotificationUnreadCountResponse> => {
    const response = await apiClient.get<NotificationUnreadCountResponse>(
      '/notifications/unread-count'
    );
    return response.data;
  },

  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await apiClient.get<NotificationPreference>(
      '/notifications/preferences'
    );
    return response.data;
  },

  updatePreferences: async (
    data: NotificationPreferenceUpdate
  ): Promise<NotificationPreference> => {
    const response = await apiClient.patch<NotificationPreference>(
      '/notifications/preferences',
      data
    );
    return response.data;
  },

  markAllRead: async (): Promise<NotificationUnreadCountResponse> => {
    const response = await apiClient.patch<NotificationUnreadCountResponse>(
      '/notifications/read-all'
    );
    return response.data;
  },

  getById: async (id: number): Promise<NotificationItem> => {
    const response = await apiClient.get<NotificationItem>(`/notifications/${id}`);
    return response.data;
  },

  markRead: async (id: number): Promise<NotificationItem> => {
    const response = await apiClient.patch<NotificationItem>(
      `/notifications/${id}/read`
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
