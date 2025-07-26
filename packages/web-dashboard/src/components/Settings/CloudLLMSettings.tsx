import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { StatusIndicator } from '@components/UI/StatusIndicator';
import { useSettings } from '@hooks/useSettings';
import { CloudLLMSettings as CloudLLMSettingsType, LLMProvider } from '@ai-toolkit/shared';

export const CloudLLMSettings: React.FC = () => {
  const { settings, health, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<CloudLLMSettingsType>(
    settings?.cloudLLM || {
      provider: 'ollama',
      fallbackEnabled: false,
      fallbackProviders: ['ollama'],
      openai: {
        apiKey: '',
        defaultModel: 'gpt-4o-mini',
        timeout: 30000,
        maxRetries: 3,
      },
      anthropic: {
        apiKey: '',
        defaultModel: 'claude-3-5-sonnet-20241022',
        timeout: 30000,
        maxRetries: 3,
      },
    }
  );
  const [testing, setTesting] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);

  const handleSave = async () => {
    try {
      await updateSettings({ cloudLLM: localSettings });
    } catch (error) {
      console.error('Failed to save Cloud LLM settings:', error);
    }
  };

  const handleTestConnection = async (provider: 'openai' | 'anthropic') => {
    setTesting(provider);
    try {
      const response = await fetch(`http://localhost:3002/api/health/cloud-llm/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: provider === 'openai' ? localSettings.openai?.apiKey : localSettings.anthropic?.apiKey,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      
      const healthData = await response.json();
      
      if (healthData.connected) {
        alert(`${provider.toUpperCase()} connection successful! 
        
Available models: ${healthData.availableModels?.length || 0}
Response time: ${healthData.responseTime}ms`);
      } else {
        alert(`${provider.toUpperCase()} connection failed. Please check your API key and settings.`);
      }
    } catch (error) {
      console.error(`${provider} connection test error:`, error);
      alert(`${provider.toUpperCase()} connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(null);
    }
  };

  const providers = [
    { id: 'ollama', name: 'Ollama (Local)', description: 'Local AI models via Ollama' },
    { id: 'openai', name: 'OpenAI ChatGPT', description: 'OpenAI GPT models (requires API key)' },
    { id: 'anthropic', name: 'Anthropic Claude', description: 'Anthropic Claude models (requires API key)' },
  ] as const;

  const openaiModels = [
    { id: 'gpt-4o', name: 'GPT-4o', cost: '$5.00 / $15.00 per 1M tokens' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: '$0.15 / $0.60 per 1M tokens' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', cost: '$10.00 / $30.00 per 1M tokens' },
  ];

  const anthropicModels = [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', cost: '$3.00 / $15.00 per 1M tokens' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', cost: '$0.80 / $4.00 per 1M tokens' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', cost: '$15.00 / $75.00 per 1M tokens' },
  ];

  const activeProvider = health?.cloudLLM?.activeProvider || localSettings.provider;
  const providerStatus = health?.cloudLLM?.providers || {
    ollama: { connected: false, available: false },
    openai: { connected: false, available: false },
    anthropic: { connected: false, available: false }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2>AI Model Provider</h2>
            <StatusIndicator 
              status={providerStatus[activeProvider as LLMProvider]?.connected ? 'connected' : 'disconnected'} 
              lastUpdate={providerStatus[activeProvider as LLMProvider]?.connected ? new Date() : null}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="setting-group">
              <label className="setting-label">Primary Provider</label>
              <div className="provider-selection">
                {providers.map((provider) => (
                  <div key={provider.id} className="provider-option">
                    <label className="provider-label">
                      <input
                        type="radio"
                        name="provider"
                        value={provider.id}
                        checked={localSettings.provider === provider.id}
                        onChange={(e) => setLocalSettings({ 
                          ...localSettings, 
                          provider: e.target.value as any 
                        })}
                      />
                      <div className="provider-info">
                        <div className="provider-name">{provider.name}</div>
                        <div className="provider-description">{provider.description}</div>
                        {providerStatus[provider.id as LLMProvider] && (
                          <div className={`provider-status ${providerStatus[provider.id as LLMProvider]?.connected ? 'connected' : 'disconnected'}`}>
                            {providerStatus[provider.id as LLMProvider]?.connected ? '✓ Connected' : '✗ Disconnected'}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={localSettings.fallbackEnabled}
                  onChange={(e) => setLocalSettings({ 
                    ...localSettings, 
                    fallbackEnabled: e.target.checked 
                  })}
                />
                Enable fallback providers
              </label>
              <p className="setting-description">
                Automatically switch to backup providers if the primary provider fails
              </p>
            </div>

            {localSettings.fallbackEnabled && (
              <div className="setting-group">
                <label className="setting-label">Fallback Order</label>
                <div className="fallback-providers">
                  {providers.map((provider) => (
                    <label key={provider.id} className="fallback-option">
                      <input
                        type="checkbox"
                        checked={localSettings.fallbackProviders.includes(provider.id as any)}
                        onChange={(e) => {
                          const providers = localSettings.fallbackProviders;
                          if (e.target.checked) {
                            setLocalSettings({
                              ...localSettings,
                              fallbackProviders: [...providers, provider.id as any]
                            });
                          } else {
                            setLocalSettings({
                              ...localSettings,
                              fallbackProviders: providers.filter((p: LLMProvider) => p !== provider.id)
                            });
                          }
                        }}
                      />
                      {provider.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {health?.cloudLLM?.fallbackActive && (
              <div className="fallback-alert">
                ⚠️ Fallback mode is currently active. Primary provider is unavailable.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OpenAI Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3>OpenAI Configuration</h3>
            <StatusIndicator 
              status={providerStatus.openai?.connected ? 'connected' : 'disconnected'} 
              lastUpdate={providerStatus.openai?.connected ? new Date() : null}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="setting-group">
              <label className="setting-label">API Key</label>
              <div className="api-key-input">
                <Input
                  type={showApiKeys ? "text" : "password"}
                  value={localSettings.openai?.apiKey || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    openai: { ...localSettings.openai!, apiKey: e.target.value }
                  })}
                  placeholder="sk-..."
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                >
                  {showApiKeys ? '👁️' : '👁️‍🗨️'}
                </Button>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">Default Model</label>
              <select 
                className="setting-select"
                value={localSettings.openai?.defaultModel || ''}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  openai: { ...localSettings.openai!, defaultModel: e.target.value }
                })}
              >
                {openaiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.cost}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="setting-group">
                <label className="setting-label">Timeout (ms)</label>
                <Input
                  type="number"
                  value={localSettings.openai?.timeout || 30000}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    openai: { ...localSettings.openai!, timeout: parseInt(e.target.value) }
                  })}
                  min="1000"
                  max="300000"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Max Retries</label>
                <Input
                  type="number"
                  value={localSettings.openai?.maxRetries || 3}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    openai: { ...localSettings.openai!, maxRetries: parseInt(e.target.value) }
                  })}
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <Button 
              variant="secondary" 
              onClick={() => handleTestConnection('openai')}
              disabled={testing === 'openai' || !localSettings.openai?.apiKey}
            >
              {testing === 'openai' ? 'Testing...' : 'Test OpenAI Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Anthropic Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3>Anthropic Configuration</h3>
            <StatusIndicator 
              status={providerStatus.anthropic?.connected ? 'connected' : 'disconnected'} 
              lastUpdate={providerStatus.anthropic?.connected ? new Date() : null}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="setting-group">
              <label className="setting-label">API Key</label>
              <div className="api-key-input">
                <Input
                  type={showApiKeys ? "text" : "password"}
                  value={localSettings.anthropic?.apiKey || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    anthropic: { ...localSettings.anthropic!, apiKey: e.target.value }
                  })}
                  placeholder="sk-ant-..."
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                >
                  {showApiKeys ? '👁️' : '👁️‍🗨️'}
                </Button>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">Default Model</label>
              <select 
                className="setting-select"
                value={localSettings.anthropic?.defaultModel || ''}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  anthropic: { ...localSettings.anthropic!, defaultModel: e.target.value }
                })}
              >
                {anthropicModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.cost}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="setting-group">
                <label className="setting-label">Timeout (ms)</label>
                <Input
                  type="number"
                  value={localSettings.anthropic?.timeout || 30000}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    anthropic: { ...localSettings.anthropic!, timeout: parseInt(e.target.value) }
                  })}
                  min="1000"
                  max="300000"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Max Retries</label>
                <Input
                  type="number"
                  value={localSettings.anthropic?.maxRetries || 3}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    anthropic: { ...localSettings.anthropic!, maxRetries: parseInt(e.target.value) }
                  })}
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <Button 
              variant="secondary" 
              onClick={() => handleTestConnection('anthropic')}
              disabled={testing === 'anthropic' || !localSettings.anthropic?.apiKey}
            >
              {testing === 'anthropic' ? 'Testing...' : 'Test Anthropic Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave}>
          Save All Settings
        </Button>
      </div>
    </div>
  );
};