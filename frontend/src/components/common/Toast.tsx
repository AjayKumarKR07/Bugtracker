import React, { useEffect } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationNavigate } from '../../hooks/useNotificationNavigate';
import type { ToastItem } from '../../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  return (
    <div className="toast-container" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {toasts.map((toast) => (
        <ToastItemCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastItemCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastItemCard: React.FC<ToastItemCardProps> = ({ toast, onDismiss }) => {
  const { handleNotificationClick } = useNotificationNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    handleNotificationClick(
      {
        id: toast.notification_id,
        notification_type: toast.type,
        title: toast.title,
        message: toast.message,
        entity_type: toast.entity_type,
        entity_id: toast.entity_id,
        entity_key: toast.entity_key,
        destination: toast.destination,
        context: toast.context,
      },
      onDismiss
    );
  };

  return (
    <div
      className="toast-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title="Click to view details"
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        maxWidth: '380px',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }}>
        <Bell size={18} />
      </div>
      <div className="toast-content" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div className="toast-title" style={{ fontWeight: 700, fontSize: '0.875rem' }}>{toast.title}</div>
          <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
        <div className="toast-message" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-word' }}>{toast.message}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="btn-icon-only"
        style={{ color: 'var(--text-muted)', padding: '2px', background: 'transparent', border: 'none', cursor: 'pointer' }}
        title="Dismiss"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};
