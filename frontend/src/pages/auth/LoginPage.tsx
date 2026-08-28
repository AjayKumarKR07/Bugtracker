import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bug, Mail, ArrowRight, Shield, KeyRound, AlertCircle } from 'lucide-react';
import { getApiErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { requestOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const rawFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const from = rawFrom && rawFrom !== '/' ? rawFrom : '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email or Gmail address.');
      return;
    }

    setError(null);
    setIsRateLimited(false);
    setIsSubmitting(true);
    try {
      await requestOtp(email.trim());
      navigate('/verify-otp', {
        state: { email: email.trim(), from },
      });
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      if (errMsg.toLowerCase().includes('wait') || errMsg.toLowerCase().includes('too many') || errMsg.toLowerCase().includes('cooldown')) {
        setIsRateLimited(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToOtp = () => {
    navigate('/verify-otp', {
      state: { email: email.trim(), from },
    });
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo auth-logo-center">
            <Bug size={24} />
          </div>
          <h1 className="auth-title">Sign in to BugTracker</h1>
          <p className="auth-subtitle">
            Enter your email or Gmail to receive a one-time verification code
          </p>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              {isRateLimited && email.trim() && (
                <button
                  type="button"
                  onClick={handleProceedToOtp}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.8rem' }}
                >
                  <KeyRound size={14} />
                  <span>Enter Already Sent Code Now →</span>
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address / Gmail
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="name@company.com or user@gmail.com"
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
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
          >
            {isSubmitting ? 'Sending Code...' : 'Send Verification OTP'}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.25rem',
            textAlign: 'center',
            fontSize: '0.85rem',
          }}
        >
          <Link
            to="/verify-otp"
            state={{ email: email.trim(), from }}
            style={{ color: 'var(--primary)', fontWeight: '500' }}
          >
            Already have an OTP code? Enter code →
          </Link>
        </div>

        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <Shield size={14} />
          <span>Passwordless & secure one-time passcode login</span>
        </div>
      </div>
    </div>
  );
};
