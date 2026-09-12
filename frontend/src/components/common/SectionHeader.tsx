import React from 'react';

export interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`section-header ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.85rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary)' }}>{icon}</span>}
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          {badge && <span>{badge}</span>}
        </div>
        {subtitle && (
          <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
