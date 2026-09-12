import React from 'react';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  iconClass?: string;
  valueColor?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconClass = 'metric-icon-indigo',
  valueColor,
  subtitle,
  badge,
  badgeColor,
  trend,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`metric-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="metric-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span className="metric-label">{label}</span>
          {badge && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: badgeColor || 'var(--primary-subtle)',
                color: badgeColor ? '#fff' : 'var(--primary)',
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span className="metric-value" style={valueColor ? { color: valueColor } : undefined}>
            {value}
          </span>
          {trend && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {trend.isPositive ? '+' : ''}{trend.value} {trend.label || ''}
            </span>
          )}
        </div>

        {subtitle && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            {subtitle}
          </span>
        )}
      </div>

      {icon && (
        <div className={`metric-icon-box ${iconClass}`}>
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
