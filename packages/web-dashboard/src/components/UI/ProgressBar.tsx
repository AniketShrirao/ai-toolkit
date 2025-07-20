import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const classes = [
    'progress-bar',
    `progress-bar-${size}`,
    `progress-bar-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar-label">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};