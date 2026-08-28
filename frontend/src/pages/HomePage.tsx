import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bug,
  CheckCircle2,
  Code,
  FileSpreadsheet,
  FolderGit2,
  LayoutDashboard,
  LogIn,
  Menu,
  Paperclip,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Protected Navigation Guard:
   * If user is NOT authenticated -> ALWAYS redirect to /login.
   * If user IS authenticated -> navigate to destination path.
   */
  const handleProtectedNavigation = (path: string) => {
    if (!user || !isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleVerifyOtp = () => {
    setMobileMenuOpen(false);
    navigate('/verify-otp');
  };

  return (
    <div className="home-page">
      {/* -------------------- NAVBAR -------------------- */}
      <header className="home-nav-wrapper">
        <div className="home-nav-container">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="home-brand"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="brand-logo">
              <Bug size={20} />
            </div>
            <span className="brand-title">BugTracker</span>
          </button>

          {/* Desktop Navigation Links (Section anchors on Home Page) */}
          <ul className="home-nav-links">
            <li>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="home-nav-link"
              >
                Features
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="home-nav-link"
              >
                How It Works
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => scrollToSection('roles')}
                className="home-nav-link"
              >
                Roles
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => scrollToSection('analytics')}
                className="home-nav-link"
              >
                Analytics
              </button>
            </li>
          </ul>

          {/* Top-Right Action Buttons */}
          <div className="home-nav-actions">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => handleProtectedNavigation('/dashboard')}
                className="btn btn-primary btn-sm"
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="btn btn-secondary btn-sm"
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="btn btn-primary btn-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="home-mobile-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="home-mobile-drawer open">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="home-nav-link"
              style={{ textAlign: 'left' }}
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="home-nav-link"
              style={{ textAlign: 'left' }}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('roles')}
              className="home-nav-link"
              style={{ textAlign: 'left' }}
            >
              Role Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('analytics')}
              className="home-nav-link"
              style={{ textAlign: 'left' }}
            >
              Analytics Platform
            </button>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleProtectedNavigation('/dashboard');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <LayoutDashboard size={16} />
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* -------------------- HERO SECTION -------------------- */}
      <section className="home-hero">
        <div className="hero-glow-badge">
          <Sparkles size={14} />
          <span>Intelligent Defect Tracking System</span>
        </div>

        <h1 className="hero-title">
          Track Bugs. <span className="hero-title-gradient">Build Better Software.</span>
        </h1>

        <p className="hero-description">
          BugTracker helps development teams report, manage, track, and resolve software issues efficiently.
          Collaborate seamlessly across Developers, Testers, and Administrators with real-time updates.
        </p>

        <div className="hero-cta-group">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => handleProtectedNavigation('/dashboard')}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            >
              <LayoutDashboard size={18} />
              <span>Enter Workspace ({user?.full_name?.split(' ')[0]})</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleLogin}
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
              >
                <span>Get Started</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={handleLogin}
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </button>
            </>
          )}
        </div>

        {/* Visual Dashboard Preview Illustration */}
        <div
          className="dashboard-preview-container"
          onClick={() => handleProtectedNavigation('/dashboard')}
          style={{ cursor: 'pointer' }}
          title={isAuthenticated ? 'Open live Dashboard' : 'Sign in to access Dashboard'}
        >
          <div className="mockup-window-header">
            <div className="mockup-dots">
              <span className="mockup-dot dot-red" />
              <span className="mockup-dot dot-yellow" />
              <span className="mockup-dot dot-green" />
            </div>
            <div
              className="mockup-search-bar"
              onClick={(e) => {
                e.stopPropagation();
                handleProtectedNavigation('/issues');
              }}
            >
              <Search size={13} />
              <span>Search issues, projects, or tags...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.7rem' }}>
                <Radio size={10} /> Live System Status
              </span>
            </div>
          </div>

          <div className="mockup-body">
            {/* Quick Metrics Bar */}
            <div className="mockup-stats-row">
              <div
                className="mockup-stat-card"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedNavigation('/projects');
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Projects</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', marginTop: '0.2rem' }}>6</div>
              </div>
              <div
                className="mockup-stat-card"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedNavigation('/issues');
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Defects</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f59e0b', marginTop: '0.2rem' }}>18</div>
              </div>
              <div
                className="mockup-stat-card"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedNavigation('/issues');
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolved This Week</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#34d399', marginTop: '0.2rem' }}>42</div>
              </div>
              <div
                className="mockup-stat-card"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedNavigation('/analytics');
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Turnaround</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#818cf8', marginTop: '0.2rem' }}>3.8 hrs</div>
              </div>
            </div>

            {/* Split Row: Recent Issues + Status Distribution */}
            <div className="mockup-split-row">
              {/* Sample Issue Items */}
              <div
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedNavigation('/issues');
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Active Defect Queue</span>
                  <span style={{ fontSize: '0.7rem', color: '#818cf8' }}>Click to view issues →</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.6rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#818cf8' }}>DM-0104</span>
                      <span style={{ color: 'var(--text-primary)' }}>JWT expired session not triggering logout</span>
                    </div>
                    <span className="badge badge-status-IN_DEVELOPMENT" style={{ fontSize: '0.65rem' }}>IN DEVELOPMENT</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.6rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#818cf8' }}>DM-0098</span>
                      <span style={{ color: 'var(--text-primary)' }}>CSV exporter truncates multi-line descriptions</span>
                    </div>
                    <span className="badge badge-status-RESOLVED" style={{ fontSize: '0.65rem' }}>RESOLVED</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.6rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#818cf8' }}>DM-0092</span>
                      <span style={{ color: 'var(--text-primary)' }}>WebSocket reconnection timeout backoff</span>
                    </div>
                    <span className="badge badge-status-IN_REVIEW" style={{ fontSize: '0.65rem' }}>IN REVIEW</span>
                  </div>
                </div>
              </div>

              {/* Sample Analytics Breakdown */}
              <div
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedNavigation('/analytics');
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Resolution Performance
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                      <span>Resolution Rate</span>
                      <span style={{ color: '#34d399', fontWeight: '600' }}>94.2%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: '94.2%', height: '100%', backgroundColor: '#10b981' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                      <span>Test Coverage Passes</span>
                      <span style={{ color: '#818cf8', fontWeight: '600' }}>100% (370 tests)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', backgroundColor: '#6366f1' }} />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                  Live SQL telemetry aggregations
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- FEATURES SECTION -------------------- */}
      <section id="features" className="home-section">
        <div className="section-header">
          <span className="section-badge">Platform Capabilities</span>
          <h2 className="section-title">Everything Needed to Ship Defect-Free Software</h2>
          <p className="section-subtitle">
            Engineered specifically for engineering teams seeking transparent defect workflows, rapid triage, and actionable reporting.
          </p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div
            className="feature-card"
            onClick={() => handleProtectedNavigation('/issues')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon-wrapper">
              <Bug size={24} />
            </div>
            <h3 className="feature-title">Issue Tracking</h3>
            <p className="feature-desc">
              Report and manage software defects efficiently with reproduction steps, environments, expected vs. actual outcomes, and severity tagging.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#818cf8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{isAuthenticated ? 'Open Issues Table' : 'Sign In to View Issues'}</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Feature 2 */}
          <div
            className="feature-card"
            onClick={() => handleProtectedNavigation('/admin')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Shield size={24} />
            </div>
            <h3 className="feature-title">Role-Based Access</h3>
            <p className="feature-desc">
              Granular security and tailored interfaces for Administrators, Developers, and Testers to maintain project security and clean accountability.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#c084fc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{isAuthenticated ? 'Admin Governance' : 'Sign In for Access'}</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Feature 3 */}
          <div
            className="feature-card"
            onClick={() => handleProtectedNavigation('/notifications')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
              <Zap size={24} />
            </div>
            <h3 className="feature-title">Real-Time Notifications</h3>
            <p className="feature-desc">
              Stay updated instantly with live WebSocket alerts, unread counter badges, configurable email alerts, and on-screen toast notifications.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#38bdf8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{isAuthenticated ? 'Notification Inbox' : 'Sign In to View Alerts'}</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Feature 4 */}
          <div
            className="feature-card"
            onClick={() => handleProtectedNavigation('/analytics')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <BarChart3 size={24} />
            </div>
            <h3 className="feature-title">Advanced Analytics</h3>
            <p className="feature-desc">
              Monitor defect trends over time, status breakdowns, severity distributions, and individual developer resolution velocities.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{isAuthenticated ? 'Analytics Dashboard' : 'Sign In for Analytics'}</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Feature 5 */}
          <div
            className="feature-card"
            onClick={() => handleProtectedNavigation('/issues')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Paperclip size={24} />
            </div>
            <h3 className="feature-title">File Attachments</h3>
            <p className="feature-desc">
              Upload crash logs, screenshots, and reproduction files (PNG, JPEG, PDF, TXT, CSV) directly to issues with server-side validation.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#fbbf24', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{isAuthenticated ? 'Attach Files to Defects' : 'Sign In to Attach Files'}</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Feature 6 */}
          <div
            className="feature-card"
            onClick={() => handleProtectedNavigation('/projects')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              <FolderGit2 size={24} />
            </div>
            <h3 className="feature-title">Project Management</h3>
            <p className="feature-desc">
              Organize issues cleanly across multiple software projects with custom keys (e.g., PROJ, CORE) and lifecycle deactivation controls.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#f87171', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{isAuthenticated ? 'Manage Projects' : 'Sign In to View Projects'}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- HOW IT WORKS SECTION -------------------- */}
      <section id="how-it-works" className="home-section" style={{ backgroundColor: 'rgba(17, 24, 39, 0.4)', borderRadius: 'var(--radius-lg)' }}>
        <div className="section-header">
          <span className="section-badge">Simple & Streamlined</span>
          <h2 className="section-title">How BugTracker Works</h2>
          <p className="section-subtitle">
            From initial defect discovery to verified production resolution in three structured steps.
          </p>
        </div>

        <div className="steps-grid">
          {/* Step 1 */}
          <div
            className="step-card"
            onClick={isAuthenticated ? () => handleProtectedNavigation('/dashboard') : handleLogin}
            style={{ cursor: 'pointer' }}
          >
            <div className="step-number-badge">1</div>
            <h3 className="step-title">Enter Email & Verify OTP</h3>
            <p className="step-desc">
              Authenticate instantly with passwordless email or Gmail OTP verification to join your organization's defect tracking workspace.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#818cf8', fontWeight: '600' }}>
              {isAuthenticated ? 'Session Active ✓' : 'Sign In with OTP →'}
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="step-card"
            onClick={() => handleProtectedNavigation('/issues')}
            style={{ cursor: 'pointer' }}
          >
            <div className="step-number-badge">2</div>
            <h3 className="step-title">Report & Manage Issues</h3>
            <p className="step-desc">
              Testers log defects with reproduction details and attachments. Administrators triage and assign issues to dedicated developers.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#818cf8', fontWeight: '600' }}>
              {isAuthenticated ? 'Open Issues →' : 'Sign In to Report →'}
            </div>
          </div>

          {/* Step 3 */}
          <div
            className="step-card"
            onClick={() => handleProtectedNavigation('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <div className="step-number-badge">3</div>
            <h3 className="step-title">Track & Resolve Bugs</h3>
            <p className="step-desc">
              Developers transition states (In Dev → In Review → In Testing), submit resolution summaries, and collaborate via threaded comments.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#818cf8', fontWeight: '600' }}>
              {isAuthenticated ? 'Open Dashboard →' : 'Sign In to Resolve →'}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- ROLES SECTION -------------------- */}
      <section id="roles" className="home-section">
        <div className="section-header">
          <span className="section-badge">Role-Based Workspaces</span>
          <h2 className="section-title">Designed for the Entire Engineering Team</h2>
          <p className="section-subtitle">
            Every team member gets a tailored workspace with focused tools and permissions.
          </p>
        </div>

        <div className="roles-grid">
          {/* Admin Role */}
          <div className="role-card admin">
            <div className="role-header-box">
              <div className="user-avatar-circle" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                <Shield size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#c084fc' }}>ADMIN</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System Administrator</span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Full governance over workspace users, projects, and organizational security.
            </p>
            <ul className="role-list">
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Manage Users:</strong> Activate, deactivate accounts and provision system roles</span>
              </li>
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Manage Projects:</strong> Create, update, and deactivate software projects</span>
              </li>
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Global Analytics:</strong> View developer velocity metrics and live system telemetry</span>
              </li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleProtectedNavigation('/admin')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                <span>{isAuthenticated ? 'Admin Console' : 'Sign In as Admin'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Developer Role */}
          <div className="role-card developer">
            <div className="role-header-box">
              <div className="user-avatar-circle" style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
                <Code size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#60a5fa' }}>DEVELOPER</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Software Engineer</span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Focused interface for executing fixes, updating workflows, and providing resolution documentation.
            </p>
            <ul className="role-list">
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Assigned Queue:</strong> View and filter defects assigned directly to you</span>
              </li>
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Status Workflow:</strong> Transition issues (In Development → In Review → In Testing)</span>
              </li>
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Resolve Defects:</strong> Document root causes and solutions with formal summaries</span>
              </li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleProtectedNavigation('/issues')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                <span>{isAuthenticated ? 'Developer Queue' : 'Sign In as Developer'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Tester Role */}
          <div className="role-card tester">
            <div className="role-header-box">
              <div className="user-avatar-circle" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#34d399' }}>TESTER</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>QA Engineer / Tester</span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Tools to accurately report defects, attach reproduction logs, and verify developer fixes.
            </p>
            <ul className="role-list">
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Report Defects:</strong> Submit defects with reproduction steps, environments, & files</span>
              </li>
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Track Lifecycles:</strong> Monitor defect verification progress from submission to close</span>
              </li>
              <li className="role-list-item">
                <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Reopen Issues:</strong> Reopen resolved defects if bug regressions occur</span>
              </li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleProtectedNavigation('/issues')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                <span>{isAuthenticated ? 'Report & Track Defects' : 'Sign In as Tester'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- ANALYTICS PROMOTION SECTION -------------------- */}
      <section id="analytics" className="home-section">
        <div className="analytics-promo-box">
          <div>
            <span className="section-badge">Data-Driven Insights</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem', lineHeight: '1.2' }}>
              Advanced Defect Telemetry & Reporting
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Gain complete visibility into your software quality. Real-time PostgreSQL aggregation queries deliver up-to-the-minute metrics without stale caching.
            </p>

            <ul className="analytics-feature-list">
              <li className="analytics-feature-item">
                <TrendingUp size={18} color="#818cf8" />
                <span>Time-series defect creation vs. resolution trends</span>
              </li>
              <li className="analytics-feature-item">
                <CheckCircle2 size={18} color="#34d399" />
                <span>Severity & status distribution breakdowns</span>
              </li>
              <li className="analytics-feature-item">
                <Users size={18} color="#c084fc" />
                <span>Individual developer turnaround times & resolution rates</span>
              </li>
              <li className="analytics-feature-item">
                <FileSpreadsheet size={18} color="#fbbf24" />
                <span>RFC 4180 compliant CSV reports export for team audits</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => handleProtectedNavigation('/analytics')}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.4rem' }}
            >
              <BarChart3 size={16} />
              <span>{isAuthenticated ? 'Open Analytics Dashboard' : 'Explore Analytics'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div
            className="analytics-visual-card"
            onClick={() => handleProtectedNavigation('/analytics')}
            style={{ cursor: 'pointer' }}
            title={isAuthenticated ? 'Open analytics dashboard' : 'Sign in to access analytics'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Live Defect Trends</span>
              <span className="badge" style={{ backgroundColor: 'var(--primary-subtle)', color: '#818cf8', fontSize: '0.7rem' }}>
                Weekly Interval
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Blocker & Critical</span>
                  <span style={{ color: '#f87171', fontWeight: '600' }}>4 defects (12%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '12%', height: '100%', backgroundColor: '#ef4444' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Major Defects</span>
                  <span style={{ color: '#fbbf24', fontWeight: '600' }}>14 defects (42%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '42%', height: '100%', backgroundColor: '#f59e0b' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Resolved & Closed</span>
                  <span style={{ color: '#34d399', fontWeight: '600' }}>46 defects (88%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '88%', height: '100%', backgroundColor: '#10b981' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Global Project Resolution Rate</span>
              <span style={{ color: '#34d399', fontWeight: '700' }}>91.5%</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- CALL TO ACTION -------------------- */}
      <section className="home-section" style={{ paddingBottom: '100px' }}>
        <div className="cta-box">
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '800', color: '#fff', marginBottom: '0.75rem' }}>
            Ready to Build Better Software?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Get started with BugTracker today. Streamline issue triage, accelerate resolution times, and empower your engineering team.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleLogin}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleLogin}
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="home-footer">
        <div className="footer-container">
          {/* Brand & Description */}
          <div>
            <div className="home-brand" style={{ marginBottom: '0.75rem' }}>
              <div className="brand-logo">
                <Bug size={18} />
              </div>
              <span className="brand-title" style={{ fontSize: '1.1rem' }}>BugTracker</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '320px' }}>
              Intelligent software defect tracking system with resolution assistance, real-time WebSockets, and role-based access control.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('roles')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Roles & Permissions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('analytics')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Analytics Platform
                </button>
              </li>
            </ul>
          </div>

          {/* Access */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Access
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li>
                <button
                  type="button"
                  onClick={handleLogin}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Sign In / Get Started
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Verify Email OTP
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleProtectedNavigation('/dashboard')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  {isAuthenticated ? 'Workspace Dashboard' : 'Workspace (Login Required)'}
                </button>
              </li>
            </ul>
          </div>

          {/* System Info */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Technology
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              FastAPI + PostgreSQL + SQLAlchemy backend with React 19 + TypeScript frontend.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} BugTracker. All rights reserved.</span>
          <span>Intelligent Software Defect Tracking System</span>
        </div>
      </footer>
    </div>
  );
};
