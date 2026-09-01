import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bug,
  CheckCircle2,
  FolderGit2,
  HeartPulse,
  Layers,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { analyticsApi } from '../api/analytics';
import { auditApi } from '../api/audit';
import { issuesApi } from '../api/issues';
import { usersApi } from '../api/users';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { AdvancedAnalytics } from '../components/admin/AdvancedAnalytics';
import { useNotifications } from '../hooks/useNotifications';
import type { AdminDashboardResponse, InactiveAssigneeItem } from '../types/admin';
import type { DeveloperAnalyticsItem } from '../types/analytics';
import type { AuditLogItem } from '../types/audit';
import type { Issue } from '../types/issue';
import type { UserDetail } from '../types/user';
import { formatRelativeTime } from '../utils/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Bar Row Helper
// ─────────────────────────────────────────────────────────────────────────────

interface BarRowProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const BarRow: React.FC<BarRowProps> = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
          {count}
          <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '0.3rem' }}>
            ({pct}%)
          </span>
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '4px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '4px', transition: 'width 0.6s' }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconClass: string;
  valueColor?: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, iconClass, valueColor, subtitle }) => (
  <div className="metric-card">
    <div className="metric-info">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      {subtitle && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
          {subtitle}
        </span>
      )}
    </div>
    <div className={`metric-icon-box ${iconClass}`}>{icon}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const AdminDashboardPage: React.FC = () => {
  const { notifications: liveNotifications } = useNotifications();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [stats, setStats] = useState<AdminDashboardResponse | null>(null);
  const [workloads, setWorkloads] = useState<DeveloperAnalyticsItem[]>([]);
  const [inactiveAssignees, setInactiveAssignees] = useState<InactiveAssigneeItem[]>([]);
  const [unassignedQueue, setUnassignedQueue] = useState<Issue[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  
  // Assignment state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [testers, setTesters] = useState<UserDetail[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [
        dashboardStats,
        workloadList,
        inactiveList,
        unassignedList,
        logsList,
      ] = await Promise.all([
        adminApi.getDashboard(),
        analyticsApi.getDeveloperPerformance(),
        adminApi.getInactiveAssignees(),
        issuesApi.list({ unassigned: true, page_size: 10 }),
        auditApi.list({ page_size: 10 }),
      ]);

      setStats(dashboardStats);
      setWorkloads(workloadList.items);
      setInactiveAssignees(inactiveList.items);
      setUnassignedQueue(unassignedList.items);
      setAuditLogs(logsList.items);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket refresh
  const lastNotificationIdRef = useRef<number | null>(null);
  const latestNotificationId = liveNotifications[0]?.id;
  useEffect(() => {
    if (latestNotificationId) {
      if (lastNotificationIdRef.current !== null && lastNotificationIdRef.current !== latestNotificationId) {
        fetchData(true);
      }
      lastNotificationIdRef.current = latestNotificationId;
    }
  }, [latestNotificationId, fetchData]);

  // Handle Assign modal
  const openAssignModal = async (issueId: number) => {
    setSelectedIssueId(issueId);
    setAssignModalOpen(true);
    try {
      const res = await usersApi.list({ role: 'TESTER', is_active: true, page_size: 100 });
      setTesters(res.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (testerId: number) => {
    if (!selectedIssueId) return;
    setAssigning(true);
    try {
      await issuesApi.assign(selectedIssueId, { developer_id: testerId });
      setToastMessage({ type: 'success', text: 'Issue assigned successfully' });
      setAssignModalOpen(false);
      fetchData(true);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to assign tester' });
    } finally {
      setAssigning(false);
    }
  };

  // Health Score Calculation
  const healthScore = useMemo(() => {
    if (!stats) return 100;
    let score = 100;
    
    // Penalties
    score -= stats.severity.blocker * 10;
    score -= stats.severity.critical * 5;
    
    // Aging open issues > 14 days (approx using unresolved / some factor, or actual data if we had it, but we can just use reopened rate here based on the requirement)
    const totalIssues = stats.issues.total;
    const resolvedClosed = stats.issues.resolved + stats.issues.closed;
    const resRate = totalIssues > 0 ? (resolvedClosed / totalIssues) * 100 : 0;
    const reopenRate = totalIssues > 0 ? (stats.issues.reopened / totalIssues) * 100 : 0;

    if (reopenRate > 10) score -= 5;
    if (resRate >= 75) score += 5;

    return Math.max(0, Math.min(100, score));
  }, [stats]);

  if (isLoading && !stats) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <LoadingSpinner message="Loading Admin Dashboard..." />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="page-container">
        <ErrorMessage message={error} onRetry={() => fetchData()} />
      </div>
    );
  }

  if (!stats) return null;

  const resolutionRate = stats.issues.total > 0 
    ? Math.round(((stats.issues.resolved + stats.issues.closed) / stats.issues.total) * 100) 
    : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Real-time system overview, user management, and platform health.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isRefreshing && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Refreshing...</span>}
          <button className="btn btn-secondary" onClick={() => fetchData(true)} disabled={isRefreshing}>
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Health Score Banner */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', 
        border: '1px solid var(--border-subtle)', marginBottom: '1.5rem',
        borderLeft: `4px solid ${healthScore > 80 ? '#22c55e' : healthScore > 50 ? '#f59e0b' : '#ef4444'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: healthScore > 80 ? 'rgba(34,197,94,0.1)' : healthScore > 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', 
            padding: '1rem', borderRadius: '50%', color: healthScore > 80 ? '#22c55e' : healthScore > 50 ? '#f59e0b' : '#ef4444' 
          }}>
            <HeartPulse size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              Platform Health Score
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Based on resolution rate, open blockers, critical defects, and reopen rates.
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: healthScore > 80 ? '#22c55e' : healthScore > 50 ? '#f59e0b' : '#ef4444' }}>
            {healthScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <MetricCard
          label="Total Users"
          value={stats.users.total}
          icon={<Users size={20} />}
          iconClass="icon-blue"
          subtitle={`${stats.users.active} Active`}
        />
        <MetricCard
          label="Total Projects"
          value={stats.projects.total}
          icon={<FolderGit2 size={20} />}
          iconClass="icon-purple"
          subtitle={`${stats.projects.active} Active`}
        />
        <MetricCard
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          icon={<CheckCircle2 size={20} />}
          iconClass={resolutionRate >= 75 ? 'icon-green' : 'icon-orange'}
          valueColor={resolutionRate >= 75 ? 'var(--color-success)' : 'var(--color-warning)'}
          subtitle={`${stats.issues.resolved + stats.issues.closed} / ${stats.issues.total} Issues`}
        />
        <MetricCard
          label="Unassigned"
          value={stats.issues.reported + stats.issues.triaged}
          icon={<AlertCircle size={20} />}
          iconClass="icon-orange"
        />
      </div>

      {/* Advanced Analytics Section */}
      <AdvancedAnalytics />

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginBottom: '2rem', marginTop: '2rem', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Unassigned Issue Queue */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                Unassigned Issue Queue
              </h2>
            </div>
            {unassignedQueue.length === 0 ? (
              <div className="card-body empty-state">
                <CheckCircle2 size={32} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
                <h3>Queue is Empty</h3>
                <p>There are no unassigned issues awaiting action.</p>
              </div>
            ) : (
              <div className="table-container" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Severity</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedQueue.map((issue) => (
                      <tr key={issue.id}>
                        <td style={{ fontWeight: '600' }}>{issue.issue_key}</td>
                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={issue.title}>
                          {issue.title}
                        </td>
                        <td><PriorityBadge priority={issue.priority} /></td>
                        <td><SeverityBadge severity={issue.severity} /></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(issue.created_at)}
                        </td>
                        <td>
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openAssignModal(issue.id)}>
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Team Workload */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} />
                Team Workload (Testers & Developers)
              </h2>
            </div>
            {workloads.length === 0 ? (
              <div className="card-body empty-state">
                <p>No workload data available.</p>
              </div>
            ) : (
              <div className="table-container" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Assigned</th>
                      <th>In Progress</th>
                      <th>In Testing</th>
                      <th>Resolved</th>
                      <th>Res. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workloads.map((w) => {
                      const totalActive = w.open_issues;
                      const isHighLoad = totalActive > 10;
                      return (
                        <tr key={w.developer_id} style={{ background: isHighLoad ? 'rgba(239,68,68,0.05)' : undefined }}>
                          <td style={{ fontWeight: '500' }}>
                            {w.developer_name}
                            {isHighLoad && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#ef4444', fontWeight: '600', padding: '0.1rem 0.3rem', border: '1px solid #ef4444', borderRadius: '4px' }}>HIGH LOAD</span>}
                          </td>
                          <td>{w.assigned_issues}</td>
                          <td>{w.open_issues}</td>
                          <td>-</td>
                          <td>{w.resolved_issues}</td>
                          <td>
                            <span style={{ fontWeight: '600', color: w.resolution_rate >= 75 ? 'var(--color-success)' : 'inherit' }}>
                              {Math.round(w.resolution_rate)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* System Activity */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} />
                System Activity
              </h2>
              <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                View All
              </Link>
            </div>
            {auditLogs.length === 0 ? (
              <div className="card-body empty-state">
                <p>No recent activity found.</p>
              </div>
            ) : (
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Activity size={18} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{log.actor?.full_name || 'System'}</strong> ({log.actor?.role || 'SYSTEM'}) {log.action} <strong style={{ color: 'var(--text-primary)' }}>{log.entity_type}</strong> {log.entity_key}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {log.description}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatRelativeTime(log.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* System Alerts */}
          <section className="card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} />
                System Alerts
              </h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.severity.blocker > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#ef4444' }}>{stats.severity.blocker} Open Blocker Issues</p>
                </div>
              )}
              {stats.issues.reopened > 0 && (
                <div style={{ background: 'rgba(245,158,11,0.1)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#f59e0b' }}>{stats.issues.reopened} Reopened Issues</p>
                </div>
              )}
              {inactiveAssignees.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#ef4444' }}>
                    {inactiveAssignees.length} Inactive Users with Assignments
                  </p>
                  <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {inactiveAssignees.slice(0, 3).map(u => (
                      <li key={u.user_id}>{u.full_name} ({u.assigned_issues_count} issues)</li>
                    ))}
                    {inactiveAssignees.length > 3 && <li>And {inactiveAssignees.length - 3} more...</li>}
                  </ul>
                </div>
              )}
              {stats.severity.blocker === 0 && stats.issues.reopened === 0 && inactiveAssignees.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No critical alerts.</p>
              )}
            </div>
          </section>

          {/* User Management */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} />
                User Breakdown
              </h2>
            </div>
            <div className="card-body">
              <BarRow label="Users" count={stats.users.users} total={stats.users.total} color="#3b82f6" />
            <BarRow label="Testers" count={stats.users.testers} total={stats.users.total} color="#22c55e" />
            <BarRow label="Developers" count={stats.users.developers} total={stats.users.total} color="#8b5cf6" />
            <BarRow label="Admins" count={stats.users.admins} total={stats.users.total} color="#f97316" />
            
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active</span>
                <span style={{ fontWeight: '600' }}>{stats.users.active}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Inactive</span>
                <span style={{ fontWeight: '600', color: stats.users.inactive > 0 ? '#ef4444' : 'inherit' }}>{stats.users.inactive}</span>
              </div>
            </div>
            </div>
          </section>

          {/* Issue Health */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bug size={18} />
                Issue Health
              </h2>
            </div>
            <div className="card-body">
              <BarRow label="Blocker" count={stats.severity.blocker} total={stats.issues.unresolved} color="#ef4444" />
            <BarRow label="Critical" count={stats.severity.critical} total={stats.issues.unresolved} color="#f97316" />
            <BarRow label="Major" count={stats.severity.major} total={stats.issues.unresolved} color="#f59e0b" />
            <BarRow label="Minor" count={stats.severity.minor} total={stats.issues.unresolved} color="#3b82f6" />
            </div>
          </section>

        </div>
      </div>

      {/* Assign Tester Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Tester">
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Select a tester to assign this issue to. Workloads are shown for available testers.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {testers.map(tester => {
              const wl = workloads.find(w => w.developer_id === tester.id);
              const activeLoad = wl ? wl.open_issues : 0;
              return (
                <div key={tester.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{tester.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Load: {activeLoad} issues</div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.4rem 1rem' }} 
                    disabled={assigning}
                    onClick={() => handleAssign(tester.id)}
                  >
                    Select
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          background: 'var(--bg-surface-elevated)',
          border: `1px solid ${toastMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 9999
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  );
};
