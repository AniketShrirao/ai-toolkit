import React from 'react';
import './Input.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'search';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = 'default',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const classes = [
    'input-wrapper',
    variant && `input-${variant}`,
    error && 'input-error',
    leftIcon && 'input-with-left-icon',
    rightIcon && 'input-with-right-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {leftIcon && <div className="input-icon input-icon-left">{leftIcon}</div>}
        <input className="input" {...props} />
        {rightIcon && <div className="input-icon input-icon-right">{rightIcon}</div>}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};