import React from 'react';
import { Card, CardHeader, CardContent } from '@components/UI';
import { useWebSocket } from '@hooks/useWebSocket';
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
        <Card>
          <CardHeader>
            <h2>System Status</h2>
          </CardHeader>
          <CardContent>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">WebSocket</span>
                <span className={`status-value ${connectionStatus}`}>
                  {connectionStatus}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Ollama</span>
                <span className="status-value checking">Checking...</span>
              </div>
              <div className="status-item">
                <span className="status-label">Queue</span>
                <span className="status-value idle">Idle</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2>Recent Activity</h2>
          </CardHeader>
          <CardContent>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-time">Just now</span>
                <span className="activity-text">Dashboard loaded</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">2 min ago</span>
                <span className="activity-text">WebSocket connected</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
  );
};