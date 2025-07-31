import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Input, Button } from '@components/UI';
import { useAIService, AIServiceConfig } from '@hooks/useAIService';
import './AISettings.scss';

export const AISettings: React.FC = () => {
  const [config, setConfig] = useState<AIServiceConfig>({
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: '',
    apiKey: '',
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    models?: string[];
  } | null>(null);

  const aiService = useAIService();

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai-service-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        console.error('Failed to parse saved AI config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = (newConfig: AIServiceConfig) => {
    localStorage.setItem('ai-service-config', JSON.stringify(newConfig));
    setConfig(newConfig);
  };

  // Test connection with current configuration
  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      await aiService.initializeService(config);
      
      if (aiService.isConnected) {
        setTestResult({
          success: true,
          message: 'Successfully connected to AI service!',
          models: aiService.availableModels,
        });
      } else {
        setTestResult({
          success: false,
          message: aiService.error || 'Failed to connect to AI service',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Handle form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    await testConnection();
  };

  // Handle provider change
  const handleProviderChange = (provider: AIServiceConfig['provider']) => {
    const newConfig = { ...config, provider };
    
    // Set default values based on provider
    if (provider === 'ollama') {
      newConfig.baseUrl = 'http://localhost:11434';
      newConfig.apiKey = '';
    } else if (provider === 'openai') {
      newConfig.baseUrl = 'https://api.openai.com/v1';
      newConfig.model = 'gpt-3.5-turbo';
    } else if (provider === 'anthropic') {
      newConfig.baseUrl = 'https://api.anthropic.com';
      newConfig.model = 'claude-3-sonnet-20240229';
    }
    
    setConfig(newConfig);
  };

  return (
    <div className="ai-settings">
      <Card>
        <CardHeader>
          <h2>AI Service Configuration</h2>
          <p>Configure your AI service provider and connection settings</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="ai-settings-form">
            {/* Provider Selection */}
            <div className="form-group">
              <label htmlFor="provider">AI Provider</label>
              <select
                id="provider"
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value as AIServiceConfig['provider'])}
                className="form-select"
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            {/* Base URL */}
            <div className="form-group">
              <label htmlFor="baseUrl">Base URL</label>
              <Input
                id="baseUrl"
                type="url"
                value={config.baseUrl || ''}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder={
                  config.provider === 'ollama' 
                    ? 'http://localhost:11434'
                    : config.provider === 'openai'
                      ? 'https://api.openai.com/v1'
                      : 'https://api.anthropic.com'
                }
              />
            </div>

            {/* API Key (for cloud providers) */}
            {config.provider !== 'ollama' && (
              <div className="form-group">
                <label htmlFor="apiKey">API Key</label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  required={config.provider === 'openai' || config.provider === 'anthropic'}
                />
                <small className="form-help">
                  Your API key is stored locally and never sent to our servers.
                </small>
              </div>
            )}

            {/* Model Selection */}
            <div className="form-group">
              <label htmlFor="model">Default Model (Optional)</label>
              <Input
                id="model"
                type="text"
                value={config.model || ''}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder={
                  config.provider === 'ollama' 
                    ? 'llama2, codellama, etc.'
                    : config.provider === 'openai'
                      ? 'gpt-3.5-turbo, gpt-4, etc.'
                      : 'claude-3-sonnet-20240229, etc.'
                }
              />
              <small className="form-help">
                Leave empty to use the first available model.
              </small>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={testConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button type="submit" variant="primary">
                Save Configuration
              </Button>
            </div>
          </form>

          {/* Test Results */}
          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <div className="test-result-message">
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </div>
              
              {testResult.success && testResult.models && testResult.models.length > 0 && (
                <div className="available-models">
                  <h4>Available Models:</h4>
                  <ul>
                    {testResult.models.map((model) => (
                      <li key={model}>{model}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Current Status */}
          {aiService.isConnected && (
            <div className="current-status">
              <h4>Current Status:</h4>
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Provider:</span>
                  <span className="status-value">{aiService.provider}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Model:</span>
                  <span className="status-value">{aiService.currentModel || 'Default'}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className={`status-value ${aiService.connectionStatus}`}>
                    {aiService.connectionStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};