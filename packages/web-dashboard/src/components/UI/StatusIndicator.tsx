import React from 'react';
import { ConnectionStatus } from '@hooks/useWebSocket';
import './StatusIndicator.css';

type StatusType = ConnectionStatus | 'connected' | 'disconnected' | 'warning' | 'success' | 'error';

interface StatusIndicatorProps {
  status: StatusType;
  lastUpdate?: Date | null;
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  lastUpdate,
  label,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'disconnected':
      case 'error':
        return 'error';
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

  return (
    <div className="status-indicator">
      <div className={`status-dot ${getStatusColor()}`} />
      <div className="status-text">
        <span className="status-label">{label || getStatusText()}</span>
        {lastUpdate && status === 'connected' && (
          <span className="status-time">{formatLastUpdate()}</span>
        )}
      </div>
    </div>
  );
};