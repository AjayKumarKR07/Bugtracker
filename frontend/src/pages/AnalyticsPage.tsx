import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  Download,
  FolderGit2,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { getApiErrorMessage } from '../api/client';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import type {
  DeveloperAnalyticsItem,
  IssueStatusDistributionResponse,
  IssueTrendResponse,
  ProjectAnalyticsResponse,
  SeverityDistributionResponse,
  SystemAnalyticsResponse,
} from '../types/analytics';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [systemOverview, setSystemOverview] = useState<SystemAnalyticsResponse | null>(null);
  const [statusDist, setStatusDist] = useState<IssueStatusDistributionResponse | null>(null);
  const [severityDist, setSeverityDist] = useState<SeverityDistributionResponse | null>(null);
  const [trends, setTrends] = useState<IssueTrendResponse | null>(null);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalyticsResponse[]>([]);
  const [devAnalytics, setDevAnalytics] = useState<DeveloperAnalyticsItem[]>([]);
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const promises: Promise<any>[] = [
        analyticsApi.getStatusDistribution(),
        analyticsApi.getSeverityDistribution(),
        analyticsApi.getTrends({ interval }),
        analyticsApi.getAllProjectsAnalytics(),
      ];

      if (isAdmin) {
        promises.push(analyticsApi.getSystemOverview());
        promises.push(analyticsApi.getDeveloperPerformance());
      }

      const results = await Promise.all(promises);

      setStatusDist(results[0]);
      setSeverityDist(results[1]);
      setTrends(results[2]);
      setProjectAnalytics(results[3].items);

      if (isAdmin) {
        setSystemOverview(results[4]);
        setDevAnalytics(results[5].items);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [interval]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await analyticsApi.exportIssuesCsv();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Aggregating defect analytics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchAnalytics} />;
  }

  // Calculate totals for distributions
  const totalStatusCount = statusDist
    ? Object.values(statusDist).reduce((a, b) => a + b, 0)
    : 0;

  const totalSeverityCount = severityDist
    ? Object.values(severityDist).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Reporting</h1>
          <p className="page-subtitle">
            Real-time defect distributions, resolution rates, and system trends
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="btn btn-secondary btn-sm"
            title="Download full defects CSV report"
          >
            <Download size={14} />
            {isExporting ? 'Exporting...' : 'Export CSV Report'}
          </button>
          <button onClick={() => fetchAnalytics()} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Admin Global Summary Metric Cards */}
      {isAdmin && systemOverview && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Total Users</span>
              <span className="metric-value">{systemOverview.total_users}</span>
            </div>
            <div className="metric-icon-box metric-icon-purple">
              <Users size={20} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Active Projects</span>
              <span className="metric-value">{systemOverview.active_projects}</span>
            </div>
            <div className="metric-icon-box metric-icon-indigo">
              <FolderGit2 size={20} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Total Defects</span>
              <span className="metric-value">{systemOverview.total_issues}</span>
            </div>
            <div className="metric-icon-box metric-icon-amber">
              <Clock size={20} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Critical / Blocker</span>
              <span className="metric-value" style={{ color: '#f87171' }}>
                {systemOverview.critical_issues}
              </span>
            </div>
            <div className="metric-icon-box metric-icon-rose">
              <PieChart size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Distribution Grid: Status Distribution & Severity Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="#818cf8" />
              <h3 className="card-title">Defect Status Breakdown</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total: {totalStatusCount}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {statusDist &&
              Object.entries(statusDist).map(([key, count]) => {
                const pct = totalStatusCount > 0 ? ((count / totalStatusCount) * 100).toFixed(1) : '0';
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '500' }}>{key.replace(/_/g, ' ')}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor:
                            key === 'RESOLVED' || key === 'CLOSED'
                              ? 'var(--success)'
                              : key === 'REOPENED'
                              ? 'var(--danger)'
                              : key === 'IN_DEVELOPMENT' || key === 'IN_REVIEW'
                              ? 'var(--warning)'
                              : 'var(--primary)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="#f87171" />
              <h3 className="card-title">Severity Breakdown</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total: {totalSeverityCount}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {severityDist &&
              Object.entries(severityDist).map(([key, count]) => {
                const pct = totalSeverityCount > 0 ? ((count / totalSeverityCount) * 100).toFixed(1) : '0';
                const color =
                  key === 'BLOCKER'
                    ? '#dc2626'
                    : key === 'CRITICAL'
                    ? '#f87171'
                    : key === 'MAJOR'
                    ? '#fbbf24'
                    : '#94a3b8';

                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '600', color }}>{key}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: color,
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Time-Series Trends */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#34d399" />
            <h3 className="card-title">Defect Creation vs Resolution Trends</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInterval(mode)}
                className="btn btn-sm"
                style={{
                  textTransform: 'capitalize',
                  backgroundColor: interval === mode ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: interval === mode ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {!trends || trends.items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
              No time-series trend data available for this timeframe.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '500px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Period</span>
                  <span>Created vs Resolved</span>
                </div>
                {trends.items.map((item) => (
                  <div key={item.date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', minWidth: '100px', color: 'var(--text-secondary)' }}>
                      {item.date}
                    </span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, display: 'flex', height: '12px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-input)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(item.created_count * 10, 50)}%`,
                            backgroundColor: '#f87171',
                          }}
                          title={`Created: ${item.created_count}`}
                        />
                        <div
                          style={{
                            width: `${Math.min(item.resolved_count * 10, 50)}%`,
                            backgroundColor: '#34d399',
                          }}
                          title={`Resolved: ${item.resolved_count}`}
                        />
                      </div>
                      <span style={{ fontSize: '0.8rem', minWidth: '120px', textAlign: 'right' }}>
                        <span style={{ color: '#f87171' }}>+{item.created_count}</span> /{' '}
                        <span style={{ color: '#34d399' }}>✓{item.resolved_count}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Analytics Table */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderGit2 size={18} color="#818cf8" />
            <h3 className="card-title">Project Performance & Resolution Rates</h3>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Total Defects</th>
                  <th>Open / In Progress</th>
                  <th>Resolved</th>
                  <th>Closed</th>
                  <th>Critical</th>
                  <th>Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {projectAnalytics.map((pa) => (
                  <tr key={pa.project_id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)', marginRight: '0.5rem' }}>
                        {pa.project_key}
                      </span>
                      <span style={{ fontWeight: '500' }}>{pa.project_name}</span>
                    </td>
                    <td>{pa.total_issues}</td>
                    <td>{pa.open_issues + pa.in_progress_issues}</td>
                    <td>{pa.resolved_issues}</td>
                    <td>{pa.closed_issues}</td>
                    <td>
                      <span style={{ color: pa.critical_issues > 0 ? '#f87171' : 'inherit', fontWeight: pa.critical_issues > 0 ? '700' : 'normal' }}>
                        {pa.critical_issues}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: pa.resolution_rate >= 80 ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                          color: pa.resolution_rate >= 80 ? '#34d399' : '#fbbf24',
                        }}
                      >
                        {pa.resolution_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Developer Performance (Admin Only) */}
      {isAdmin && devAnalytics.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#c084fc" />
              <h3 className="card-title">Developer Performance Analytics</h3>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Developer</th>
                    <th>Assigned Defects</th>
                    <th>Resolved</th>
                    <th>Pending Open</th>
                    <th>Resolution Rate</th>
                    <th>Avg Resolution Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {devAnalytics.map((dev) => (
                    <tr key={dev.developer_id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{dev.developer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dev.developer_email}</div>
                      </td>
                      <td>{dev.assigned_issues}</td>
                      <td>
                        <span style={{ color: '#34d399', fontWeight: '600' }}>{dev.resolved_issues}</span>
                      </td>
                      <td>{dev.open_issues}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: dev.resolution_rate >= 75 ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                            color: dev.resolution_rate >= 75 ? '#34d399' : '#fbbf24',
                          }}
                        >
                          {dev.resolution_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {dev.average_resolution_time_hours != null
                          ? `${dev.average_resolution_time_hours.toFixed(1)} hrs`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
