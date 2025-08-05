import React, { useState, useEffect, useCallback } from 'react';
import './Toast.scss';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!isVisible) {
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div 
      className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        <span className="toast-icon" aria-hidden="true">
          {getIcon()}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      
      <div className="toast-actions">
        {action && (
          <button
            className="toast-action-button"
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        )}
        <button
          className="toast-close-button"
          onClick={handleClose}
          aria-label="Close notification"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Toast Container for managing multiple toasts
export interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast,
}) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;