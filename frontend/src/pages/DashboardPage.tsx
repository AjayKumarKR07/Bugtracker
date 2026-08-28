import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bug,
  CheckCircle2,
  Clock,
  FolderGit2,
  PlusCircle,
  Shield,
  Sparkles,
  FileCode2,
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
import { formatRelativeTime } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

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
      // 1. Core Data: Scoped Issues and Accessible Projects
      const [issuesRes, projectsRes] = await Promise.all([
        issuesApi.list({ page: 1, page_size: 8 }),
        projectsApi.list({ page: 1, page_size: 5 }),
      ]);

      setRecentIssues(issuesRes.items || []);
      setTotalIssueCount(issuesRes.total || 0);
      setProjects(projectsRes.items || []);
      setTotalProjectCount(projectsRes.total || 0);

      // 2. Role-specific analytics (in parallel, safely handled)
      if (user?.role === 'ADMIN') {
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

  // Calculate dynamic developer / tester workflow counts
  const inProgressCount = statusDist
    ? (statusDist.IN_DEVELOPMENT || 0) + (statusDist.IN_REVIEW || 0) + (statusDist.ASSIGNED || 0)
    : 0;

  const resolvedCount = statusDist
    ? (statusDist.RESOLVED || 0) + (statusDist.CLOSED || 0)
    : 0;

  const needsReviewCount = statusDist
    ? (statusDist.IN_REVIEW || 0) + (statusDist.RESOLVED || 0)
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
                <Sparkles size={12} /> {user?.role} WORKSPACE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', marginBottom: '0.35rem' }}>
              Welcome back, {user?.full_name}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              {user?.role === 'ADMIN' && 'Here is a global overview of defect tracking and team activity across all projects.'}
              {user?.role === 'TESTER' && 'Track your assigned defects, report new issues, and monitor resolution progress.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {user?.role === 'TESTER' && (
              <Link to="/issues" className="btn btn-primary">
                <PlusCircle size={16} />
                <span>Report Defect</span>
              </Link>
            )}
            {user?.role === 'ADMIN' && (
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
        {user?.role === 'ADMIN' && systemStats ? (
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
        ) : (
          <>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">My Assigned Defects</span>
                <span className="metric-value">{totalIssueCount}</span>
              </div>
              <div className="metric-icon-box metric-icon-indigo">
                <Bug size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">In Progress / Under Investigation</span>
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

      {/* Tester Workflow Status Summary Bar */}
      {user?.role === 'TESTER' && statusDist && totalIssueCount > 0 && (
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
              Assigned Pipeline Status:
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Defects + Accessible Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Defects Table */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bug size={18} color="#818cf8" />
              <h2 className="card-title">
                {user?.role === 'TESTER'
                  ? 'My Issues (Assigned & Reported)'
                  : 'Recent Organization Defects'}
              </h2>
            </div>
            <Link to="/issues" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {recentIssues.length === 0 ? (
              <EmptyState
                title="No defects found"
                description={
                  user?.role === 'TESTER'
                    ? 'No defects in your queue yet. You will see both reported and assigned issues here.'
                    : 'No defects exist in the system yet.'
                }
              />
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

        {/* Projects Summary */}
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
              <EmptyState
                title="No projects active"
                description="No projects are currently configured in the workspace."
              />
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--primary-subtle)',
                          color: '#818cf8',
                          fontWeight: '600',
                          flexShrink: 0,
                        }}
                      >
                        {proj.project_key}
                      </span>
                      <Link
                        to="/projects"
                        style={{
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {proj.name}
                      </Link>
                    </div>
                    {proj.description && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.25rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '300px',
                          margin: '0.25rem 0 0 0',
                        }}
                      >
                        {proj.description}
                      </p>
                    )}
                  </div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        proj.status === 'ACTIVE'
                          ? 'var(--success-subtle)'
                          : 'rgba(100, 116, 139, 0.2)',
                      color: proj.status === 'ACTIVE' ? '#34d399' : '#94a3b8',
                      flexShrink: 0,
                    }}
                  >
                    {proj.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
