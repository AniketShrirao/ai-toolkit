import React, { useState } from 'react';
import { OllamaSettings } from './OllamaSettings';
import { ProcessingSettings } from './ProcessingSettings';
import { SystemMonitoring } from './SystemMonitoring';
import { WorkflowConfiguration } from './WorkflowConfiguration';
import { UserPreferences } from './UserPreferences';
import './Settings.css';

type SettingsTab = 'ollama' | 'processing' | 'monitoring' | 'workflows' | 'preferences';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ollama');

  const tabs = [
    { id: 'ollama' as const, label: 'Ollama', icon: '🤖' },
    { id: 'processing' as const, label: 'Processing', icon: '⚙️' },
    { id: 'monitoring' as const, label: 'Monitoring', icon: '📊' },
    { id: 'workflows' as const, label: 'Workflows', icon: '🔄' },
    { id: 'preferences' as const, label: 'Preferences', icon: '👤' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ollama':
        return <OllamaSettings />;
      case 'processing':
        return <ProcessingSettings />;
      case 'monitoring':
        return <SystemMonitoring />;
      case 'workflows':
        return <WorkflowConfiguration />;
      case 'preferences':
        return <UserPreferences />;
      default:
        return <OllamaSettings />;
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure your AI toolkit preferences and system settings</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};