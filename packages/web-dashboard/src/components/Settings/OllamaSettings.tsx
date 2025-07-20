import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { StatusIndicator } from '@components/UI/StatusIndicator';
import { useSettings } from '@hooks/useSettings';
import { OllamaSettings as OllamaSettingsType } from '@ai-toolkit/shared';

export const OllamaSettings: React.FC = () => {
  const { settings, health, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<OllamaSettingsType>(
    settings?.ollama || {
      serverUrl: 'http://localhost:11434',
      defaultModel: '',
      timeout: 30000,
      maxRetries: 3,
      connectionPoolSize: 5,
    }
  );
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    try {
      await updateSettings({ ollama: localSettings });
    } catch (error) {
      console.error('Failed to save Ollama settings:', error);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // In real implementation, this would test the actual connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Mock success/failure
      if (Math.random() > 0.3) {
        alert('Connection successful!');
      } else {
        alert('Connection failed. Please check your settings.');
      }
    } catch (error) {
      alert('Connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  const isConnected = health?.ollama.connected ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2>Ollama Configuration</h2>
          <StatusIndicator 
            status={isConnected ? 'connected' : 'disconnected'} 
            lastUpdate={isConnected ? new Date() : null}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="setting-group">
            <label className="setting-label">Server URL</label>
            <Input
              type="text"
              value={localSettings.serverUrl}
              onChange={(e) => setLocalSettings({ ...localSettings, serverUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
          </div>

          <div className="setting-group">
            <label className="setting-label">Default Model</label>
            <select 
              className="setting-select"
              value={localSettings.defaultModel}
              onChange={(e) => setLocalSettings({ ...localSettings, defaultModel: e.target.value })}
            >
              <option value="">Select a model...</option>
              {health?.ollama.availableModels.map((model: string) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="setting-group">
              <label className="setting-label">Timeout (ms)</label>
              <Input
                type="number"
                value={localSettings.timeout}
                onChange={(e) => setLocalSettings({ ...localSettings, timeout: parseInt(e.target.value) })}
                min="1000"
                max="300000"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">Max Retries</label>
              <Input
                type="number"
                value={localSettings.maxRetries}
                onChange={(e) => setLocalSettings({ ...localSettings, maxRetries: parseInt(e.target.value) })}
                min="0"
                max="10"
              />
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">Connection Pool Size</label>
            <Input
              type="number"
              value={localSettings.connectionPoolSize}
              onChange={(e) => setLocalSettings({ ...localSettings, connectionPoolSize: parseInt(e.target.value) })}
              min="1"
              max="20"
            />
          </div>

          {health?.ollama && (
            <div className="ollama-status">
              <h4>Status Information</h4>
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Version:</span>
                  <span className="status-value">{health.ollama.version}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Loaded Model:</span>
                  <span className="status-value">{health.ollama.loadedModel || 'None'}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Memory Usage:</span>
                  <span className="status-value">{Math.round(health.ollama.memoryUsage)} MB</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Response Time:</span>
                  <span className="status-value">{Math.round(health.ollama.responseTime)} ms</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};