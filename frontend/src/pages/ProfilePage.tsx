import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Mail,
  Shield,
  User,
  XCircle,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import type { User as UserType } from '../types/auth';
import { formatDate } from '../utils/formatters';

export const ProfilePage: React.FC = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.getMe();
      setProfile(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading user profile..." />;
  }

  if (error || !profile) {
    return <ErrorMessage message={error || 'Failed to load profile.'} onRetry={fetchProfile} />;
  }

  const getRoleClass = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'role-admin';
      case 'DEVELOPER':
        return 'role-developer';
      case 'TESTER':
        return 'role-tester';
      default:
        return '';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your authenticated account information & permissions</p>
        </div>

        <button onClick={() => fetchProfile()} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', maxWidth: '900px' }}>
        {/* User Identity Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Information</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#fff',
                }}
              >
                {profile.full_name[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{profile.full_name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span className={`user-role-badge ${getRoleClass(profile.role)}`}>
                    {profile.role}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ID #{profile.id}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={15} /> Email
                </span>
                <span style={{ fontWeight: '500' }}>{profile.email}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={15} /> Email Verification
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: profile.is_email_verified ? '#34d399' : '#f87171',
                    fontWeight: '600',
                  }}
                >
                  {profile.is_email_verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {profile.is_email_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} /> Account Status
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: profile.is_active ? '#34d399' : '#f87171',
                    fontWeight: '600',
                  }}
                >
                  {profile.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} /> Member Since
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="card-footer">
            <button
              onClick={() => logout()}
              className="btn btn-outline-danger btn-sm"
              style={{ width: '100%' }}
            >
              <LogOut size={14} />
              Sign Out from this Device
            </button>
          </div>
        </div>

        {/* Role Privileges Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Role Privileges & Access</h3>
          </div>
          <div className="card-body" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Your account currently holds the <strong style={{ color: 'var(--text-primary)' }}>{profile.role}</strong> role.
            </p>

            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profile.role === 'ADMIN' && (
                <>
                  <li>Full system visibility across all projects and defects.</li>
                  <li>Create, update, and deactivate software projects.</li>
                  <li>Assign and reassign defects to developers.</li>
                  <li>System-wide user management (roles, activation).</li>
                  <li>View global analytics and export CSV reports.</li>
                </>
              )}
              {profile.role === 'DEVELOPER' && (
                <>
                  <li>View defects assigned to you.</li>
                  <li>Transition assigned defect workflows (In Dev, In Review, In Testing).</li>
                  <li>Resolve assigned defects with formal resolution summaries.</li>
                  <li>Collaborate via issue comments and file attachments.</li>
                  <li>Access team and project defect analytics.</li>
                </>
              )}
              {profile.role === 'TESTER' && (
                <>
                  <li>Report new defects with reproduction steps & environments.</li>
                  <li>Track defects reported by you.</li>
                  <li>Reopen defects if resolutions are unsatisfactory.</li>
                  <li>Post issue comments and upload defect evidence files.</li>
                  <li>Access project defect distribution analytics.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
