import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bug,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Search,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';
import { getApiErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

/**
 * RegisterPage — public user registration.
 *
 * The backend UserRole enum contains: ADMIN | DEVELOPER | TESTER.
 * ADMIN cannot be registered publicly.
 *
 * UI presents two public roles:
 *   - "Tester / QA" → maps to backend role TESTER
 *     (investigates and resolves issues assigned by Admin)
 *   - "User / Reporter" → maps to backend role TESTER
 *     (reports issues and tracks their status)
 *
 * NOTE: The backend currently uses TESTER for both issue reporters and
 * investigators. A single TESTER role is used for public registration.
 * The Admin assigns specific testers from the user pool.
 */

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  // Backend accepts TESTER or DEVELOPER (not ADMIN).
  // We expose only TESTER for new public registrations.
  const [role] = useState<'TESTER'>('TESTER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      navigate('/verify-otp', {
        state: {
          email: email.trim(),
          from: '/dashboard',
        },
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: 'transparent', width: '0%' };
    if (password.length < 8) return { label: 'Too short', color: '#ef4444', width: '20%' };
    if (password.length < 10) return { label: 'Weak', color: '#f97316', width: '40%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score === 0) return { label: 'Fair', color: '#eab308', width: '55%' };
    if (score === 1) return { label: 'Good', color: '#22c55e', width: '75%' };
    return { label: 'Strong', color: '#10b981', width: '100%' };
  };

  const strength = passwordStrength();

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="auth-header">
          <div className="brand-logo auth-logo-center">
            <Bug size={24} />
          </div>
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">
            Join BugTracker to report, track, and resolve defects
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-name"
                type="text"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="name"
                autoFocus
              />
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-email"
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <KeyRound
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  display: 'flex',
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password strength bar */}
            {password.length > 0 && (
              <div style={{ marginTop: '0.4rem' }}>
                <div
                  style={{
                    height: '3px',
                    background: 'var(--border-subtle)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: strength.width,
                      background: strength.color,
                      borderRadius: '2px',
                      transition: 'width 0.3s, background 0.3s',
                    }}
                  />
                </div>
                {strength.label && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: strength.color,
                      marginTop: '0.2rem',
                      display: 'block',
                    }}
                  >
                    {strength.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={{
                  paddingLeft: '2.5rem',
                  paddingRight: '2.5rem',
                  borderColor:
                    confirmPassword && confirmPassword !== password
                      ? 'var(--error)'
                      : undefined,
                }}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <KeyRound
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  display: 'flex',
                }}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role info card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={16} color="var(--primary)" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  marginBottom: '0.2rem',
                }}
              >
                Team Member Account
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                You can report issues, track progress, and collaborate with your team.
                Admins and Testers are assigned by your workspace administrator.
              </div>
            </div>
          </div>

          {/* What you can do */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            {[
              { icon: <Search size={13} />, text: 'Report Issues' },
              { icon: <ShieldCheck size={13} />, text: 'Track Progress' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.65rem',
                  background: 'var(--primary-subtle)',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '500',
                  color: 'var(--primary)',
                }}
              >
                {icon}
                {text}
              </div>
            ))}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim() || !email.trim() || !password || !confirmPassword}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" />
                Creating Account...
              </>
            ) : (
              <>
                Continue to Verification
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '600', color: 'var(--primary)' }}>
            Sign In
          </Link>
        </div>

        <div
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <Shield size={12} />
          <span>ADMIN accounts cannot be self-registered · BugTracker</span>
        </div>
      </div>
    </div>
  );
};
