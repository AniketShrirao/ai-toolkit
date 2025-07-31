import React from 'react';
import { ConnectionStatus } from '@hooks/useWebSocket';
import './StatusIndicator.scss';

type StatusType = ConnectionStatus | 'connected' | 'disconnected' | 'warning' | 'success' | 'error' | 'info';

interface StatusIndicatorProps {
  status: StatusType;
  lastUpdate?: Date | null;
  label?: string;
  size?: 'compact' | 'default' | 'large';
  variant?: 'default' | 'subtle' | 'with-background';
  showPulse?: boolean;
  hideTextOnMobile?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  lastUpdate,
  label,
  size = 'default',
  variant = 'default',
  showPulse = false,
  hideTextOnMobile = false,
  interactive = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
      case 'success':
        return 'success';
      case 'connecting':
      case 'warning':
        return 'warning';
      case 'disconnected':
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'warning';
    }
  };

  const getStatusText = () => {
    // Use custom label if provided
    if (label) return label;
    
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Unknown';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const shouldShowPulse = showPulse || (status === 'connecting');
  const statusColor = getStatusColor();
  
  const containerClasses = [
    'status-indicator',
    size !== 'default' && `status-indicator ${size}`,
    variant !== 'default' && variant,
    variant === 'with-background' && statusColor,
    hideTextOnMobile && 'hide-text-mobile',
    interactive && 'interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const dotClasses = [
    'status-dot',
    statusColor,
    variant === 'subtle' && 'subtle',
    shouldShowPulse && 'pulse',
  ]
    .filter(Boolean)
    .join(' ');

  const Component = interactive && onClick ? 'button' : 'div';

  return (
    <Component 
      className={containerClasses}
      onClick={onClick}
      aria-label={ariaLabel || `Status: ${getStatusText()}${lastUpdate ? `, last updated ${formatLastUpdate()}` : ''}`}
      aria-live={status === 'connecting' ? 'polite' : undefined}
      aria-describedby={lastUpdate ? `status-time-${status}` : undefined}
      type={interactive && onClick ? 'button' : undefined}
      role={interactive && onClick ? 'button' : 'status'}
      tabIndex={interactive && onClick ? 0 : undefined}
    >
      <div 
        className={dotClasses} 
        aria-hidden="true"
        role="presentation"
      />
      <div className="status-text" aria-hidden={ariaLabel ? true : undefined}>
        <span className="status-label" role="text">
          {getStatusText()}
        </span>
        {lastUpdate && (status === 'connected' || status === 'success') && (
          <span 
            className="status-time" 
            id={`status-time-${status}`}
            role="text"
            aria-label={`Last updated ${formatLastUpdate()}`}
          >
            {formatLastUpdate()}
          </span>
        )}
      </div>
    </Component>
  );
};