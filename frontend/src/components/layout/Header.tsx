import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, Radio } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBadge } from '../common/NotificationBadge';

interface HeaderProps {
  onToggleMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobile }) => {
  const { user } = useAuth();
  const { unreadCount, wsStatus } = useNotifications();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/issues/')) return 'Issue Details';
    if (pathname.startsWith('/issues')) return 'Issues & Defects';
    if (pathname.startsWith('/notifications')) return 'Notifications';
    if (pathname.startsWith('/analytics')) return 'Analytics & Reporting';
    if (pathname.startsWith('/admin')) return 'Admin Center';
    if (pathname.startsWith('/profile')) return 'My Profile';
    return 'BugTracker';
  };

  const getWsStatusText = () => {
    switch (wsStatus) {
      case 'connected':
        return 'Live Stream';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
      case 'error':
        return 'Offline';
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          onClick={onToggleMobile}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
        <span className="header-title-breadcrumb">
          {getPageTitle(location.pathname)}
        </span>
      </div>

      <div className="header-right">
        {/* WebSocket Connection Status Pill */}
        <div className="ws-status-pill" title={`WebSocket Status: ${wsStatus}`}>
          <span className={`status-dot ${wsStatus}`} />
          <Radio size={12} style={{ color: 'var(--text-muted)' }} />
          <span>{getWsStatusText()}</span>
        </div>

        {/* Notifications Icon Button */}
        <Link
          to="/notifications"
          className="header-icon-btn"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell size={18} />
          <NotificationBadge count={unreadCount} />
        </Link>

        {/* User Pill */}
        {user && (
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user.full_name[0]?.toUpperCase() || 'U'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
              {user.full_name.split(' ')[0]}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};
