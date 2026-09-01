import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bug,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  LogIn,
  Menu,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
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
   * Unauthenticated users → /login
   * Authenticated users → destination
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

  const handleRegister = () => {
    setMobileMenuOpen(false);
    navigate('/register');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin-dashboard';
    if (user.role === 'TESTER' || user.role === 'DEVELOPER') return '/tester-dashboard';
    return '/dashboard';
  };

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return (
    <div className="home-page">
      {/* ===== NAVBAR ===== */}
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

          {/* Desktop Nav Links */}
          <nav className="home-nav-links">
            <button type="button" onClick={() => scrollToSection('features')} className="home-nav-link">
              Features
            </button>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="home-nav-link">
              How it Works
            </button>
            <button type="button" onClick={() => scrollToSection('roles')} className="home-nav-link">
              Roles
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => handleProtectedNavigation('/dashboard')}
                className="home-nav-link"
              >
                Dashboard
              </button>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="home-nav-actions">
            {isAuthenticated && user ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hi, {user.full_name.split(' ')[0]}
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(getDashboardPath())}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogin}>
                  <LogIn size={14} />
                  Sign In
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleRegister}>
                  Get Started
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="home-mobile-menu-btn"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="home-mobile-menu">
            <button type="button" onClick={() => scrollToSection('features')} className="home-mobile-link">
              Features
            </button>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="home-mobile-link">
              How it Works
            </button>
            <button type="button" onClick={() => scrollToSection('roles')} className="home-mobile-link">
              Roles
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                className="home-mobile-link"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button type="button" onClick={handleLogin} className="home-mobile-link">
                  Sign In
                </button>
                <button type="button" onClick={handleRegister} className="home-mobile-link home-mobile-link-primary">
                  Create Account
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="home-hero">
        <div className="home-hero-badge">
          <Zap size={13} />
          <span>Professional Bug Tracking System</span>
        </div>

        <h1 className="home-hero-title">
          Track, Manage &amp;
          <br />
          <span className="home-hero-highlight">Resolve Defects</span>
          <br />
          With Your Team
        </h1>

        <p className="home-hero-subtitle">
          BugTracker streamlines the entire defect lifecycle — from issue submission to
          resolution. Empowering teams with real-time tracking, smart assignment, and
          clear role-based workflows.
        </p>

        <div className="home-hero-cta">
          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn-primary home-cta-primary"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={18} />
              Go to Dashboard
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary home-cta-primary"
                onClick={handleRegister}
              >
                Create Free Account
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="btn btn-secondary home-cta-secondary"
                onClick={handleLogin}
              >
                <LogIn size={16} />
                Sign In
              </button>
            </>
          )}
        </div>

        <div className="home-hero-stats">
          {[
            { value: '3', label: 'Role Types' },
            { value: '100%', label: 'Real Data' },
            { value: 'Live', label: 'Updates' },
          ].map(({ value, label }) => (
            <div key={label} className="home-hero-stat">
              <div className="home-hero-stat-value">{value}</div>
              <div className="home-hero-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="home-section">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-badge">
              <Star size={13} />
              Features
            </div>
            <h2 className="home-section-title">Everything You Need to Track Defects</h2>
            <p className="home-section-subtitle">
              A complete defect management platform with powerful tools for every team member.
            </p>
          </div>

          <div className="home-features-grid">
            {[
              {
                icon: <Bug size={22} />,
                color: 'var(--primary)',
                bg: 'rgba(99,102,241,0.15)',
                title: 'Issue Reporting',
                desc: 'Report defects with full details — severity, priority, environment, steps to reproduce, and attachments.',
                action: () => handleProtectedNavigation('/issues'),
              },
              {
                icon: <FolderOpen size={22} />,
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.15)',
                title: 'Project Management',
                desc: 'Organize issues by project. Create projects, manage their lifecycle, and track all related defects.',
                action: () => handleProtectedNavigation('/projects'),
              },
              {
                icon: <Shield size={22} />,
                color: '#f97316',
                bg: 'rgba(249,115,22,0.15)',
                title: 'Role-Based Access',
                desc: 'Three distinct roles — Admin, Tester, and User — each with appropriate permissions and views.',
                action: () => scrollToSection('roles'),
              },
              {
                icon: <BarChart3 size={22} />,
                color: '#a855f7',
                bg: 'rgba(168,85,247,0.15)',
                title: 'Analytics & Reports',
                desc: 'Real-time dashboards with issue trends, severity distribution, status breakdowns, and CSV export.',
                action: () => handleProtectedNavigation('/analytics'),
              },
              {
                icon: <MessageSquare size={22} />,
                color: '#06b6d4',
                bg: 'rgba(6,182,212,0.15)',
                title: 'Comments & Notes',
                desc: 'Collaborate directly on issues with threaded comments, audit history, and update notifications.',
                action: () => handleProtectedNavigation('/issues'),
              },
              {
                icon: <TrendingUp size={22} />,
                color: '#eab308',
                bg: 'rgba(234,179,8,0.15)',
                title: 'Live Notifications',
                desc: 'WebSocket-powered real-time alerts when issues are assigned, updated, or resolved.',
                action: () => handleProtectedNavigation('/notifications'),
              },
            ].map(({ icon, color, bg, title, desc, action }) => (
              <button
                key={title}
                type="button"
                className="home-feature-card"
                onClick={action}
              >
                <div
                  className="home-feature-icon"
                  style={{ background: bg, color }}
                >
                  {icon}
                </div>
                <h3 className="home-feature-title">{title}</h3>
                <p className="home-feature-desc">{desc}</p>
                <div className="home-feature-arrow" style={{ color }}>
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="home-section home-section-alt">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-badge">
              <ClipboardList size={13} />
              Workflow
            </div>
            <h2 className="home-section-title">How BugTracker Works</h2>
            <p className="home-section-subtitle">
              A clear, structured workflow from issue submission to final resolution.
            </p>
          </div>

          <div className="home-workflow">
            {[
              {
                step: '01',
                color: 'var(--primary)',
                bg: 'rgba(99,102,241,0.12)',
                icon: <User size={20} />,
                who: 'User',
                title: 'Submit an Issue',
                desc: 'A team member encounters a problem and submits a detailed bug report — including severity, priority, environment info, and steps to reproduce.',
              },
              {
                step: '02',
                color: '#f97316',
                bg: 'rgba(249,115,22,0.12)',
                icon: <Shield size={20} />,
                who: 'Admin',
                title: 'Review & Assign',
                desc: 'The Admin reviews incoming issues, prioritizes them, and assigns each one to a qualified Tester for investigation.',
              },
              {
                step: '03',
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.12)',
                icon: <Search size={20} />,
                who: 'Tester',
                title: 'Investigate & Update',
                desc: 'The assigned Tester investigates the defect, updates the status (In Progress → In Review), and provides a detailed resolution summary.',
              },
              {
                step: '04',
                color: '#a855f7',
                bg: 'rgba(168,85,247,0.12)',
                icon: <ShieldCheck size={20} />,
                who: 'Admin',
                title: 'Review Resolution',
                desc: 'Admin reviews the Tester\'s findings and resolution, validates the fix, and confirms or escalates as needed.',
              },
              {
                step: '05',
                color: '#06b6d4',
                bg: 'rgba(6,182,212,0.12)',
                icon: <CheckCircle2 size={20} />,
                who: 'User',
                title: 'See Final Status',
                desc: 'The original reporter sees the resolved status, resolution summary, and can reopen the issue if the problem persists.',
              },
            ].map(({ step, color, bg, icon, who, title, desc }, idx, arr) => (
              <div key={step} className="home-workflow-item">
                <div className="home-workflow-step">
                  <div
                    className="home-workflow-icon"
                    style={{ background: bg, color, border: `1.5px solid ${color}30` }}
                  >
                    {icon}
                  </div>
                  <div className="home-workflow-step-num" style={{ color }}>
                    {step}
                  </div>
                </div>
                <div className="home-workflow-content">
                  <div className="home-workflow-who" style={{ color, background: bg }}>
                    {who}
                  </div>
                  <h3 className="home-workflow-title">{title}</h3>
                  <p className="home-workflow-desc">{desc}</p>
                </div>
                {idx < arr.length - 1 && <div className="home-workflow-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}
      <section id="roles" className="home-section">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-badge">
              <Users size={13} />
              Roles
            </div>
            <h2 className="home-section-title">Three Roles, One Workflow</h2>
            <p className="home-section-subtitle">
              Every team member has a clear, focused role in the defect resolution process.
            </p>
          </div>

          <div className="home-roles-grid">
            {/* USER */}
            <div className="home-role-card">
              <div
                className="home-role-icon-wrap"
                style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)' }}
              >
                <User size={26} />
              </div>
              <h3 className="home-role-title">User</h3>
              <p className="home-role-subtitle">Issue Reporter</p>
              <ul className="home-role-features">
                <li><CheckCircle2 size={14} /> Submit detailed bug reports</li>
                <li><CheckCircle2 size={14} /> Track issue status in real time</li>
                <li><CheckCircle2 size={14} /> Add comments and attachments</li>
                <li><CheckCircle2 size={14} /> Reopen resolved issues</li>
                <li><CheckCircle2 size={14} /> Receive status notifications</li>
              </ul>
              {!isAuthenticated && (
                <button
                  type="button"
                  className="btn btn-primary home-role-btn"
                  onClick={handleRegister}
                >
                  Register as User
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* ADMIN */}
            <div className="home-role-card home-role-card-featured">
              <div className="home-role-badge-top">Control Center</div>
              <div
                className="home-role-icon-wrap"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
              >
                <Shield size={26} />
              </div>
              <h3 className="home-role-title">Admin</h3>
              <p className="home-role-subtitle">System Administrator</p>
              <ul className="home-role-features">
                <li><CheckCircle2 size={14} /> Full system visibility</li>
                <li><CheckCircle2 size={14} /> Review and triage all issues</li>
                <li><CheckCircle2 size={14} /> Assign issues to Testers</li>
                <li><CheckCircle2 size={14} /> Monitor team performance</li>
                <li><CheckCircle2 size={14} /> Access analytics &amp; reports</li>
                <li><CheckCircle2 size={14} /> Manage projects &amp; users</li>
              </ul>
              {!isAuthenticated && (
                <button
                  type="button"
                  className="btn btn-secondary home-role-btn"
                  onClick={handleLogin}
                >
                  Admin Sign In
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* TESTER */}
            <div className="home-role-card">
              <div
                className="home-role-icon-wrap"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                <ShieldCheck size={26} />
              </div>
              <h3 className="home-role-title">Tester</h3>
              <p className="home-role-subtitle">Issue Investigator</p>
              <ul className="home-role-features">
                <li><CheckCircle2 size={14} /> Receive assigned issues</li>
                <li><CheckCircle2 size={14} /> Investigate and reproduce bugs</li>
                <li><CheckCircle2 size={14} /> Update investigation progress</li>
                <li><CheckCircle2 size={14} /> Resolve or escalate issues</li>
                <li><CheckCircle2 size={14} /> Provide resolution summaries</li>
              </ul>
              {!isAuthenticated && (
                <button
                  type="button"
                  className="btn btn-primary home-role-btn"
                  style={{ background: '#22c55e', borderColor: '#22c55e' }}
                  onClick={handleRegister}
                >
                  Register as Tester
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATIC DASHBOARD PREVIEW ===== */}
      <section className="home-section home-section-alt">
        <div className="home-section-inner">
          <div className="home-section-header">
            <h2 className="home-section-title">Powerful Dashboard Interface</h2>
            <p className="home-section-subtitle">
              A clean, data-rich interface built for every role in your team.
            </p>
          </div>

          {/* Static visual preview — no real data loaded */}
          <div className="home-dashboard-preview">
            <div className="home-preview-topbar">
              <div className="home-preview-dots">
                <span style={{ background: '#ef4444' }} />
                <span style={{ background: '#f97316' }} />
                <span style={{ background: '#22c55e' }} />
              </div>
              <div className="home-preview-url">BugTracker · Dashboard</div>
            </div>
            <div className="home-preview-body">
              {/* Sidebar */}
              <div className="home-preview-sidebar">
                <div className="home-preview-brand">
                  <Bug size={16} />
                  <span>BugTracker</span>
                </div>
                {[
                  { icon: <LayoutDashboard size={13} />, label: 'Dashboard', active: true },
                  { icon: <Bug size={13} />, label: 'Issues' },
                  { icon: <FolderOpen size={13} />, label: 'Projects' },
                  { icon: <BarChart3 size={13} />, label: 'Analytics' },
                ].map(({ icon, label, active }) => (
                  <div
                    key={label}
                    className={`home-preview-nav-item ${active ? 'active' : ''}`}
                  >
                    {icon}
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="home-preview-main">
                {/* Stats row */}
                <div className="home-preview-stats">
                  {[
                    { label: 'Total Issues', value: '—', color: '#6366f1' },
                    { label: 'In Progress', value: '—', color: '#f97316' },
                    { label: 'Resolved', value: '—', color: '#22c55e' },
                    { label: 'Critical', value: '—', color: '#ef4444' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="home-preview-stat-card">
                      <div className="home-preview-stat-val" style={{ color }}>
                        {value}
                      </div>
                      <div className="home-preview-stat-label">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="home-preview-chart-row">
                  <div className="home-preview-chart">
                    <div className="home-preview-chart-title">Issue Trends</div>
                    <div className="home-preview-chart-bars">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                        <div
                          key={i}
                          className="home-preview-bar"
                          style={{ height: `${h}%`, opacity: 0.6 + i * 0.03 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="home-preview-list">
                    <div className="home-preview-list-title">Recent Issues</div>
                    {['Critical login bug', 'UI alignment issue', 'API timeout error', 'Auth token refresh'].map((title) => (
                      <div key={title} className="home-preview-list-item">
                        <div className="home-preview-list-dot" />
                        <span>{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sign-in overlay for unauthenticated */}
            {!isAuthenticated && (
              <div className="home-preview-overlay">
                <div className="home-preview-overlay-card">
                  <Bug size={28} style={{ color: 'var(--primary)' }} />
                  <p style={{ fontWeight: '600', margin: '0.5rem 0 0.25rem' }}>
                    Sign in to access your dashboard
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Real data from your workspace
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleLogin}
                    style={{ marginTop: '0.75rem' }}
                  >
                    <LogIn size={14} />
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="home-cta-section">
        <div className="home-cta-inner">
          <div className="home-cta-icon">
            <Bug size={32} />
          </div>
          <h2 className="home-cta-title">
            {isAuthenticated
              ? `Welcome back, ${user?.full_name.split(' ')[0]}!`
              : 'Ready to Start Tracking?'}
          </h2>
          <p className="home-cta-desc">
            {isAuthenticated
              ? 'Your workspace is ready. Jump back into your defect dashboard.'
              : 'Join your team on BugTracker today. No mock data — real workflows, real results.'}
          </p>
          <div className="home-cta-buttons">
            {isAuthenticated ? (
              <button
                type="button"
                className="btn home-cta-btn"
                onClick={() => navigate('/dashboard')}
              >
                <LayoutDashboard size={18} />
                Open Dashboard
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn home-cta-btn"
                  onClick={handleRegister}
                >
                  Create Free Account
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  className="btn home-cta-btn-outline"
                  onClick={handleLogin}
                >
                  <LogIn size={16} />
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <div className="brand-logo" style={{ width: '28px', height: '28px' }}>
              <Bug size={16} />
            </div>
            <span className="brand-title" style={{ fontSize: '0.95rem' }}>BugTracker</span>
          </div>
          <div className="home-footer-links">
            <button type="button" className="home-footer-link" onClick={() => scrollToSection('features')}>
              Features
            </button>
            <button type="button" className="home-footer-link" onClick={() => scrollToSection('how-it-works')}>
              Workflow
            </button>
            <button type="button" className="home-footer-link" onClick={() => scrollToSection('roles')}>
              Roles
            </button>
            <button type="button" className="home-footer-link" onClick={handleLogin}>
              Sign In
            </button>
            <button type="button" className="home-footer-link" onClick={handleRegister}>
              Register
            </button>
          </div>
          <div className="home-footer-copy">
            &copy; {new Date().getFullYear()} BugTracker. Professional defect management.
          </div>
        </div>
      </footer>
    </div>
  );
};
