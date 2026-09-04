import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bug,
  CheckCircle2,
  ChevronDown,
  FolderOpen,
  LayoutDashboard,
  LogIn,
  Menu,
  Bell,
  Shield,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
  Activity,
  GitBranch,
  Target,
  FileText,
  Clock,
  CheckSquare,
  Layers,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import './HomePage.css';

/* ─── Intersection Observer Hook ─────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ─── Animated Counter ────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.3);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref as React.Ref<HTMLSpanElement>}>{count}{suffix}</span>;
}

/* ─── Mini resolution chart data ─────────────────────────────────── */
const resolutionData = [
  { d: 'W1', v: 62 }, { d: 'W2', v: 71 }, { d: 'W3', v: 68 },
  { d: 'W4', v: 79 }, { d: 'W5', v: 85 }, { d: 'W6', v: 91 },
  { d: 'W7', v: 88 }, { d: 'W8', v: 95 }, { d: 'W9', v: 98 },
];

/* ─── Burndown mini chart ─────────────────────────────────────────── */
const burndownData = [
  { d: 'D1', ideal: 38, actual: 38 }, { d: 'D2', ideal: 32, actual: 34 },
  { d: 'D3', ideal: 26, actual: 29 }, { d: 'D4', ideal: 20, actual: 22 },
  { d: 'D5', ideal: 14, actual: 18 }, { d: 'D6', ideal: 8, actual: 12 },
  { d: 'D7', ideal: 2, actual: 7 },
];

/* ─── Orbit items ─────────────────────────────────────────────────── */
const orbitItems = [
  { icon: '🐞', label: 'Issues', angle: 0 },
  { icon: '🏃', label: 'Sprints', angle: 51.4 },
  { icon: '📊', label: 'Analytics', angle: 102.8 },
  { icon: '🔔', label: 'Alerts', angle: 154.2 },
  { icon: '📁', label: 'Projects', angle: 205.6 },
  { icon: '👥', label: 'Teams', angle: 257.1 },
  { icon: '📄', label: 'Reports', angle: 308.5 },
];

/* ══════════════════════════════════════════════════════════════════
   HOMEPAGE COMPONENT
══════════════════════════════════════════════════════════════════ */
export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  /* Navbar scroll effect */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* Active section highlight */
  useEffect(() => {
    const sectionIds = ['features', 'workflow', 'analytics', 'sprints'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProtectedNavigation = (path: string) => {
    if (!user || !isAuthenticated) { navigate('/login'); return; }
    navigate(path);
  };

  const handleLogin = () => { setMobileMenuOpen(false); navigate('/login'); };
  const handleRegister = () => { setMobileMenuOpen(false); navigate('/register'); };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin-dashboard';
    if (user.role === 'TESTER' || user.role === 'DEVELOPER') return '/tester-dashboard';
    return '/dashboard';
  };

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'sprints', label: 'Sprints' },
  ];

  return (
    <div className="lp-root">
      {/* ═══════════════════════════════════════
          ANIMATED BACKGROUND
      ═══════════════════════════════════════ */}
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-bg-grid" />
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
        <div className="lp-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="lp-particle" style={{
              left: `${(i * 17 + 7) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
              animationDelay: `${(i * 0.4) % 6}s`,
              animationDuration: `${4 + (i % 4)}s`,
            }} />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════ */}
      <header className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`} role="banner">
        <div className="lp-nav-inner">
          {/* Brand */}
          <button
            type="button"
            className="lp-brand"
            onClick={() => scrollToSection('home')}
            aria-label="BugTracker home"
          >
            <div className="lp-brand-logo" aria-hidden="true">
              <Bug size={18} />
            </div>
            <span className="lp-brand-name">BugTracker</span>
          </button>

          {/* Desktop nav */}
          <nav className="lp-nav-links" aria-label="Main navigation">
            {navLinks.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`lp-nav-link${activeSection === id ? ' lp-nav-link--active' : ''}`}
                onClick={() => scrollToSection(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="lp-nav-actions">
            {isAuthenticated && user ? (
              <button type="button" className="lp-btn lp-btn--primary" onClick={() => navigate(getDashboardPath())}>
                <LayoutDashboard size={15} />
                Dashboard
              </button>
            ) : (
              <>
                <button type="button" className="lp-btn lp-btn--ghost" onClick={handleLogin}>
                  <LogIn size={15} />
                  Sign In
                </button>
                <button type="button" className="lp-btn lp-btn--primary" onClick={handleRegister}>
                  Get Started
                  <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="lp-hamburger"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lp-mobile-menu" role="navigation" aria-label="Mobile navigation">
            {navLinks.map(({ id, label }) => (
              <button key={id} type="button" className="lp-mobile-link" onClick={() => scrollToSection(id)}>
                {label}
              </button>
            ))}
            <div className="lp-mobile-divider" />
            <button type="button" className="lp-mobile-link" onClick={handleLogin}>Sign In</button>
            <button type="button" className="lp-mobile-link lp-mobile-link--primary" onClick={handleRegister}>
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="lp-hero" aria-label="Hero">
        {/* Left */}
        <div className="lp-hero-left">
          <div className="lp-hero-badge">
            <Zap size={12} aria-hidden="true" />
            <span>INTELLIGENT SOFTWARE MANAGEMENT</span>
          </div>

          <h1 className="lp-hero-title">
            Track Bugs.<br />
            <span className="lp-gradient-text">Ship Better</span><br />
            Software.
          </h1>

          <p className="lp-hero-subtitle">
            BugTracker brings issues, projects, Agile sprints, analytics, and
            real-time collaboration into one powerful workspace.
          </p>

          <div className="lp-hero-cta">
            <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={handleRegister}>
              Get Started
              <ArrowRight size={18} />
            </button>
            <button type="button" className="lp-btn lp-btn--outline lp-btn--lg" onClick={() => scrollToSection('features')}>
              Explore Features
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="lp-hero-trust">
            <div className="lp-trust-item"><CheckCircle2 size={14} aria-hidden="true" /><span>Agile Sprint Planning</span></div>
            <div className="lp-trust-item"><CheckCircle2 size={14} aria-hidden="true" /><span>Real-Time Analytics</span></div>
            <div className="lp-trust-item"><CheckCircle2 size={14} aria-hidden="true" /><span>Role-Based Workflows</span></div>
          </div>
        </div>

        {/* Right — 3D floating dashboard cards */}
        <div className="lp-hero-visual" aria-hidden="true">
          <div className="lp-3d-scene">
            {/* Sprint card */}
            <div className="lp-float-card lp-float-card--sprint">
              <div className="lp-fc-header">
                <Activity size={13} />
                <span>Sprint Alpha</span>
                <span className="lp-fc-tag lp-fc-tag--green">ON TRACK</span>
              </div>
              <div className="lp-fc-label">Sprint Progress</div>
              <div className="lp-fc-progress-wrap">
                <div className="lp-fc-progress-bar">
                  <div className="lp-fc-progress-fill" style={{ width: '72%' }} />
                </div>
                <span className="lp-fc-prog-val">72%</span>
              </div>
              <div className="lp-fc-row">
                <span className="lp-fc-sub">17 / 24 issues done</span>
              </div>
            </div>

            {/* Issue card */}
            <div className="lp-float-card lp-float-card--issue">
              <div className="lp-fc-header">
                <Bug size={13} />
                <span className="lp-fc-mono">BUG-1024</span>
                <span className="lp-fc-tag lp-fc-tag--red">CRITICAL</span>
              </div>
              <div className="lp-fc-issue-title">Auth token refresh loop</div>
              <div className="lp-fc-row">
                <div className="lp-fc-avatar">AK</div>
                <span className="lp-fc-sub">Assigned to Ajay K.</span>
              </div>
            </div>

            {/* Analytics card */}
            <div className="lp-float-card lp-float-card--analytics">
              <div className="lp-fc-header">
                <TrendingUp size={13} />
                <span>Resolution Rate</span>
              </div>
              <div className="lp-fc-big-num">+24%</div>
              <div className="lp-fc-sparkline">
                <ResponsiveContainer width="100%" height={36}>
                  <LineChart data={resolutionData}>
                    <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Tooltip contentStyle={{ display: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Notification card */}
            <div className="lp-float-card lp-float-card--notify">
              <div className="lp-fc-header">
                <Bell size={13} />
                <span>Notification</span>
              </div>
              <div className="lp-fc-notify-msg">
                <CheckCircle2 size={14} className="lp-fc-notify-icon" />
                Sprint completed successfully!
              </div>
            </div>

            {/* Glow orb */}
            <div className="lp-scene-glow" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════ */}
      <section id="features" className="lp-section" aria-labelledby="features-title">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <div className="lp-section-badge"><Layers size={12} aria-hidden="true" />Features</div>
            <h2 id="features-title" className="lp-section-title">
              Everything Your Engineering<br />Team Needs
            </h2>
            <p className="lp-section-sub">
              From bug reporting to sprint delivery, manage the complete software
              development lifecycle.
            </p>
          </div>

          <div className="lp-features-grid">
            {[
              {
                emoji: '🐞', icon: <Bug size={20} />, accent: '#6366f1',
                title: 'Intelligent Issue Tracking',
                desc: 'Track bugs, tasks, and feature requests with powerful filtering, priority management, and severity classification.',
                action: () => handleProtectedNavigation('/issues'),
              },
              {
                emoji: '🏃', icon: <GitBranch size={20} />, accent: '#22c55e',
                title: 'Agile Sprint Management',
                desc: 'Plan sprints, assign backlog issues, track progress, manage capacity, and safely roll over unfinished work.',
                action: () => handleProtectedNavigation('/projects'),
              },
              {
                emoji: '📊', icon: <BarChart3 size={20} />, accent: '#a855f7',
                title: 'Real-Time Analytics',
                desc: 'Monitor issue trends, resolution performance, developer workload, sprint health, and project progress.',
                action: () => handleProtectedNavigation('/analytics'),
              },
              {
                emoji: '📉', icon: <Activity size={20} />, accent: '#0ea5e9',
                title: 'Burndown Tracking',
                desc: 'Visualize sprint progress with ideal versus actual burndown data to keep delivery on schedule.',
                action: () => scrollToSection('sprints'),
              },
              {
                emoji: '🔔', icon: <Bell size={20} />, accent: '#f59e0b',
                title: 'Real-Time Notifications',
                desc: 'Stay informed about important issue and sprint activities through live notifications.',
                action: () => handleProtectedNavigation('/notifications'),
              },
              {
                emoji: '🔐', icon: <ShieldCheck size={20} />, accent: '#ef4444',
                title: 'Role-Based Access',
                desc: 'Secure workflows with dedicated permissions for Admins, Developers, Testers, and Users.',
                action: () => scrollToSection('why'),
              },
            ].map(({ emoji, icon, accent, title, desc, action }) => (
              <FeatureCard key={title} emoji={emoji} icon={icon} accent={accent} title={title} desc={desc} onClick={action} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WORKFLOW
      ═══════════════════════════════════════ */}
      <section id="workflow" className="lp-section lp-section--alt" aria-labelledby="workflow-title">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <div className="lp-section-badge"><GitBranch size={12} aria-hidden="true" />Workflow</div>
            <h2 id="workflow-title" className="lp-section-title">From Backlog to Release</h2>
            <p className="lp-section-sub">A structured path from planning to deployment, every sprint.</p>
          </div>

          <WorkflowTimeline />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SPRINT SHOWCASE
      ═══════════════════════════════════════ */}
      <section id="sprints" className="lp-section" aria-labelledby="sprints-title">
        <div className="lp-section-inner">
          <SprintShowcase onNavigate={() => handleProtectedNavigation('/projects')} />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ANALYTICS SHOWCASE
      ═══════════════════════════════════════ */}
      <section id="analytics" className="lp-section lp-section--alt" aria-labelledby="analytics-title">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <div className="lp-section-badge"><BarChart3 size={12} aria-hidden="true" />Analytics</div>
            <h2 id="analytics-title" className="lp-section-title">See Everything, Fix Faster</h2>
            <p className="lp-section-sub">
              Sample data shown for demonstration. Your real metrics will appear after sign-in.
            </p>
          </div>

          <div className="lp-analytics-grid">
            {/* Counter stats */}
            <div className="lp-analytics-stats">
              {[
                { target: 98, suffix: '%', label: 'Resolution Rate', accent: '#6366f1', icon: <TrendingUp size={18} /> },
                { target: 24, suffix: '', label: 'Active Issues', accent: '#22c55e', icon: <Bug size={18} /> },
                { target: 12, suffix: '', label: 'Projects', accent: '#a855f7', icon: <FolderOpen size={18} /> },
                { target: 86, suffix: '%', label: 'Sprint Completion', accent: '#0ea5e9', icon: <Target size={18} /> },
              ].map(({ target, suffix, label, accent, icon }) => (
                <div key={label} className="lp-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
                  <div className="lp-stat-icon" style={{ color: accent }}>{icon}</div>
                  <div className="lp-stat-num" style={{ color: accent }}>
                    <AnimatedCounter target={target} suffix={suffix} />
                  </div>
                  <div className="lp-stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="lp-analytics-chart-card">
              <div className="lp-chart-header">
                <span className="lp-chart-title">Resolution Rate Trend</span>
                <span className="lp-chart-demo-tag">DEMO DATA</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={resolutionData}>
                  <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v: number) => [`${v}%`, 'Rate']}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="lp-chart-footer">Weekly resolution rate across all projects (sample data)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ORBIT SECTION
      ═══════════════════════════════════════ */}
      <section className="lp-section lp-orbit-section" aria-label="BugTracker capabilities orbit">
        <div className="lp-section-inner lp-orbit-inner">
          <div className="lp-section-head">
            <div className="lp-section-badge"><Zap size={12} aria-hidden="true" />Platform</div>
            <h2 className="lp-section-title">One Platform, Every Capability</h2>
          </div>
          <div className="lp-orbit-wrapper" aria-hidden="true">
            {/* Center */}
            <div className="lp-orbit-center">
              <div className="lp-orbit-logo">
                <Bug size={30} />
              </div>
              <span className="lp-orbit-center-label">BugTracker</span>
            </div>

            {/* Orbit ring */}
            <div className="lp-orbit-ring lp-orbit-ring-1">
              {orbitItems.map(({ icon, label, angle }) => (
                <div
                  key={label}
                  className="lp-orbit-item"
                  style={{ '--angle': `${angle}deg` } as React.CSSProperties}
                >
                  <div className="lp-orbit-item-inner">
                    <span className="lp-orbit-item-emoji">{icon}</span>
                    <span className="lp-orbit-item-label">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHY BUGTRACKER
      ═══════════════════════════════════════ */}
      <section id="why" className="lp-section lp-section--alt" aria-labelledby="why-title">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <div className="lp-section-badge"><Shield size={12} aria-hidden="true" />Why BugTracker</div>
            <h2 id="why-title" className="lp-section-title">Built for Modern Software Teams</h2>
          </div>
          <div className="lp-why-grid">
            {[
              {
                icon: <Layers size={28} />, accent: '#6366f1',
                heading: 'One Platform',
                body: 'Manage projects, issues, sprints, analytics, and collaboration in one unified workspace. No context switching.',
              },
              {
                icon: <Activity size={28} />, accent: '#22c55e',
                heading: 'Real-Time Visibility',
                body: 'Understand exactly what your team is building and where work is getting blocked with live dashboards.',
              },
              {
                icon: <Target size={28} />, accent: '#a855f7',
                heading: 'Smarter Delivery',
                body: 'Use sprint health, workload analysis, and analytics to continuously improve team delivery performance.',
              },
            ].map(({ icon, accent, heading, body }) => (
              <div key={heading} className="lp-why-card" style={{ '--accent': accent } as React.CSSProperties}>
                <div className="lp-why-icon" style={{ color: accent, background: `${accent}18` }}>{icon}</div>
                <h3 className="lp-why-heading">{heading}</h3>
                <p className="lp-why-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════ */}
      <section className="lp-cta-section" aria-labelledby="cta-title">
        <div className="lp-cta-bg-glow" aria-hidden="true" />
        <div className="lp-cta-inner">
          <div className="lp-cta-badge"><Zap size={12} aria-hidden="true" />Ready when you are</div>
          <h2 id="cta-title" className="lp-cta-title">
            Ready to Build Better<br />
            <span className="lp-gradient-text">Software?</span>
          </h2>
          <p className="lp-cta-body">
            Bring your team, projects, issues, and sprints together in one intelligent workspace.
          </p>
          <div className="lp-cta-actions">
            <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={handleRegister}>
              Get Started Free
              <ArrowRight size={18} />
            </button>
            <button type="button" className="lp-btn lp-btn--outline lp-btn--lg" onClick={() => handleProtectedNavigation('/dashboard')}>
              <LayoutDashboard size={18} />
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand-col">
            <div className="lp-brand lp-footer-brand">
              <div className="lp-brand-logo" aria-hidden="true"><Bug size={16} /></div>
              <span className="lp-brand-name">BugTracker</span>
            </div>
            <p className="lp-footer-tagline">
              Intelligent bug tracking and agile sprint management for modern engineering teams.
            </p>
          </div>

          <div className="lp-footer-links-col">
            <div className="lp-footer-group">
              <div className="lp-footer-group-title">Product</div>
              <button type="button" className="lp-footer-link" onClick={() => scrollToSection('features')}>Features</button>
              <button type="button" className="lp-footer-link" onClick={() => handleProtectedNavigation('/issues')}>Issues</button>
              <button type="button" className="lp-footer-link" onClick={() => scrollToSection('sprints')}>Sprints</button>
              <button type="button" className="lp-footer-link" onClick={() => scrollToSection('analytics')}>Analytics</button>
            </div>

            <div className="lp-footer-group">
              <div className="lp-footer-group-title">Platform</div>
              <button type="button" className="lp-footer-link" onClick={() => handleProtectedNavigation('/projects')}>Projects</button>
              <button type="button" className="lp-footer-link" onClick={() => handleProtectedNavigation('/notifications')}>Notifications</button>
              <button type="button" className="lp-footer-link" onClick={() => handleProtectedNavigation('/analytics')}>Reports</button>
              <button type="button" className="lp-footer-link" onClick={() => scrollToSection('why')}>Security</button>
            </div>

            <div className="lp-footer-group">
              <div className="lp-footer-group-title">Resources</div>
              <button type="button" className="lp-footer-link" onClick={handleLogin}>Documentation</button>
              <button type="button" className="lp-footer-link" onClick={handleLogin}>API Docs</button>
              <button type="button" className="lp-footer-link" onClick={handleLogin}>GitHub</button>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} BugTracker. All rights reserved.</span>
          <div className="lp-footer-bottom-links">
            <button type="button" className="lp-footer-link" onClick={handleLogin}>Privacy</button>
            <button type="button" className="lp-footer-link" onClick={handleLogin}>Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Feature Card Sub-component ─────────────────────────────────── */
interface FeatureCardProps {
  emoji: string;
  icon: React.ReactNode;
  accent: string;
  title: string;
  desc: string;
  onClick: () => void;
}
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, accent, title, desc, onClick }) => {
  const { ref, inView } = useInView(0.1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 10;
    setTilt({ x, y });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      className={`lp-feature-card${inView ? ' lp-feature-card--visible' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--accent': accent,
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      } as React.CSSProperties}
    >
      <div className="lp-feature-icon-wrap" style={{ color: accent, background: `${accent}18` }}>
        {icon}
      </div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{desc}</p>
      <div className="lp-feature-arrow" style={{ color: accent }}>
        <ArrowRight size={15} aria-hidden="true" />
      </div>
    </button>
  );
};

/* ─── Workflow Timeline Sub-component ────────────────────────────── */
const workflowSteps = [
  { icon: <CheckSquare size={18} />, label: 'BACKLOG', desc: 'All issues and feature requests collected and prioritized', accent: '#6366f1' },
  { icon: <Layers size={18} />, label: 'SPRINT PLANNING', desc: 'Team selects backlog items, estimates effort, assigns capacity', accent: '#8b5cf6' },
  { icon: <Activity size={18} />, label: 'ACTIVE SPRINT', desc: 'Developers and testers work through sprint issues in real-time', accent: '#a855f7' },
  { icon: <Bug size={18} />, label: 'ISSUE RESOLUTION', desc: 'Bugs investigated, fixed, reviewed, and marked resolved', accent: '#22c55e' },
  { icon: <BarChart3 size={18} />, label: 'ANALYTICS', desc: 'Sprint velocity, burndown, and resolution metrics reviewed', accent: '#0ea5e9' },
  { icon: <FileText size={18} />, label: 'RELEASE', desc: 'Sprint closed, report generated, next sprint begins', accent: '#f59e0b' },
];

const WorkflowTimeline: React.FC = () => {
  const { ref, inView } = useInView(0.1);
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className="lp-workflow">
      {workflowSteps.map(({ icon, label, desc, accent }, i) => (
        <div
          key={label}
          className={`lp-wf-item${inView ? ' lp-wf-item--visible' : ''}`}
          style={{ transitionDelay: inView ? `${i * 0.1}s` : '0s' }}
        >
          <div className="lp-wf-icon" style={{ color: accent, background: `${accent}18`, border: `1.5px solid ${accent}40` }}>
            {icon}
          </div>
          {i < workflowSteps.length - 1 && (
            <div className={`lp-wf-connector${inView ? ' lp-wf-connector--animated' : ''}`}
              style={{ '--delay': `${i * 0.12 + 0.3}s` } as React.CSSProperties} aria-hidden="true" />
          )}
          <div className="lp-wf-content">
            <div className="lp-wf-label" style={{ color: accent }}>{label}</div>
            <p className="lp-wf-desc">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Sprint Showcase Sub-component ──────────────────────────────── */
interface SprintShowcaseProps { onNavigate: () => void; }
const SprintShowcase: React.FC<SprintShowcaseProps> = ({ onNavigate }) => {
  const { ref, inView } = useInView(0.15);
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={`lp-sprint-showcase${inView ? ' lp-sprint-showcase--visible' : ''}`}
    >
      {/* Left: Sprint UI preview */}
      <div className="lp-sprint-preview">
        <div className="lp-sp-header">
          <div className="lp-sp-dots" aria-hidden="true">
            <span style={{ background: '#ef4444' }} />
            <span style={{ background: '#f97316' }} />
            <span style={{ background: '#22c55e' }} />
          </div>
          <span className="lp-sp-url">BugTracker · Sprint Dashboard</span>
        </div>

        <div className="lp-sp-body">
          <div className="lp-sp-title-row">
            <span className="lp-sp-sprint-name">Sprint Alpha</span>
            <span className="lp-sp-health"><span className="lp-sp-dot" />ON TRACK</span>
          </div>

          <div className="lp-sp-progress-wrap">
            <div className="lp-sp-prog-bar">
              <div className="lp-sp-prog-fill" style={{ width: '72%' }} />
            </div>
            <span className="lp-sp-prog-val">72%</span>
          </div>

          <div className="lp-sp-stats-grid">
            <div className="lp-sp-stat"><span className="lp-sp-stat-val">24</span><span className="lp-sp-stat-l">Total</span></div>
            <div className="lp-sp-stat"><span className="lp-sp-stat-val lp-sp-stat-green">17</span><span className="lp-sp-stat-l">Done</span></div>
            <div className="lp-sp-stat"><span className="lp-sp-stat-val lp-sp-stat-orange">7</span><span className="lp-sp-stat-l">Left</span></div>
            <div className="lp-sp-stat"><span className="lp-sp-stat-val">240h</span><span className="lp-sp-stat-l">Capacity</span></div>
          </div>

          {/* Mini burndown */}
          <div className="lp-sp-chart-label">
            <Activity size={11} aria-hidden="true" />
            Burndown Chart
            <span className="lp-chart-demo-tag">DEMO</span>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={burndownData}>
              <Line type="monotone" dataKey="ideal" stroke="#334155" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number, name: string) => [`${v} pts`, name]}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="lp-sp-legend">
            <span><span className="lp-sp-legend-dot" style={{ background: '#334155' }} />Ideal</span>
            <span><span className="lp-sp-legend-dot" style={{ background: '#6366f1' }} />Actual</span>
          </div>
        </div>
      </div>

      {/* Right: copy */}
      <div className="lp-sprint-copy">
        <div className="lp-section-badge" style={{ marginBottom: '1.25rem' }}>
          <Clock size={12} aria-hidden="true" />Sprints
        </div>
        <h2 id="sprints-title" className="lp-section-title" style={{ textAlign: 'left' }}>
          Plan Smarter.<br />
          <span className="lp-gradient-text">Deliver Faster.</span>
        </h2>
        <p className="lp-sprint-copy-body">
          BugTracker's sprint management gives your team complete visibility into every iteration — from planning to retrospective.
        </p>
        <ul className="lp-sprint-features">
          {[
            'Sprint planning with capacity tracking',
            'Backlog assignment and issue ordering',
            'Real-time sprint health indicators',
            'Ideal vs. actual burndown analytics',
            'Safe issue rollover between sprints',
            'PDF sprint reports for stakeholders',
          ].map((f) => (
            <li key={f}>
              <CheckCircle2 size={15} aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={onNavigate}>
          Explore Sprint Management
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
};

export default HomePage;
