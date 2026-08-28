import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bug,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Bell,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-logo">
            <Bug size={20} />
          </div>
          <span className="brand-title">BugTracker</span>
        </div>

        {/* User Card */}
        {user && (
          <div className="sidebar-user-card">
            <div className="user-avatar-circle">{getInitials(user.full_name)}</div>
            <div className="user-info-text">
              <div className="user-display-name" title={user.full_name}>
                {user.full_name}
              </div>
              <span className={`user-role-badge ${getRoleClass(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <FolderGit2 size={18} />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/issues"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <Bug size={18} />
            <span>Issues & Defects</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <Bell size={18} />
            <span>Notifications</span>
            {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>

          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Shield size={18} />
              <span>Admin Panel</span>
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <UserCheck size={18} />
            <span>My Profile</span>
          </NavLink>
        </nav>

        {/* Footer Logout */}
        <div className="sidebar-footer">
          <button
            onClick={() => logout()}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
