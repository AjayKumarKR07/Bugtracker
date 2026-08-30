import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bug,
  CheckCircle2,
  Clock,
  FolderGit2,
  Shield,
  Sparkles,
  FileCode2,
  AlertCircle,
  FilePlus2,
  Send,
} from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { getApiErrorMessage } from '../api/client';
import { issuesApi } from '../api/issues';
import { projectsApi } from '../api/projects';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import type { IssueStatusDistributionResponse, SystemAnalyticsResponse } from '../types/analytics';
import type { Issue } from '../types/issue';
import type { Project } from '../types/project';
import { getRoleLabel } from '../types/auth';
import { formatRelativeTime } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isUser = user?.role === 'USER';
  const isTester = user?.role === 'TESTER' || user?.role === 'DEVELOPER';
  const isAdmin = user?.role === 'ADMIN';

  const [systemStats, setSystemStats] = useState<SystemAnalyticsResponse | null>(null);
  const [statusDist, setStatusDist] = useState<IssueStatusDistributionResponse | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalIssueCount, setTotalIssueCount] = useState<number>(0);
  const [totalProjectCount, setTotalProjectCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Core issues (always scoped by backend RBAC)
      const issuesRes = await issuesApi.list({ page: 1, page_size: 8 });
      setRecentIssues(issuesRes.items || []);
      setTotalIssueCount(issuesRes.total || 0);

      // Projects: not meaningful for USER role — skip to avoid showing global count
      if (!isUser) {
        const projectsRes = await projectsApi.list({ page: 1, page_size: 5 });
        setProjects(projectsRes.items || []);
        setTotalProjectCount(projectsRes.total || 0);
      }

      // Role-specific analytics
      if (isAdmin) {
        try {
          const adminOverview = await analyticsApi.getSystemOverview();
          setSystemStats(adminOverview);
        } catch {
          // Non-critical fallback
        }
      } else {
        try {
          const distribution = await analyticsApi.getStatusDistribution();
          setStatusDist(distribution);
        } catch {
          // Non-critical fallback
        }
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner message="Loading your workspace dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  // Calculate dynamic counts from real status distribution
  const inProgressCount = statusDist
    ? (statusDist.IN_DEVELOPMENT || 0) + (statusDist.IN_REVIEW || 0) + (statusDist.ASSIGNED || 0)
    : 0;

  const resolvedCount = statusDist
    ? (statusDist.RESOLVED || 0) + (statusDist.CLOSED || 0)
    : 0;

  const userBeingInvestigated = statusDist
    ? (statusDist.ASSIGNED || 0) + (statusDist.IN_DEVELOPMENT || 0)
        + (statusDist.IN_REVIEW || 0) + (statusDist.IN_TESTING || 0)
    : 0;

  const userStillOpen = statusDist
    ? (statusDist.REPORTED || 0) + (statusDist.TRIAGED || 0) + (statusDist.REOPENED || 0)
    : 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.12) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          marginBottom: '1.75rem',
        }}
      >
        <div
          className="card-body"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge" style={{ backgroundColor: 'var(--primary-subtle)', color: '#818cf8', fontWeight: '600' }}>
                <Sparkles size={12} /> {getRoleLabel(user?.role ?? 'USER')} WORKSPACE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', marginBottom: '0.35rem' }}>
              Welcome back, {user?.full_name}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              {isAdmin && 'Here is a global overview of defect tracking and team activity across all projects.'}
              {isTester && 'Track your assigned defects and monitor resolution progress.'}
              {isUser && 'Submit issues, track the status of your reported defects, and receive updates.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isUser && (
              <button className="btn btn-primary" onClick={() => navigate('/issues?create=true')}>
                <FilePlus2 size={16} />
                <span>Report New Issue</span>
              </button>
            )}
            {isTester && (
              <Link to="/issues" className="btn btn-primary">
                <Bug size={16} />
                <span>My Assigned Issues</span>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="btn btn-primary">
                <Shield size={16} />
                <span>Admin Panel</span>
              </Link>
            )}
            <Link to="/analytics" className="btn btn-secondary">
              <BarChart3 size={16} />
              <span>View Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      <div className="metrics-grid">
        {isAdmin && systemStats ? (
          <>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Total Projects</span>
                <span className="metric-value">{systemStats.total_projects}</span>
              </div>
              <div className="metric-icon-box metric-icon-indigo">
                <FolderGit2 size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Total Defects</span>
                <span className="metric-value">{systemStats.total_issues}</span>
              </div>
              <div className="metric-icon-box metric-icon-amber">
                <Bug size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Open / In Progress</span>
                <span className="metric-value">{systemStats.open_issues + systemStats.in_progress_issues}</span>
              </div>
              <div className="metric-icon-box metric-icon-rose">
                <Clock size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Resolved / Closed</span>
                <span className="metric-value">{systemStats.resolved_issues + systemStats.closed_issues}</span>
              </div>
              <div className="metric-icon-box metric-icon-emerald">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </>
        ) : isUser ? (
          /* USER: meaningful scoped metrics — no global project count */
          <>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">My Submitted Issues</span>
                <span className="metric-value">{totalIssueCount}</span>
              </div>
              <div className="metric-icon-box metric-icon-indigo">
                <Bug size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Being Investigated</span>
                <span className="metric-value">{userBeingInvestigated}</span>
              </div>
              <div className="metric-icon-box metric-icon-purple">
                <Clock size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Resolved</span>
                <span className="metric-value">{resolvedCount}</span>
              </div>
              <div className="metric-icon-box metric-icon-emerald">
                <CheckCircle2 size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Still Open</span>
                <span className="metric-value">{userStillOpen}</span>
              </div>
              <div className="metric-icon-box metric-icon-rose">
                <AlertCircle size={22} />
              </div>
            </div>
          </>
        ) : (
          /* TESTER / DEVELOPER */
          <>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">My Assigned Issues</span>
                <span className="metric-value">{totalIssueCount}</span>
              </div>
              <div className="metric-icon-box metric-icon-indigo">
                <Bug size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">In Progress</span>
                <span className="metric-value">{inProgressCount}</span>
              </div>
              <div className="metric-icon-box metric-icon-purple">
                <Clock size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Resolved Defects</span>
                <span className="metric-value">{resolvedCount}</span>
              </div>
              <div className="metric-icon-box metric-icon-emerald">
                <CheckCircle2 size={22} />
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Accessible Projects</span>
                <span className="metric-value">{totalProjectCount}</span>
              </div>
              <div className="metric-icon-box metric-icon-purple">
                <FolderGit2 size={22} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status Summary Bar */}
      {(isTester || isUser) && statusDist && totalIssueCount > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCode2 size={18} color="#818cf8" />
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {isUser ? 'Your Issues Status:' : 'Assigned Pipeline Status:'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isUser ? (
              <>
                <span className="badge badge-status-REPORTED">
                  Reported: {statusDist.REPORTED || 0}
                </span>
                <span className="badge badge-status-ASSIGNED">
                  Being Investigated: {userBeingInvestigated}
                </span>
                <span className="badge badge-status-RESOLVED">
                  Resolved: {statusDist.RESOLVED || 0}
                </span>
                {(statusDist.CLOSED || 0) > 0 && (
                  <span className="badge badge-status-CLOSED">
                    Closed: {statusDist.CLOSED}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="badge badge-status-ASSIGNED">
                  Assigned: {statusDist.ASSIGNED || 0}
                </span>
                <span className="badge badge-status-IN_DEVELOPMENT">
                  In Development: {statusDist.IN_DEVELOPMENT || 0}
                </span>
                <span className="badge badge-status-IN_REVIEW">
                  In Review: {statusDist.IN_REVIEW || 0}
                </span>
                <span className="badge badge-status-RESOLVED">
                  Resolved: {statusDist.RESOLVED || 0}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Issues Table */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bug size={18} color="#818cf8" />
              <h2 className="card-title">
                {isUser ? 'My Submitted Issues' : isTester ? 'My Assigned Issues' : 'Recent Organization Defects'}
              </h2>
            </div>
            <Link to="/issues" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {recentIssues.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'rgba(99,102,241,0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
                }}>
                  <FilePlus2 size={26} color="#818cf8" />
                </div>
                <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.4rem', fontSize: '1rem' }}>
                  {isUser ? 'No issues submitted yet' : isTester ? 'No assigned issues yet' : 'No defects yet'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: isUser ? '1.5rem' : '0' }}>
                  {isUser
                    ? 'Found a bug or problem? Report it and track its progress from here.'
                    : isTester
                    ? 'Issues assigned to you will appear here once an admin assigns them.'
                    : 'No defects exist in the system yet.'}
                </p>
                {isUser && (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/issues?create=true')}
                    style={{ margin: '0 auto' }}
                  >
                    <FilePlus2 size={16} />
                    <span>Report Your First Issue</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Title</th>
                      <th>Severity</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIssues.map((issue) => (
                      <tr key={issue.id}>
                        <td>
                          <Link
                            to={`/issues/${issue.id}`}
                            style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--primary)' }}
                          >
                            {issue.issue_key}
                          </Link>
                        </td>
                        <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Link
                            to={`/issues/${issue.id}`}
                            style={{ color: 'var(--text-primary)', fontWeight: '500' }}
                            title={issue.title}
                          >
                            {issue.title}
                          </Link>
                        </td>
                        <td>
                          <SeverityBadge severity={issue.severity} />
                        </td>
                        <td>
                          <PriorityBadge priority={issue.priority} />
                        </td>
                        <td>
                          <StatusBadge status={issue.status} />
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatRelativeTime(issue.updated_at || issue.created_at)}
                        </td>
                        <td>
                          <Link
                            to={`/issues/${issue.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <span>Open</span>
                            <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: USER → Report Issue CTA; TESTER/ADMIN → Projects */}
        {isUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Report Issue Card */}
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.10) 100%)',
                border: '1px solid rgba(99,102,241,0.30)',
              }}
            >
              <div className="card-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(99,102,241,0.18)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                }}>
                  <Send size={28} color="#818cf8" />
                </div>
                <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Report a New Issue
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Found a bug or problem? Submit a detailed report and the admin team will review and assign it to a tester.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/issues?create=true')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <FilePlus2 size={16} />
                  <span>Report New Issue</span>
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="card">
              <div className="card-body" style={{ padding: '1.25rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} color="#818cf8" /> How it works
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { step: '1', label: 'You submit an issue', desc: 'Describe the problem in detail' },
                    { step: '2', label: 'Admin reviews & assigns', desc: 'A tester is assigned to investigate' },
                    { step: '3', label: 'Tester investigates', desc: 'Updates progress as they work' },
                    { step: '4', label: 'Issue resolved', desc: 'You receive a resolution update' },
                  ].map((item) => (
                    <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <span style={{
                        minWidth: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgba(99,102,241,0.18)', color: '#818cf8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
                      }}>
                        {item.step}
                      </span>
                      <div>
                        <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem', margin: 0 }}>{item.label}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/issues" className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
              <Bug size={16} />
              <span>View All My Issues</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          /* TESTER / ADMIN: Projects Summary */
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FolderGit2 size={18} color="#34d399" />
                <h2 className="card-title">Active Projects ({totalProjectCount})</h2>
              </div>
              <Link to="/projects" className="btn btn-secondary btn-sm">
                <span>View All</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {projects.length === 0 ? (
                <EmptyState title="No projects active" description="No projects are currently configured in the workspace." />
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                          padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--primary-subtle)', color: '#818cf8',
                          fontWeight: '600', flexShrink: 0,
                        }}>
                          {proj.project_key}
                        </span>
                        <Link to="/projects" style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj.name}
                        </Link>
                      </div>
                      {proj.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                          {proj.description}
                        </p>
                      )}
                    </div>
                    <span className="badge" style={{
                      backgroundColor: proj.status === 'ACTIVE' ? 'var(--success-subtle)' : 'rgba(100, 116, 139, 0.2)',
                      color: proj.status === 'ACTIVE' ? '#34d399' : '#94a3b8', flexShrink: 0,
                    }}>
                      {proj.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
