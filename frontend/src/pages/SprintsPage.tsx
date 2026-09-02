import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SprintService } from '../services/SprintService';
import { issuesApi } from '../api/issues';
import type { Sprint, SprintCreate, SprintAnalytics, SprintOverview } from '../types/Sprint';
import type { Issue } from '../types/issue';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { getApiErrorMessage } from '../api/client';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../hooks/useAuth';
import { Plus, Download, Play, CheckCircle, Trash2, Calendar, Archive, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SprintsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [overview, setOverview] = useState<SprintOverview | null>(null);
  const [sprintIssues, setSprintIssues] = useState<Record<number, Issue[]>>({});
  const [analytics, setAnalytics] = useState<Record<number, SprintAnalytics>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formCapacityMembers, setFormCapacityMembers] = useState('');
  const [formCapacityDays, setFormCapacityDays] = useState('');
  const [formCapacityHours, setFormCapacityHours] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complete Modal
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completeSprintId, setCompleteSprintId] = useState<number | null>(null);
  const [moveToSprintId, setMoveToSprintId] = useState<number | ''>('');
  
  // Extend Modal
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extendSprintId, setExtendSprintId] = useState<number | null>(null);
  const [formExtendEnd, setFormExtendEnd] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sprintsData, overviewData] = await Promise.all([
        SprintService.getSprintsByProject(projectId),
        SprintService.getProjectSprintSummary(projectId)
      ]);
      setSprints(sprintsData);
      setOverview(overviewData);

      const issuesMap: Record<number, Issue[]> = {};
      const analyticsMap: Record<number, SprintAnalytics> = {};
      
      await Promise.all(sprintsData.map(async (sprint) => {
        const [issuesResponse, analyticsResponse] = await Promise.all([
          issuesApi.list({ sprint_id: sprint.id, page_size: 100 }),
          SprintService.getSprintAnalytics(sprint.id)
        ]);
        issuesMap[sprint.id] = issuesResponse.items;
        analyticsMap[sprint.id] = analyticsResponse;
      }));
      
      setSprintIssues(issuesMap);
      setAnalytics(analyticsMap);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const payload: SprintCreate = {
        name: formName,
        goal: formGoal || null,
        start_date: new Date(formStart).toISOString(),
        end_date: new Date(formEnd).toISOString(),
        project_id: projectId,
        estimated_team_members: formCapacityMembers ? parseInt(formCapacityMembers) : null,
        working_days: formCapacityDays ? parseInt(formCapacityDays) : null,
        hours_per_day: formCapacityHours ? parseInt(formCapacityHours) : null,
      };
      await SprintService.createSprint(payload);
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSprint = async (sprintId: number) => {
    try {
      await SprintService.startSprint(sprintId);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeSprintId) return;
    try {
      await SprintService.completeSprint(completeSprintId, moveToSprintId ? Number(moveToSprintId) : undefined);
      setIsCompleteOpen(false);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleRemoveIssue = async (sprintId: number, issueId: number) => {
    if (!window.confirm("Remove this issue from the sprint?")) return;
    try {
      await SprintService.removeIssueFromSprint(sprintId, issueId);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleArchiveSprint = async (sprintId: number) => {
    if (!window.confirm("Are you sure you want to archive this sprint?")) return;
    try {
      await SprintService.archiveSprint(sprintId);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };
  
  const handleDeleteSprint = async (sprintId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this sprint?")) return;
    try {
      await SprintService.deleteSprint(sprintId);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendSprintId || !formExtendEnd) return;
    try {
      await SprintService.extendSprint(extendSprintId, { new_end_date: new Date(formExtendEnd).toISOString() });
      setIsExtendOpen(false);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading sprints..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sprints Dashboard</h1>
          <p className="page-subtitle">Manage agile sprints, track progress, and view analytics.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> Create Sprint
          </button>
        )}
      </div>
      
      {overview && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Average Velocity</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{overview.avg_velocity} pts</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Avg Completion Rate</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{overview.avg_completion_rate}%</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Total Sprints</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{overview.total_sprints}</div>
          </div>
        </div>
      )}

      {sprints.length === 0 ? (
        <EmptyState title="No sprints found" description="Create your first sprint to start planning work." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {sprints.map(sprint => {
            const sprintAnalytics = analytics[sprint.id];
            
            return (
              <div key={sprint.id} className="card" style={{ padding: '1.5rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {sprint.name}
                      <span style={{ 
                        fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px', 
                        backgroundColor: sprint.status === 'ACTIVE' ? 'var(--primary)' : 
                                         sprint.status === 'COMPLETED' ? 'var(--success)' : 'var(--bg-secondary)',
                        color: sprint.status === 'ACTIVE' ? 'white' : 'inherit'
                      }}>
                        {sprint.status}
                      </span>
                    </h3>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>{sprint.goal}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => SprintService.downloadSprintReport(sprint.id, sprint.name)}>
                      <Download size={14} /> PDF Report
                    </button>
                    {isAdmin && sprint.status === 'PLANNED' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStartSprint(sprint.id)}>
                        <Play size={14} /> Start Sprint
                      </button>
                    )}
                    {isAdmin && (sprint.status === 'ACTIVE' || sprint.status === 'PLANNED') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setExtendSprintId(sprint.id); setIsExtendOpen(true); }}>
                        <Calendar size={14} /> Extend
                      </button>
                    )}
                    {isAdmin && sprint.status === 'ACTIVE' && (
                      <button className="btn btn-success btn-sm" onClick={() => { setCompleteSprintId(sprint.id); setIsCompleteOpen(true); }}>
                        <CheckCircle size={14} /> Complete
                      </button>
                    )}
                    {isAdmin && sprint.status === 'COMPLETED' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleArchiveSprint(sprint.id)}>
                        <Archive size={14} /> Archive
                      </button>
                    )}
                    {isAdmin && sprint.status === 'PLANNED' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSprint(sprint.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {sprintAnalytics?.is_overdue && (
                  <div className="alert-box alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} />
                    This sprint is overdue by {sprintAnalytics.days_overdue} days!
                  </div>
                )}

                {/* Dashboard Stats */}
                {sprintAnalytics && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Progress</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{sprintAnalytics.completion_rate}%</div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-primary)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                          <div style={{ width: `${sprintAnalytics.completion_rate}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                        </div>
                      </div>
                      
                      <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Scope</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{sprintAnalytics.total_issues} issues</div>
                      </div>
                      
                      <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completed</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success)' }}>{sprintAnalytics.completed_issues} issues</div>
                      </div>
                      
                      <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Remaining</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--warning)' }}>{sprintAnalytics.remaining_issues} issues</div>
                      </div>

                      <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Capacity</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                          {sprintAnalytics.total_capacity_hours ? `${sprintAnalytics.total_capacity_hours} hrs` : 'Not set'}
                        </div>
                      </div>

                      <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estimated Effort</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {sprintAnalytics.total_estimated_effort} pts
                        </div>
                      </div>
                    </div>
                    
                    {/* Charts & Workload */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                           <h4 style={{ margin: 0 }}>Burndown Chart</h4>
                           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical Trajectory</span>
                         </div>
                         {sprintAnalytics.burndown_points && sprintAnalytics.burndown_points.length > 0 ? (
                           <div style={{ height: '240px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={sprintAnalytics.burndown_points}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                 <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                                 <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }} />
                                 <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '6px' }} />
                                 <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal Burndown" dot={false} />
                                 <Line type="monotone" dataKey="remaining" stroke="var(--primary)" strokeWidth={2.5} name="Actual Remaining" dot={{ r: 3 }} />
                               </LineChart>
                             </ResponsiveContainer>
                           </div>
                         ) : (
                           <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                             <p style={{ margin: 0, fontWeight: '500', fontSize: '0.9rem' }}>No burndown history recorded yet</p>
                             <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem' }}>Data points will automatically record as the sprint becomes active and issues are resolved.</p>
                           </div>
                         )}
                      </div>
                      
                      <div className="card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Team Workload</h4>
                        {sprintAnalytics.workload.length === 0 ? (
                          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            No issues assigned to team members yet.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {sprintAnalytics.workload.map(wl => (
                              <div key={wl.developer_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{wl.developer_name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wl.completed_issues} / {wl.assigned_issues} resolved</div>
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: 'var(--primary)' }}>{wl.assigned_issues} issues</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Issues Table */}
                <h4 style={{ marginBottom: '1rem' }}>Sprint Issues</h4>
                {sprintIssues[sprint.id]?.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No issues assigned to this sprint.</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Title</th>
                          <th>Status</th>
                          {isAdmin && sprint.status !== 'COMPLETED' && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sprintIssues[sprint.id]?.map(issue => (
                          <tr key={issue.id}>
                            <td><Link to={`/issues/${issue.id}`} className="text-primary font-mono">{issue.issue_key}</Link></td>
                            <td>{issue.title}</td>
                            <td>{issue.status}</td>
                            {isAdmin && sprint.status !== 'COMPLETED' && (
                              <td>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleRemoveIssue(sprint.id, issue.id)}>
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Advanced Sprint">
        {formError && <div className="alert-box alert-danger">{formError}</div>}
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Sprint Name *</label>
            <input type="text" className="form-input" required value={formName} onChange={e => setFormName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Sprint Goal</label>
            <textarea className="form-textarea" value={formGoal} onChange={e => setFormGoal(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input type="date" className="form-input" required value={formStart} onChange={e => setFormStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input type="date" className="form-input" required value={formEnd} onChange={e => setFormEnd(e.target.value)} />
            </div>
          </div>
          
          <h4 style={{ margin: '1.5rem 0 0.5rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Capacity Planning (Optional)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Team Members</label>
              <input type="number" className="form-input" min="1" value={formCapacityMembers} onChange={e => setFormCapacityMembers(e.target.value)} placeholder="e.g. 5" />
            </div>
            <div className="form-group">
              <label className="form-label">Working Days</label>
              <input type="number" className="form-input" min="1" value={formCapacityDays} onChange={e => setFormCapacityDays(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div className="form-group">
              <label className="form-label">Hours / Day</label>
              <input type="number" className="form-input" min="1" value={formCapacityHours} onChange={e => setFormCapacityHours(e.target.value)} placeholder="e.g. 8" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Create Sprint</button>
          </div>
        </form>
      </Modal>

      {/* Complete Modal */}
      <Modal isOpen={isCompleteOpen} onClose={() => setIsCompleteOpen(false)} title="Complete Sprint">
        <form onSubmit={handleCompleteSubmit}>
          <p style={{ marginBottom: '1rem' }}>Are you sure you want to complete this sprint?</p>
          <div className="form-group">
            <label className="form-label">Move Remaining Issues To:</label>
            <select
              className="form-select"
              value={moveToSprintId}
              onChange={(e) => setMoveToSprintId(Number(e.target.value) || '')}
            >
              <option value="">Backlog</option>
              {sprints.filter(s => s.status !== 'COMPLETED' && s.id !== completeSprintId).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Any unresolved issues will be moved to the selected destination.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCompleteOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">Complete Sprint</button>
          </div>
        </form>
      </Modal>

      {/* Extend Modal */}
      <Modal isOpen={isExtendOpen} onClose={() => setIsExtendOpen(false)} title="Extend Sprint">
        <form onSubmit={handleExtendSubmit}>
          <div className="form-group">
            <label className="form-label">New End Date *</label>
            <input 
              type="date" 
              className="form-input" 
              required 
              value={formExtendEnd} 
              onChange={e => setFormExtendEnd(e.target.value)} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExtendOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Extend Sprint</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
