import React from 'react';

export interface TracePilotLogoProps {
  /** Size in pixels (applies to width bounding box while preserving aspect ratio) */
  size?: number;
  /** Optional custom CSS className */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** 'transparent' uses clean transparent background; 'solid' uses exact dark background */
  variant?: 'transparent' | 'solid';
  /** Alternative text for accessibility */
  alt?: string;
}

export const TracePilotLogo: React.FC<TracePilotLogoProps> = ({
  size = 24,
  className = '',
  style = {},
  variant = 'transparent',
  alt = 'TracePilot Logo',
}) => {
  const src = variant === 'solid' ? '/logo.png' : '/logo-transparent.png';
  // Aspect ratio is 343 width / 369 height
  const height = Math.round(size * (369 / 343));

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={height}
      className={`tracepilot-logo ${className}`}
      style={{
        width: `${size}px`,
        height: 'auto',
        maxHeight: `${height}px`,
        aspectRatio: '343 / 369',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      }}
      draggable={false}
    />
  );
};

export default TracePilotLogo;
