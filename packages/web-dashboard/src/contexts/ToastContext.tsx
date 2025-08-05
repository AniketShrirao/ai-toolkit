import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastProps } from '../components/UI/Toast';

interface ToastWithId extends ToastProps {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastProps, 'onClose'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newToast: ToastWithId = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextValue = {
    showToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience hooks for different toast types
export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    showSuccess: (message: string, options?: Partial<ToastProps>) =>
      showToast({ message, type: 'success', ...options }),
    
    showError: (message: string, options?: Partial<ToastProps>) =>
      showToast({ message, type: 'error', ...options }),
    
    showWarning: (message: string, options?: Partial<ToastProps>) =>
      showToast({ message, type: 'warning', ...options }),
    
    showInfo: (message: string, options?: Partial<ToastProps>) =>
      showToast({ message, type: 'info', ...options }),
    
    showConfirmation: (
      message: string,
      onConfirm: () => void,
      options?: Partial<ToastProps>
    ) =>
      showToast({
        message,
        type: 'warning',
        duration: 0, // Don't auto-dismiss
        action: {
          label: 'Confirm',
          onClick: onConfirm,
        },
        ...options,
      }),
  };
};

export default ToastContext;