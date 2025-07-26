import React from 'react';
import { Card, CardHeader, CardContent } from '@components/UI';
import { useHealthStatus } from '@hooks/useHealthStatus';
import './SystemStatusPanel.css';

interface StatusIndicatorProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'checking';
  label: string;
  details?: string;
  responseTime?: number;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  label, 
  details, 
  responseTime 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      case 'checking':
        return '🔄';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'unhealthy':
        return '#ef4444';
      case 'checking':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="status-indicator">
      <div className="status-main">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-label">{label}</span>
        <span 
          className="status-value" 
          style={{ color: getStatusColor() }}
        >
          {status}
        </span>
      </div>
      {details && (
        <div className="status-details">
          {details}
          {responseTime && (
            <span className="response-time">({responseTime}ms)</span>
          )}
        </div>
      )}
    </div>
  );
};

interface EnvironmentBadgeProps {
  environment: string;
}

const EnvironmentBadge: React.FC<EnvironmentBadgeProps> = ({ environment }) => {
  const getBadgeColor = () => {
    switch (environment) {
      case 'production':
        return '#ef4444';
      case 'development':
        return '#10b981';
      case 'test':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <span 
      className="environment-badge" 
      style={{ backgroundColor: getBadgeColor() }}
    >
      {environment.toUpperCase()}
    </span>
  );
};

interface DiagnosticItemProps {
  diagnostic: {
    category: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    suggestion?: string;
  };
}

const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ diagnostic }) => {
  const getIcon = () => {
    switch (diagnostic.level) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getColor = () => {
    switch (diagnostic.level) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="diagnostic-item" style={{ borderLeftColor: getColor() }}>
      <div className="diagnostic-header">
        <span className="diagnostic-icon">{getIcon()}</span>
        <span className="diagnostic-category">{diagnostic.category}</span>
        <span className="diagnostic-level" style={{ color: getColor() }}>
          {diagnostic.level}
        </span>
      </div>
      <div className="diagnostic-message">{diagnostic.message}</div>
      {diagnostic.suggestion && (
        <div className="diagnostic-suggestion">
          💡 {diagnostic.suggestion}
        </div>
      )}
    </div>
  );
};

export const SystemStatusPanel: React.FC = () => {
  const { healthStatus, loading, error, lastUpdated, refresh } = useHealthStatus();

  if (loading && !healthStatus) {
    return (
      <Card>
        <CardHeader>
          <h2>System Status</h2>
        </CardHeader>
        <CardContent>
          <div className="status-loading">
            <span className="loading-spinner">🔄</span>
            <span>Loading system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !healthStatus) {
    return (
      <Card>
        <CardHeader>
          <h2>System Status</h2>
        </CardHeader>
        <CardContent>
          <div className="status-error">
            <span className="error-icon">❌</span>
            <span>Failed to load system status: {error}</span>
            <button onClick={refresh} className="retry-button">
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthStatus) {
    return null;
  }

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)}GB`;
  };

  return (
    <div className="system-status-panel">
      <Card>
        <CardHeader>
          <div className="status-header">
            <h2>System Status</h2>
            <div className="status-header-info">
              <EnvironmentBadge environment={healthStatus.environment} />
              <button onClick={refresh} className="refresh-button" title="Refresh status">
                🔄
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="status-overview">
            <div className="overall-status">
              <StatusIndicator
                status={healthStatus.status}
                label="Overall System"
                details={`Version ${healthStatus.version} • Uptime ${formatUptime(healthStatus.uptime)}`}
              />
            </div>
            
            <div className="status-grid">
              <StatusIndicator
                status={healthStatus.components.ollama.status}
                label="Ollama"
                details={
                  healthStatus.components.ollama.connected
                    ? `${healthStatus.components.ollama.availableModels.length} models • ${healthStatus.components.ollama.loadedModel || 'No model loaded'}`
                    : healthStatus.components.ollama.error || 'Disconnected'
                }
                responseTime={healthStatus.components.ollama.responseTime}
              />
              
              <StatusIndicator
                status={healthStatus.components.database.status}
                label="Database"
                details={
                  healthStatus.components.database.connected
                    ? `${healthStatus.components.database.path} • ${healthStatus.components.database.size ? `${(healthStatus.components.database.size / 1024).toFixed(1)}KB` : 'Unknown size'}`
                    : healthStatus.components.database.error || 'Not connected'
                }
              />
              
              <StatusIndicator
                status={healthStatus.components.redis.status}
                label="Redis"
                details={
                  healthStatus.components.redis.connected
                    ? `${healthStatus.components.redis.host}:${healthStatus.components.redis.port}`
                    : healthStatus.components.redis.error || 'Not connected'
                }
                responseTime={healthStatus.components.redis.responseTime}
              />
              
              <StatusIndicator
                status={healthStatus.components.storage.status}
                label="Storage"
                details={
                  Object.values(healthStatus.components.storage.paths).every(p => p.exists && p.writable)
                    ? 'All paths accessible'
                    : 'Some paths inaccessible'
                }
              />
              
              <StatusIndicator
                status={healthStatus.components.system.status}
                label="System Resources"
                details={`Memory: ${healthStatus.components.system.memory.percentage.toFixed(1)}% (${formatMemory(healthStatus.components.system.memory.used)}/${formatMemory(healthStatus.components.system.memory.total)})`}
              />
            </div>
          </div>

          {healthStatus.components.ollama.connected && (
            <div className="models-section">
              <h3>Active Models</h3>
              <div className="models-list">
                {healthStatus.components.ollama.availableModels.map((model, index) => (
                  <span 
                    key={index} 
                    className={`model-tag ${model === healthStatus.components.ollama.loadedModel ? 'active' : ''}`}
                  >
                    {model}
                    {model === healthStatus.components.ollama.loadedModel && ' (loaded)'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {healthStatus.diagnostics.length > 0 && (
            <div className="diagnostics-section">
              <h3>Diagnostics</h3>
              <div className="diagnostics-list">
                {healthStatus.diagnostics
                  .filter(d => d.level === 'error' || d.level === 'warning')
                  .slice(0, 5)
                  .map((diagnostic, index) => (
                    <DiagnosticItem key={index} diagnostic={diagnostic} />
                  ))}
              </div>
            </div>
          )}

          {lastUpdated && (
            <div className="status-footer">
              <span className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};