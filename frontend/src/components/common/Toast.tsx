import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItemCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastItemCardProps {
  toast: {
    id: string;
    title: string;
    message: string;
  };
  onDismiss: () => void;
}

const ToastItemCard: React.FC<ToastItemCardProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="toast-card">
      <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
        <Bell size={18} />
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-message">{toast.message}</div>
      </div>
      <button onClick={onDismiss} className="btn-icon-only" style={{ color: 'var(--text-muted)' }}>
        <X size={16} />
      </button>
    </div>
  );
};
