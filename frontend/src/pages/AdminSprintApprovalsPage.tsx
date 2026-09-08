import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  ThumbsUp,
} from 'lucide-react';
import { SprintService } from '../services/SprintService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Modal } from '../components/common/Modal';
import type { Sprint } from '../types/Sprint';
import { formatDate, formatRelativeTime } from '../utils/formatters';

export const AdminSprintApprovalsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [awaitingApproval, setAwaitingApproval] = useState<Sprint[]>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);

  // Action states
  const [requestChangesSprintId, setRequestChangesSprintId] = useState<number | null>(null);
  const [requestChangesComment, setRequestChangesComment] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [pending, all] = await Promise.all([
        SprintService.getAwaitingApprovalSprints(),
        SprintService.getAllSprints(),
      ]);
      setAwaitingApproval(pending || []);
      setAllSprints(all || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load approval requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveSprint = async (sprintId: number) => {
    setActionLoadingId(sprintId);
    try {
      await SprintService.approveSprint(sprintId);
      setToastMessage({ type: 'success', text: 'Sprint approved! Status updated to COMPLETED.' });
      fetchData(true);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to approve sprint' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!requestChangesSprintId) return;
    setActionLoadingId(requestChangesSprintId);
    try {
      await SprintService.requestChanges(requestChangesSprintId, requestChangesComment || null);
      setToastMessage({ type: 'success', text: 'Changes requested. Sprint returned to IN_PROGRESS.' });
      setRequestChangesSprintId(null);
      setRequestChangesComment('');
      fetchData(true);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to request changes' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Recently approved/completed sprints for history
  const recentlyCompleted = allSprints
    .filter((s) => s.status === 'COMPLETED')
    .slice(0, 10);

  if (loading && awaitingApproval.length === 0) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <LoadingSpinner message="Loading Sprint Approval Requests..." />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <header
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                Sprint Approvals
              </h1>
              <p className="page-subtitle" style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Review and approve testing milestones submitted by QA Testers
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ fontSize: '0.82rem' }}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Approval Decision Workflow Banner */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '10px',
          backgroundColor: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
          Sprint Approval Gateway Process
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
          <span style={{ fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
            READY_FOR_APPROVAL
          </span>
          <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Admin Review
          </span>
          <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
              ✓ APPROVE → COMPLETED
            </span>
            <span style={{ color: 'var(--text-muted)' }}>or</span>
            <span style={{ fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>
              ↺ REQUEST CHANGES → IN_PROGRESS (Tester Rework)
            </span>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => fetchData()} />}

      {/* Pending Sprints Section */}
      <section className="card" style={{ marginBottom: '2.5rem' }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: awaitingApproval.length > 0 ? 'rgba(99,102,241,0.06)' : undefined,
          }}
        >
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardCheck size={18} style={{ color: awaitingApproval.length > 0 ? '#818cf8' : 'var(--text-muted)' }} />
            Pending Approval ({awaitingApproval.length})
          </h2>
          {awaitingApproval.length > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#6366f1', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
              ACTION REQUIRED
            </span>
          )}
        </div>

        <div className="card-body">
          {awaitingApproval.length === 0 ? (
            <div className="empty-state" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <CheckCircle2 size={30} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                All Sprint Submissions Reviewed
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                No sprints are currently waiting for admin sign-off. When a QA tester completes testing and submits a sprint, it will appear here for review.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {awaitingApproval.map((sprint) => {
                const totalIssues = sprint.total_issues ?? 0;
                const completedIssues = sprint.completed_issues ?? 0;
                const pct = sprint.progress_percentage ?? (totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0);

                return (
                  <div
                    key={sprint.id}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {sprint.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(99,102,241,0.25)', color: '#818cf8', padding: '0.15rem 0.55rem', borderRadius: '4px' }}>
                            READY_FOR_APPROVAL
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          Project: <strong style={{ color: 'var(--text-primary)' }}>{sprint.project_name || `ID #${sprint.project_id}`}</strong>
                        </div>

                        {sprint.goal && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                            <strong>Goal:</strong> {sprint.goal}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span>
                            Assigned Tester: <strong style={{ color: '#34d399' }}>{sprint.assigned_tester_name || '—'}</strong>
                          </span>
                          <span>
                            Sprint Window: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(sprint.start_date)}</strong> to <strong style={{ color: 'var(--text-primary)' }}>{formatDate(sprint.end_date)}</strong>
                          </span>
                          {sprint.submitted_at && (
                            <span>
                              Submitted: <strong style={{ color: 'var(--text-primary)' }}>{formatRelativeTime(sprint.submitted_at)}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                        <Link
                          to={`/projects/${sprint.project_id}/sprints`}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
                        >
                          <ExternalLink size={15} /> View Sprint
                        </Link>
                        <button
                          className="btn btn-success"
                          disabled={actionLoadingId === sprint.id}
                          onClick={() => handleApproveSprint(sprint.id)}
                          style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem', fontWeight: 700 }}
                          title="Approve Sprint → COMPLETED"
                        >
                          <ThumbsUp size={15} /> Approve Sprint
                        </button>
                        <button
                          className="btn btn-secondary"
                          disabled={actionLoadingId === sprint.id}
                          onClick={() => {
                            setRequestChangesSprintId(sprint.id);
                            setRequestChangesComment('');
                          }}
                          style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
                          title="Request changes → Returns to IN_PROGRESS"
                        >
                          <RotateCcw size={15} /> Request Changes
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar and Issue Count */}
                    <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Issue Completion: <strong>{completedIssues} / {totalIssues}</strong> issues closed
                        </span>
                        <span style={{ fontWeight: 800, color: pct >= 80 ? '#10b981' : '#f59e0b' }}>
                          {pct}% Complete
                        </span>
                      </div>
                      <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            backgroundColor: pct >= 80 ? '#10b981' : '#f59e0b',
                            borderRadius: '4px',
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recently Approved / Completed Sprints */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            Recently Approved Sprints ({recentlyCompleted.length})
          </h2>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {recentlyCompleted.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No completed sprints found.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sprint Name</th>
                    <th>Project</th>
                    <th>Tester</th>
                    <th>Completed At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyCompleted.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {s.project_name || `Project #${s.project_id}`}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                          {s.assigned_tester_name || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {s.completed_at ? formatRelativeTime(s.completed_at) : '—'}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          COMPLETED
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/projects/${s.project_id}/sprints`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Request Changes Modal */}
      <Modal
        isOpen={requestChangesSprintId !== null}
        onClose={() => {
          setRequestChangesSprintId(null);
          setRequestChangesComment('');
        }}
        title="Request Changes on Sprint"
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          The sprint will be returned to the assigned tester with status <strong>IN_PROGRESS</strong>.
        </p>
        <div className="form-group">
          <label className="form-label">Review Comment / Feedback (optional)</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={requestChangesComment}
            onChange={(e) => setRequestChangesComment(e.target.value)}
            placeholder="Describe what issues need to be resolved, retested, or updated before final sign-off..."
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setRequestChangesSprintId(null);
              setRequestChangesComment('');
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={actionLoadingId !== null}
            onClick={handleRequestChanges}
          >
            Send Back to Tester
          </button>
        </div>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-surface-elevated)',
            border: `1px solid ${toastMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
            padding: '0.9rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            zIndex: 9999,
          }}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#ef4444' }} />
          )}
          <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {toastMessage.text}
          </span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', marginLeft: '0.5rem' }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
