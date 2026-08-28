import React, { createContext, useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket, type WebSocketStatus } from '../hooks/useWebSocket';
import type {
  NotificationItem,
  NotificationPreference,
  NotificationPreferenceUpdate,
  WebSocketNotificationEvent,
} from '../types/notification';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  wsStatus: WebSocketStatus;
  toasts: ToastItem[];
  removeToast: (id: string) => void;
  fetchNotifications: (page?: number, pageSize?: number, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  preferences: NotificationPreference | null;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: NotificationPreferenceUpdate) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message: string, type: string) => {
    const newToast: ToastItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      created_at: new Date().toISOString(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      // Ignore count fetch errors
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(
    async (page = 1, pageSize = 20, unreadOnly = false) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const data = await notificationsApi.list({
          page,
          page_size: pageSize,
          unread_only: unreadOnly,
        });
        setNotifications(data.items);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.getPreferences();
      setPreferences(data);
    } catch {
      // Handle error
    }
  }, [isAuthenticated]);

  const updatePreferences = async (data: NotificationPreferenceUpdate) => {
    const updated = await notificationsApi.updatePreferences(data);
    setPreferences(updated);
  };

  const markAsRead = async (id: number) => {
    const updated = await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: updated.read_at } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    await notificationsApi.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback(
    (event: WebSocketNotificationEvent) => {
      if (event.type === 'notification' && event.data) {
        const d = event.data;
        const newItem: NotificationItem = {
          id: d.id,
          notification_type: d.notification_type,
          title: d.title,
          message: d.message,
          entity_type: d.entity_type,
          entity_id: d.entity_id,
          entity_key: d.entity_key,
          is_read: false,
          read_at: null,
          created_at: d.created_at || new Date().toISOString(),
        };

        setNotifications((prev) => [newItem, ...prev.filter((item) => item.id !== newItem.id)]);
        setUnreadCount((prev) => prev + 1);
        addToast(d.title, d.message, d.notification_type);
      }
    },
    [addToast]
  );

  const { status: wsStatus } = useWebSocket({
    token,
    onMessage: handleWsMessage,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    wsStatus,
    toasts,
    removeToast,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    fetchPreferences,
    updatePreferences,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
