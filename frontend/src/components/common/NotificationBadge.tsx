import React from 'react';

interface NotificationBadgeProps {
  count: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <span className="icon-unread-indicator">
      {count > 99 ? '99+' : count}
    </span>
  );
};
