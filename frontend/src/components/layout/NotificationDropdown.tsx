import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ExternalLink, Trash2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationNavigate } from '../../hooks/useNotificationNavigate';
import { NotificationBadge } from '../common/NotificationBadge';
import { formatRelativeTime } from '../../utils/formatters';
import type { NotificationType } from '../../types/notification';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, deleteNotification } = useNotifications();
  const { handleNotificationClick } = useNotificationNavigate();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getNotificationColor = (type: NotificationType | string) => {
    switch (type) {
      case 'SPRINT_STARTED':
      case 'SPRINT_ENDED':
      case 'SPRINT_OVERDUE':
        return '#8b5cf6'; // purple
      case 'ISSUE_RESOLVED':
        return '#10b981'; // green
      case 'ISSUE_REOPENED':
        return '#f59e0b'; // amber
      case 'ISSUE_COMMENTED':
      case 'ISSUE_MENTIONED':
        return '#06b6d4'; // cyan
      case 'ATTACHMENT_ADDED':
        return '#ec4899'; // pink
      case 'ISSUE_ASSIGNED':
      case 'ISSUE_REPORTED':
        return '#3b82f6'; // blue
      default:
        return '#6366f1'; // indigo
    }
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`header-icon-btn ${isOpen ? 'active' : ''}`}
        title="Notifications"
        aria-label="View notifications"
        aria-expanded={isOpen}
        style={{
          position: 'relative',
          background: isOpen ? 'var(--bg-surface-elevated)' : undefined,
          borderColor: isOpen ? 'var(--border-subtle)' : undefined,
        }}
      >
        <Bell size={18} />
        <NotificationBadge count={unreadCount} />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          className="notification-dropdown-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.4), 0 10px 15px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                }}
                title="Mark all as read"
              >
                <Check size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                <Bell size={24} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 7).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif, () => setIsOpen(false))}
                  role="button"
                  tabIndex={0}
                  title="Click to open related page"
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: notif.is_read
                      ? 'transparent'
                      : 'rgba(99, 102, 241, 0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'background-color 0.15s ease',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notif, () => setIsOpen(false));
                    }
                  }}
                >
                  {/* Indicator Dot */}
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: notif.is_read
                        ? 'transparent'
                        : getNotificationColor(notif.notification_type),
                      marginTop: '0.35rem',
                      flexShrink: 0,
                    }}
                  />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: notif.is_read ? 500 : 700,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notif.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '0.2rem 0 0 0',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notif.message}
                    </p>
                  </div>

                  {/* Quick Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="btn-icon-only"
                    style={{
                      color: 'var(--text-muted)',
                      padding: '2px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>View all notifications</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
