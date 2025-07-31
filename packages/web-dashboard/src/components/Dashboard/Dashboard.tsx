import React from 'react';
import { Card, CardHeader, CardContent } from '@components/UI';
import { SystemStatusPanel } from './SystemStatusPanel';
import './Dashboard.scss';

export const Dashboard: React.FC = () => {

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Monitor your AI toolkit operations and system status</p>
      </div>

      <div className="dashboard-grid">
        <SystemStatusPanel />

        <div className="dashboard-sidebar">
          <Card tabIndex={0} role="region" aria-label="Quick Statistics">
            <CardHeader>
              <h2>Quick Stats</h2>
            </CardHeader>
            <CardContent>
              <div className="stats-grid">
                <div className="stat-item" tabIndex={0} role="button" aria-label="Documents Processed: 0">
                  <span className="stat-number" aria-hidden="true">0</span>
                  <span className="stat-label">Documents Processed</span>
                </div>
                <div className="stat-item" tabIndex={0} role="button" aria-label="Active Workflows: 0">
                  <span className="stat-number" aria-hidden="true">0</span>
                  <span className="stat-label">Active Workflows</span>
                </div>
                <div className="stat-item" tabIndex={0} role="button" aria-label="Queued Jobs: 0">
                  <span className="stat-number" aria-hidden="true">0</span>
                  <span className="stat-label">Queued Jobs</span>
                </div>
              </div>
            </CardContent>
            <Card tabIndex={0} role="region" aria-label="Recent Activity">
          <CardHeader>
            <h2>Recent Activity</h2>
          </CardHeader>
          <CardContent>
            <div className="stats-grid">
              <div className="stat-item" tabIndex={0} role="button" aria-label="Dashboard loaded successfully">
                <span className="stat-time" aria-hidden="true">Now</span>
                <span className="stat-label">Dashboard loaded</span>
              </div>
              <div className="stat-item" tabIndex={0} role="button" aria-label="WebSocket connection established">
                <span className="stat-time" aria-hidden="true">2m</span>
                <span className="stat-label">WebSocket connected</span>
              </div>
              <div className="stat-item" tabIndex={0} role="button" aria-label="System health check completed">
                <span className="stat-time" aria-hidden="true">5m</span>
                <span className="stat-label">Health check</span>
              </div>
              <div className="stat-item" tabIndex={0} role="button" aria-label="Ollama models synchronized">
                <span className="stat-time" aria-hidden="true">10m</span>
                <span className="stat-label">Models synced</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card tabIndex={0} role="region" aria-label="System Performance Metrics">
          <CardHeader>
            <h2>System Performance</h2>
          </CardHeader>
          <CardContent>
            <div className="stats-grid">
              <div className="stat-item" tabIndex={0} role="button" aria-label="Response Time: 4 milliseconds">
                <span className="stat-number" aria-hidden="true">4ms</span>
                <span className="stat-label">Response Time</span>
              </div>
              <div className="stat-item" tabIndex={0} role="button" aria-label="Memory Usage: 52.4%">
                <span className="stat-number" aria-hidden="true">52.4%</span>
                <span className="stat-label">Memory Usage</span>
              </div>
              <div className="stat-item" tabIndex={0} role="button" aria-label="CPU Usage: 23.1%">
                <span className="stat-number" aria-hidden="true">23.1%</span>
                <span className="stat-label">CPU Usage</span>
              </div>
              <div className="stat-item" tabIndex={0} role="button" aria-label="Active Connections: 8">
                <span className="stat-number" aria-hidden="true">8</span>
                <span className="stat-label">Connections</span>
              </div>
            </div>
          </CardContent>
        </Card>
          </Card>
        </div>
      </div>
    </div>
  );
};