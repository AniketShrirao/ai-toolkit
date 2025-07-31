import React from 'react';
import './Card.scss';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'flat' | 'interactive' | 'glass';
  status?: 'success' | 'warning' | 'error' | 'info';
  size?: 'compact' | 'default' | 'spacious';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  status,
  size = 'default',
  ...htmlProps
}) => {
  const classes = [
    'card',
    `card-padding-${padding}`,
    variant !== 'default' && `card-${variant}`,
    status && `card-${status}`,
    size !== 'default' && `card-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes} {...htmlProps}>{children}</div>;
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  title,
  subtitle,
}) => {
  return (
    <div className={`card-header ${className}`}>
      {title && <h2 className="card-title">{title}</h2>}
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`card-content ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return <div className={`card-footer ${className}`}>{children}</div>;
};

interface CardMetricItemProps {
  label: string;
  value: string | number;
  className?: string;
}

export const CardMetricItem: React.FC<CardMetricItemProps> = ({
  label,
  value,
  className = '',
}) => {
  return (
    <div className={`metric-item ${className}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
};

interface CardStatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
  className?: string;
}

export const CardStatusIndicator: React.FC<CardStatusIndicatorProps> = ({
  status,
  text,
  className = '',
}) => {
  return (
    <div className={`status-indicator status-indicator-${status} ${className}`}>
      <div className="status-dot"></div>
      <span className="status-text">{text}</span>
    </div>
  );
};