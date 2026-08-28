import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCheck,
  Filter,
  Mail,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import { getApiErrorMessage } from '../api/client';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationPreferenceUpdate, NotificationType } from '../types/notification';
import { formatDate, formatRelativeTime } from '../utils/formatters';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    fetchPreferences,
    updatePreferences,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [prefForm, setPrefForm] = useState<NotificationPreferenceUpdate>({});
  const [prefSaved, setPrefSaved] = useState<boolean>(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [isSavingPref, setIsSavingPref] = useState<boolean>(false);

  useEffect(() => {
    fetchNotifications(1, 30, unreadOnly);
    fetchPreferences();
  }, [unreadOnly]);

  useEffect(() => {
    if (preferences) {
      setPrefForm({
        email_enabled: preferences.email_enabled,
        issue_assigned: preferences.issue_assigned,
        issue_status_changed: preferences.issue_status_changed,
        issue_resolved: preferences.issue_resolved,
        issue_reopened: preferences.issue_reopened,
        issue_commented: preferences.issue_commented,
        attachment_added: preferences.attachment_added,
      });
    }
  }, [preferences]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPref(true);
    setPrefError(null);
    setPrefSaved(false);
    try {
      await updatePreferences(prefForm);
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 3000);
    } catch (err: unknown) {
      setPrefError(getApiErrorMessage(err));
    } finally {
      setIsSavingPref(false);
    }
  };

  const getNotificationIconColor = (type: NotificationType) => {
    switch (type) {
      case 'ISSUE_ASSIGNED':
      case 'USER_ROLE_CHANGED':
        return '#818cf8';
      case 'ISSUE_RESOLVED':
      case 'USER_ACTIVATED':
        return '#34d399';
      case 'ISSUE_REOPENED':
      case 'USER_DEACTIVATED':
      case 'SYSTEM_ALERT':
        return '#f87171';
      case 'ISSUE_STATUS_CHANGED':
        return '#fbbf24';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            Stay updated with assignments, defect status updates, and comments
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {activeTab === 'inbox' && unreadCount > 0 && (
            <button onClick={() => markAllAsRead()} className="btn btn-secondary btn-sm">
              <CheckCheck size={16} />
              Mark All as Read
            </button>
          )}

          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '0.2rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className="btn btn-sm"
              style={{
                backgroundColor: activeTab === 'inbox' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'inbox' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Inbox {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className="btn btn-sm"
              style={{
                backgroundColor: activeTab === 'preferences' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'preferences' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Settings size={14} />
              Preferences
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'inbox' ? (
        <>
          {/* Filter Bar */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <label style={{ fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                />
                <span>Show Unread Only</span>
              </label>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {notifications.length} notification{notifications.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <LoadingSpinner message="Loading notifications..." />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description={
                unreadOnly
                  ? 'You have no unread notifications.'
                  : 'You have not received any notifications yet.'
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="card"
                  style={{
                    backgroundColor: notif.is_read
                      ? 'var(--bg-surface)'
                      : 'rgba(99, 102, 241, 0.06)',
                    borderColor: notif.is_read
                      ? 'var(--border-subtle)'
                      : 'rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      padding: '1.15rem 1.25rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: getNotificationIconColor(notif.notification_type),
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: notif.is_read ? '500' : '700',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {notif.title}
                          </span>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.65rem',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {notif.notification_type.replace(/_/g, ' ')}
                          </span>
                          {!notif.is_read && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: '#818cf8',
                                fontWeight: '600',
                              }}
                            >
                              ● New
                            </span>
                          )}
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {notif.message}
                        </p>

                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                          {formatRelativeTime(notif.created_at)} ({formatDate(notif.created_at)})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="btn btn-secondary btn-sm"
                          title="Mark as read"
                        >
                          <Check size={14} />
                          Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="btn-icon-only"
                        style={{ color: 'var(--text-muted)' }}
                        title="Delete notification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Preferences Tab */
        <div className="card" style={{ maxWidth: '640px' }}>
          <div className="card-header">
            <h3 className="card-title">Notification Preferences</h3>
          </div>
          <div className="card-body">
            {prefSaved && (
              <div className="alert-box alert-success">
                <span>Preferences saved successfully!</span>
              </div>
            )}
            {prefError && <ErrorMessage message={prefError} />}

            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} color="var(--primary)" />
                    <span>Email Delivery</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Receive notification emails at your registered address
                  </div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={prefForm.email_enabled ?? true}
                  onChange={(e) => setPrefForm({ ...prefForm, email_enabled: e.target.checked })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Event Subscriptions
                </h4>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.9rem' }}>When a defect is assigned to you</span>
                  <input
                    type="checkbox"
                    checked={prefForm.issue_assigned ?? true}
                    onChange={(e) => setPrefForm({ ...prefForm, issue_assigned: e.target.checked })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.9rem' }}>When defect status changes</span>
                  <input
                    type="checkbox"
                    checked={prefForm.issue_status_changed ?? true}
                    onChange={(e) => setPrefForm({ ...prefForm, issue_status_changed: e.target.checked })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.9rem' }}>When a defect is marked as resolved</span>
                  <input
                    type="checkbox"
                    checked={prefForm.issue_resolved ?? true}
                    onChange={(e) => setPrefForm({ ...prefForm, issue_resolved: e.target.checked })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.9rem' }}>When a defect is reopened</span>
                  <input
                    type="checkbox"
                    checked={prefForm.issue_reopened ?? true}
                    onChange={(e) => setPrefForm({ ...prefForm, issue_reopened: e.target.checked })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.9rem' }}>When someone comments on your defect</span>
                  <input
                    type="checkbox"
                    checked={prefForm.issue_commented ?? true}
                    onChange={(e) => setPrefForm({ ...prefForm, issue_commented: e.target.checked })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.9rem' }}>When an attachment is uploaded</span>
                  <input
                    type="checkbox"
                    checked={prefForm.attachment_added ?? true}
                    onChange={(e) => setPrefForm({ ...prefForm, attachment_added: e.target.checked })}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" disabled={isSavingPref} className="btn btn-primary">
                  <Save size={14} />
                  {isSavingPref ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
