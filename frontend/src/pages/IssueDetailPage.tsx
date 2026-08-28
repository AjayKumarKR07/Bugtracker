import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  Trash2,
  User,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { attachmentsApi } from '../api/attachments';
import { getApiErrorMessage } from '../api/client';
import { commentsApi } from '../api/comments';
import { issuesApi } from '../api/issues';
import { usersApi } from '../api/users';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import type { Attachment } from '../types/attachment';
import type { Comment } from '../types/comment';
import type { IssueDetail, IssueStatus } from '../types/issue';
import type { UserDetail } from '../types/user';
import { formatDate, formatFileSize } from '../utils/formatters';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const issueId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [developers, setDevelopers] = useState<UserDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action States
  const [isAssignOpen, setIsAssignOpen] = useState<boolean>(false);
  const [selectedDevId, setSelectedDevId] = useState<number | ''>('');
  const [isResolveOpen, setIsResolveOpen] = useState<boolean>(false);
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [isReopenOpen, setIsReopenOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [newCommentBody, setNewCommentBody] = useState<string>('');
  const [isActionSubmitting, setIsActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchIssueData = async () => {
    if (!issueId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [issueData, commentsData, attachmentsData] = await Promise.all([
        issuesApi.getById(issueId),
        commentsApi.listByIssue(issueId),
        attachmentsApi.listByIssue(issueId),
      ]);
      setIssue(issueData);
      setComments(commentsData.items);
      setAttachments(attachmentsData.items);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDevelopers = async () => {
    if (user?.role === 'ADMIN') {
      try {
        const data = await usersApi.list({ role: 'TESTER', is_active: true });
        setDevelopers(data.items);
        if (data.items.length > 0) {
          setSelectedDevId(data.items[0].id);
        }
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    fetchIssueData();
    fetchDevelopers();
  }, [issueId]);

  // Actions
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevId) return;
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const updated = await issuesApi.assign(issueId, { developer_id: Number(selectedDevId) });
      setIssue(updated);
      setIsAssignOpen(false);
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleStatusTransition = async (newStatus: IssueStatus) => {
    setIsActionSubmitting(true);
    try {
      const updated = await issuesApi.updateStatus(issueId, { status: newStatus });
      setIssue(updated);
    } catch (err: unknown) {
      alert(getApiErrorMessage(err));
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resolutionSummary.trim().length < 10) {
      setActionError('Resolution summary must be at least 10 characters long.');
      return;
    }
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const updated = await issuesApi.resolve(issueId, {
        resolution_summary: resolutionSummary.trim(),
      });
      setIssue(updated);
      setIsResolveOpen(false);
      setResolutionSummary('');
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const updated = await issuesApi.reopen(issueId, {
        reason: reopenReason.trim() || undefined,
      });
      setIssue(updated);
      setIsReopenOpen(false);
      setReopenReason('');
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;
    try {
      const created = await commentsApi.create(issueId, { body: newCommentBody.trim() });
      setComments((prev) => [created, ...prev]);
      setNewCommentBody('');
    } catch (err: unknown) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const uploaded = await attachmentsApi.upload(issueId, file);
      setAttachments((prev) => [uploaded, ...prev]);
      e.target.value = '';
    } catch (err: unknown) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await attachmentsApi.delete(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: unknown) {
      alert(getApiErrorMessage(err));
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading defect details..." />;
  }

  if (error || !issue) {
    return <ErrorMessage message={error || 'Defect not found'} onRetry={fetchIssueData} />;
  }

  const isAssignedDev = user?.role === 'TESTER' && issue.assignee?.id === user.id;
  const isReporter = user?.role === 'TESTER' && issue.reporter?.id === user.id;
  const canReopen = (isReporter || user?.role === 'ADMIN') && ['RESOLVED', 'CLOSED', 'IN_TESTING'].includes(issue.status);

  return (
    <div>
      {/* Back button & Title Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/issues')}
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: '0.75rem' }}
        >
          <ArrowLeft size={14} />
          Back to Issues
        </button>

        <div className="page-header" style={{ marginBottom: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'var(--primary)',
                }}
              >
                {issue.issue_key}
              </span>
              <StatusBadge status={issue.status} />
              <SeverityBadge severity={issue.severity} />
              <PriorityBadge priority={issue.priority} />
            </div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {issue.title}
            </h1>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {user?.role === 'ADMIN' && (
              <button onClick={() => setIsAssignOpen(true)} className="btn btn-secondary btn-sm">
                <UserPlus size={14} />
                {issue.assignee ? 'Reassign Developer' : 'Assign Developer'}
              </button>
            )}

            {isAssignedDev && (
              <>
                {issue.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusTransition('IN_DEVELOPMENT')}
                    disabled={isActionSubmitting}
                    className="btn btn-primary btn-sm"
                  >
                    Start Development
                  </button>
                )}
                {issue.status === 'IN_DEVELOPMENT' && (
                  <button
                    onClick={() => handleStatusTransition('IN_REVIEW')}
                    disabled={isActionSubmitting}
                    className="btn btn-secondary btn-sm"
                  >
                    Submit for Review
                  </button>
                )}
                {issue.status === 'IN_REVIEW' && (
                  <button
                    onClick={() => handleStatusTransition('IN_TESTING')}
                    disabled={isActionSubmitting}
                    className="btn btn-secondary btn-sm"
                  >
                    Ready for Testing
                  </button>
                )}
                {issue.status === 'REOPENED' && (
                  <button
                    onClick={() => handleStatusTransition('IN_DEVELOPMENT')}
                    disabled={isActionSubmitting}
                    className="btn btn-primary btn-sm"
                  >
                    Restart Development
                  </button>
                )}
                {!['RESOLVED', 'CLOSED'].includes(issue.status) && (
                  <button onClick={() => setIsResolveOpen(true)} className="btn btn-primary btn-sm">
                    <CheckCircle size={14} />
                    Resolve Defect
                  </button>
                )}
              </>
            )}

            {canReopen && (
              <button onClick={() => setIsReopenOpen(true)} className="btn btn-outline-danger btn-sm">
                <RotateCcw size={14} />
                Reopen Defect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Metadata Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Description, Reproduction, Comments, Attachments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Defect Description Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Defect Description</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Overview</h4>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>{issue.description}</p>
              </div>

              {issue.steps_to_reproduce && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Steps to Reproduce</h4>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {issue.steps_to_reproduce}
                  </div>
                </div>
              )}

              {(issue.expected_result || issue.actual_result) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {issue.expected_result && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Expected Result</h4>
                      <p style={{ fontSize: '0.9rem', color: '#6ee7b7' }}>{issue.expected_result}</p>
                    </div>
                  )}
                  {issue.actual_result && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Actual Result</h4>
                      <p style={{ fontSize: '0.9rem', color: '#fca5a5' }}>{issue.actual_result}</p>
                    </div>
                  )}
                </div>
              )}

              {issue.resolution_summary && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#34d399', fontWeight: '600', fontSize: '0.875rem' }}>
                    <CheckCircle size={16} />
                    Resolution Summary {issue.resolved_at && `(Resolved on ${formatDate(issue.resolved_at)})`}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {issue.resolution_summary}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Paperclip size={18} color="#818cf8" />
                <h3 className="card-title">Attachments ({attachments.length})</h3>
              </div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv"
                />
              </label>
            </div>

            <div className="card-body">
              {attachments.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No files attached yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <FileText size={18} color="var(--primary)" />
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{att.original_filename}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatFileSize(att.file_size)} • Uploaded by {att.uploader.full_name} ({formatDate(att.created_at)})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => attachmentsApi.download(att.id, att.original_filename)}
                          className="btn btn-secondary btn-sm"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        {(user?.role === 'ADMIN' || user?.id === att.uploader.id) && (
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="btn btn-outline-danger btn-sm"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="#818cf8" />
                <h3 className="card-title">Activity & Discussion ({comments.length})</h3>
              </div>
            </div>

            <div className="card-body">
              {/* Comment Post Form */}
              <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <textarea
                    className="form-textarea"
                    placeholder="Leave a comment or resolution note..."
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={!newCommentBody.trim()} className="btn btn-primary btn-sm">
                    <Send size={13} />
                    Post Comment
                  </button>
                </div>
              </form>

              {/* Comment List */}
              {comments.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No comments yet. Start the discussion above.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {comment.author.full_name}
                          </span>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.65rem',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              color: '#818cf8',
                            }}
                          >
                            {comment.author.role}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>

                        {(user?.role === 'ADMIN' || user?.id === comment.author.id) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="btn-icon-only"
                            style={{ color: 'var(--text-muted)' }}
                            title="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Defect Details</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Project</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {issue.project.project_key} — {issue.project.name}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Issue Type</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{issue.issue_type}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Environment</span>
                <span>{issue.environment || 'Not specified'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Assignee</span>
                {issue.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <User size={14} color="var(--primary)" />
                    <span style={{ fontWeight: '600' }}>{issue.assignee.full_name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({issue.assignee.role})</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--warning)', fontWeight: '500' }}>Unassigned</span>
                )}
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Reporter</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <UserCheck size={14} color="#34d399" />
                  <span style={{ fontWeight: '600' }}>{issue.reporter.full_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({issue.reporter.role})</span>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Created At</span>
                <span>{formatDate(issue.created_at)}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Updated</span>
                <span>{formatDate(issue.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Developer Modal (ADMIN only) */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Issue to Developer"
      >
        {actionError && (
          <div className="alert-box alert-danger">
            <span>{actionError}</span>
          </div>
        )}
        <form onSubmit={handleAssignSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="dev-select">
              Select Active Developer
            </label>
            <select
              id="dev-select"
              required
              className="form-select"
              value={selectedDevId}
              onChange={(e) => setSelectedDevId(Number(e.target.value))}
            >
              {developers.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.full_name} ({dev.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="btn btn-secondary"
              disabled={isActionSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isActionSubmitting}>
              {isActionSubmitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Defect Modal (DEVELOPER only) */}
      <Modal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        title="Mark Defect as Resolved"
      >
        {actionError && (
          <div className="alert-box alert-danger">
            <span>{actionError}</span>
          </div>
        )}
        <form onSubmit={handleResolveSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="res-summary">
              Resolution Summary (min 10 characters) *
            </label>
            <textarea
              id="res-summary"
              required
              minLength={10}
              className="form-textarea"
              placeholder="Explain how the issue was fixed, root cause, and changes made..."
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setIsResolveOpen(false)}
              className="btn btn-secondary"
              disabled={isActionSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isActionSubmitting}>
              {isActionSubmitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reopen Defect Modal (TESTER / ADMIN only) */}
      <Modal
        isOpen={isReopenOpen}
        onClose={() => setIsReopenOpen(false)}
        title="Reopen Defect"
      >
        {actionError && (
          <div className="alert-box alert-danger">
            <span>{actionError}</span>
          </div>
        )}
        <form onSubmit={handleReopenSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reopen-reason">
              Reason for Reopening (Optional)
            </label>
            <textarea
              id="reopen-reason"
              className="form-textarea"
              placeholder="Explain why the fix did not work or if the bug persists..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setIsReopenOpen(false)}
              className="btn btn-secondary"
              disabled={isActionSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={isActionSubmitting}>
              {isActionSubmitting ? 'Reopening...' : 'Reopen Defect'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
