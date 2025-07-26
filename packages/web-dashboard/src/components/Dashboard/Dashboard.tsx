import React from 'react';
import { Card, CardHeader, CardContent } from '@components/UI';
import { useWebSocket } from '@hooks/useWebSocket';
import { SystemStatusPanel } from './SystemStatusPanel';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { connectionStatus } = useWebSocket();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Monitor your AI toolkit operations and system status</p>
      </div>

      <div className="dashboard-grid">
        <SystemStatusPanel />

        <div className="dashboard-sidebar">
          <Card>
            <CardHeader>
              <h2>Quick Stats</h2>
            </CardHeader>
            <CardContent>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">0</span>
                  <span className="stat-label">Documents Processed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">0</span>
                  <span className="stat-label">Active Workflows</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">0</span>
                  <span className="stat-label">Queued Jobs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="dashboard-secondary-grid">
        <Card>
          <CardHeader>
            <h2>Recent Activity</h2>
          </CardHeader>
          <CardContent>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-time">Just now</span>
                <span className="activity-text">Dashboard loaded successfully</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">2 min ago</span>
                <span className="activity-text">WebSocket connection established</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">5 min ago</span>
                <span className="activity-text">System health check completed</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">10 min ago</span>
                <span className="activity-text">Ollama models synchronized</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2>System Performance</h2>
          </CardHeader>
          <CardContent>
            <div className="performance-metrics">
              <div className="metric-item">
                <div className="metric-header">
                  <span className="metric-label">Response Time</span>
                  <span className="metric-value">4ms</span>
                </div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '15%', backgroundColor: '#10b981'}}></div>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-header">
                  <span className="metric-label">Memory Usage</span>
                  <span className="metric-value">52.4%</span>
                </div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '52.4%', backgroundColor: '#f59e0b'}}></div>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-header">
                  <span className="metric-label">CPU Usage</span>
                  <span className="metric-value">23.1%</span>
                </div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '23.1%', backgroundColor: '#3b82f6'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};