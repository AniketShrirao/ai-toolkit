import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  as?: 'button' | 'span';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  as = 'button',
  ...props
}) => {
  const classes = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    loading && 'button-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <span className="button-spinner" />}
      <span className={loading ? 'button-content-loading' : ''}>
        {children}
      </span>
    </>
  );

  if (as === 'span') {
    return (
      <span className={classes} {...(props as any)}>
        {content}
      </span>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
};