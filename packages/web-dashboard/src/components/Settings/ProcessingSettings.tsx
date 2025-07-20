import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { useSettings } from '@hooks/useSettings';
import { ProcessingSettings as ProcessingSettingsType } from '@ai-toolkit/shared';

export const ProcessingSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ProcessingSettingsType>(
    settings?.processing || {
      autoProcess: true,
      maxConcurrentJobs: 3,
      enableNotifications: true,
      defaultAnalysisTypes: ['requirements', 'summary'],
      outputFormat: 'json',
    }
  );

  const handleSave = async () => {
    try {
      await updateSettings({ processing: localSettings });
    } catch (error) {
      console.error('Failed to save processing settings:', error);
    }
  };

  const handleAnalysisTypeChange = (type: string, checked: boolean) => {
    const updatedTypes = checked
      ? [...localSettings.defaultAnalysisTypes, type]
      : localSettings.defaultAnalysisTypes.filter((t: string) => t !== type);
    
    setLocalSettings({ ...localSettings, defaultAnalysisTypes: updatedTypes });
  };

  const analysisTypes = [
    { id: 'requirements', label: 'Requirements Extraction' },
    { id: 'summary', label: 'Document Summarization' },
    { id: 'structure', label: 'Structure Analysis' },
    { id: 'estimation', label: 'Project Estimation' },
    { id: 'codebase', label: 'Codebase Analysis' },
  ];

  return (
    <Card>
      <CardHeader>
        <h2>Processing Preferences</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="setting-group">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={localSettings.autoProcess}
                onChange={(e) => setLocalSettings({ ...localSettings, autoProcess: e.target.checked })}
              />
              <span>Auto-process uploaded documents</span>
            </label>
            <p className="setting-description">
              Automatically start processing documents when they are uploaded
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={localSettings.enableNotifications}
                onChange={(e) => setLocalSettings({ ...localSettings, enableNotifications: e.target.checked })}
              />
              <span>Enable real-time notifications</span>
            </label>
            <p className="setting-description">
              Show notifications when processing completes or fails
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-label">Max concurrent jobs</label>
            <Input
              type="number"
              value={localSettings.maxConcurrentJobs}
              onChange={(e) => setLocalSettings({ ...localSettings, maxConcurrentJobs: parseInt(e.target.value) })}
              min="1"
              max="10"
            />
            <p className="setting-description">
              Maximum number of documents to process simultaneously
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-label">Output Format</label>
            <select
              className="setting-select"
              value={localSettings.outputFormat}
              onChange={(e) => setLocalSettings({ ...localSettings, outputFormat: e.target.value as 'json' | 'markdown' | 'html' })}
            >
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
            <p className="setting-description">
              Default format for processed document outputs
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-label">Default Analysis Types</label>
            <div className="checkbox-group">
              {analysisTypes.map(type => (
                <label key={type.id} className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.defaultAnalysisTypes.includes(type.id)}
                    onChange={(e) => handleAnalysisTypeChange(type.id, e.target.checked)}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
            <p className="setting-description">
              Analysis types to run by default on uploaded documents
            </p>
          </div>

          <Button variant="primary" onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};