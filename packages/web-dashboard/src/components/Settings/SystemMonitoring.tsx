import React from 'react';
import { Card, CardHeader, CardContent, Button } from '@components/UI';
import { ProgressBar } from '@components/UI/ProgressBar';
import { StatusIndicator } from '@components/UI/StatusIndicator';
import { useSettings } from '@hooks/useSettings';

export const SystemMonitoring: React.FC = () => {
  const { health, refreshHealth } = useSettings();

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor((Date.now() - uptime) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'error';
    if (value >= thresholds.warning) return 'warning';
    return 'success';
  };

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <h2>System Health</h2>
        </CardHeader>
        <CardContent>
          <p>Loading system health information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ollama Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2>Ollama Status</h2>
            <StatusIndicator 
              status={health.ollama.connected ? 'connected' : 'disconnected'}
              label={health.ollama.connected ? 'Connected' : 'Disconnected'}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-item">
              <span className="metric-label">Version</span>
              <span className="metric-value">{health.ollama.version}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Loaded Model</span>
              <span className="metric-value">{health.ollama.loadedModel || 'None'}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Available Models</span>
              <span className="metric-value">{health.ollama.availableModels.length}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Response Time</span>
              <span className="metric-value">{Math.round(health.ollama.responseTime)}ms</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Memory Usage</span>
              <span className="metric-value">{Math.round(health.ollama.memoryUsage)} MB</span>
            </div>
            <ProgressBar 
              value={Math.min((health.ollama.memoryUsage / 4096) * 100, 100)} 
              variant={getStatusColor(health.ollama.memoryUsage, { warning: 2048, critical: 3072 })}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <h2>System Resources</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label">CPU Usage</span>
                <span className="metric-value">{Math.round(health.system.cpuUsage)}%</span>
              </div>
              <ProgressBar 
                value={health.system.cpuUsage} 
                variant={getStatusColor(health.system.cpuUsage, { warning: 70, critical: 90 })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label">Memory Usage</span>
                <span className="metric-value">{Math.round(health.system.memoryUsage)}%</span>
              </div>
              <ProgressBar 
                value={health.system.memoryUsage} 
                variant={getStatusColor(health.system.memoryUsage, { warning: 80, critical: 95 })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label">Disk Usage</span>
                <span className="metric-value">{Math.round(health.system.diskUsage)}%</span>
              </div>
              <ProgressBar 
                value={health.system.diskUsage} 
                variant={getStatusColor(health.system.diskUsage, { warning: 85, critical: 95 })}
              />
            </div>

            <div className="metric-item">
              <span className="metric-label">System Uptime</span>
              <span className="metric-value">{formatUptime(health.system.uptime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <h2>Processing Queue</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-item">
              <span className="metric-label">Active Jobs</span>
              <span className="metric-value text-blue-600">{health.queue.activeJobs}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Pending Jobs</span>
              <span className="metric-value text-yellow-600">{health.queue.pendingJobs}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Completed Jobs</span>
              <span className="metric-value text-green-600">{health.queue.completedJobs}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Failed Jobs</span>
              <span className="metric-value text-red-600">{health.queue.failedJobs}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={refreshHealth}>
          Refresh Status
        </Button>
      </div>
    </div>
  );
};