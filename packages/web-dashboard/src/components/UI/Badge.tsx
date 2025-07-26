import React from 'react';
import './Badge.scss';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: 'default' | 'solid' | 'outline';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style = 'default',
  interactive = false,
  className = '',
  onClick,
  'aria-label': ariaLabel,
}) => {
  const classes = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    style !== 'default' && `badge-${style}`,
    interactive && 'badge-interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Component = onClick ? 'button' : 'span';

  return (
    <Component 
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
};