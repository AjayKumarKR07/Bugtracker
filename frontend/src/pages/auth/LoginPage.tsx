import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bug,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  Sparkles,
} from 'lucide-react';
import { getApiErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

type LoginMode = 'password' | 'otp';

export const LoginPage: React.FC = () => {
  const { login, requestOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const from = rawFrom && rawFrom !== '/' ? rawFrom : '/dashboard';

  // Mode toggle
  const [mode, setMode] = useState<LoginMode>('password');

  // Password login fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // OTP flow fields
  const [otpEmail, setOtpEmail] = useState<string>('');

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await requestOtp(otpEmail.trim());
      navigate('/verify-otp', {
        state: { email: otpEmail.trim(), from },
      });
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err);
      // If rate-limited let user proceed to enter already-sent code
      if (
        errMsg.toLowerCase().includes('wait') ||
        errMsg.toLowerCase().includes('too many') ||
        errMsg.toLowerCase().includes('cooldown')
      ) {
        navigate('/verify-otp', {
          state: { email: otpEmail.trim(), from },
        });
        return;
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div className="auth-header">
          <div className="brand-logo auth-logo-center">
            <Bug size={24} />
          </div>
          <h1 className="auth-title">Sign in to BugTracker</h1>
          <p className="auth-subtitle">
            Track, manage, and resolve defects with your team
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => switchMode('password')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              background: mode === 'password' ? 'var(--primary)' : 'transparent',
              color: mode === 'password' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <Lock size={14} />
            Password
          </button>
          <button
            type="button"
            onClick={() => switchMode('otp')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              background: mode === 'otp' ? 'var(--primary)' : 'transparent',
              color: mode === 'otp' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <Sparkles size={14} />
            Email OTP
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── PASSWORD LOGIN FORM ── */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-email"
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
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

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── EMAIL OTP FORM ── */}
        {mode === 'otp' && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="otp-email">
                Email Address / Gmail
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="otp-email"
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="name@company.com or user@gmail.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
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
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.35rem',
                }}
              >
                A 6-digit code will be sent to this address
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !otpEmail.trim()}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div
              style={{
                marginTop: '0.75rem',
                textAlign: 'center',
                fontSize: '0.8rem',
              }}
            >
              <Link
                to="/verify-otp"
                state={{ email: otpEmail.trim(), from }}
                style={{ color: 'var(--primary)', fontWeight: '500' }}
              >
                Already have a code? Enter it →
              </Link>
            </div>
          </form>
        )}

        {/* Footer links */}
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
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: '600', color: 'var(--primary)' }}>
            Create Account
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
          <span>Secure authentication · BugTracker</span>
        </div>
      </div>
    </div>
  );
};
