import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`page-header ${className}`} style={{ marginBottom: '1.25rem' }}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumbs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.4rem',
            }}
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.label + idx}>
                  {crumb.href && !isLast ? (
                    <Link
                      to={crumb.href}
                      style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                      className="hover-underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span style={{ color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isLast ? 600 : 400 }}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
