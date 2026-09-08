import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { getNotificationDestination, type NotificationNavTarget } from '../utils/notificationRouter';

export function useNotificationNavigate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markAsRead } = useNotifications();

  const handleNotificationClick = useCallback(
    async (notif: NotificationNavTarget, onAfterNavigate?: () => void) => {
      // 1. Mark as read in PostgreSQL + frontend state
      if (notif.id) {
        const idNum = typeof notif.id === 'string' ? parseInt(notif.id, 10) : notif.id;
        if (!isNaN(idNum)) {
          try {
            await markAsRead(idNum);
          } catch {
            // Keep navigating even if markAsRead network call fails
          }
        }
      }

      // 2. Resolve role-compliant destination route
      const destination = getNotificationDestination(notif, user?.role);

      // 3. Optional cleanup (e.g. close dropdown, dismiss toast)
      if (onAfterNavigate) {
        onAfterNavigate();
      }

      // 4. Navigate
      navigate(destination);
    },
    [markAsRead, navigate, user?.role]
  );

  return { handleNotificationClick, getDestination: (notif: NotificationNavTarget) => getNotificationDestination(notif, user?.role) };
}
