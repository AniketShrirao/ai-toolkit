import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatInterface } from '../UI/ChatInterface';
import { useChatContext } from '../../contexts/ChatContext';
import { useAIService, AIServiceConfig } from '../../hooks/useAIService';
import './Chat.scss';

export const Chat: React.FC = () => {
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    isConnected,
    currentModel,
    availableModels,
    provider,
    error,
    connectionStatus,
    updateConfig,
    scrollState,
    updateScrollPosition,
    setActiveInterface,
    syncScrollPosition,
    aiConfig,
  } = useChatContext();

  const [showSettings, setShowSettings] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    models?: string[];
  } | null>(null);
  const [tempConfig, setTempConfig] = useState<AIServiceConfig | null>(null);
  const [enableStreaming, setEnableStreaming] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [sendMessage]);

  const handleClearChat = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearMessages();
    }
  }, [clearMessages]);

  const handleModelChange = useCallback(async (model: string) => {
    try {
      await updateConfig({ model });
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  }, [updateConfig]);

  const handleProviderChange = useCallback(async (newProvider: AIServiceConfig['provider']) => {
    try {
      const newConfig: Partial<AIServiceConfig> = { provider: newProvider };
      
      // Set default values based on provider
      if (newProvider === 'ollama') {
        newConfig.baseUrl = 'http://localhost:11434';
        newConfig.apiKey = '';
      } else if (newProvider === 'openai') {
        newConfig.baseUrl = 'https://api.openai.com/v1';
        newConfig.model = 'gpt-3.5-turbo';
      } else if (newProvider === 'anthropic') {
        newConfig.baseUrl = 'https://api.anthropic.com';
        newConfig.model = 'claude-3-sonnet-20240229';
      }
      
      await updateConfig(newConfig);
    } catch (error) {
      console.error('Failed to update provider:', error);
    }
  }, [updateConfig]);

  const handleConfigChange = useCallback((field: keyof AIServiceConfig, value: string) => {
    setTempConfig(prev => ({
      ...(prev || aiConfig || { provider: 'ollama' }),
      [field]: value,
    }));
  }, [aiConfig]);

  const handleSaveConfig = useCallback(async () => {
    if (!tempConfig) return;
    
    try {
      await updateConfig(tempConfig);
      setTempConfig(null);
      setTestResult(null);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }, [tempConfig, updateConfig]);

  const handleTestConnection = useCallback(async () => {
    const configToTest = tempConfig || aiConfig;
    if (!configToTest) return;
    
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      // Test connection using the API endpoint
      const response = await fetch('/api/ai-chat/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
        },
        body: JSON.stringify({
          provider: configToTest.provider,
          config: {
            baseUrl: configToTest.baseUrl,
            apiKey: configToTest.apiKey,
          },
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Successfully connected to AI service!',
          models: data.models || [],
        });
      } else {
        setTestResult({
          success: false,
          message: data.details || data.message || 'Failed to connect to AI service',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred',
      });
    } finally {
      setIsTestingConnection(false);
    }
  }, [tempConfig, aiConfig]);

  const handleToggleStreaming = useCallback(async () => {
    const newStreamingState = !enableStreaming;
    setEnableStreaming(newStreamingState);
    
    try {
      await updateConfig({ enableStreaming: newStreamingState });
    } catch (error) {
      console.error('Failed to update streaming setting:', error);
      // Revert the state if update failed
      setEnableStreaming(!newStreamingState);
    }
  }, [enableStreaming, updateConfig]);

  // Set this interface as active when component mounts
  useEffect(() => {
    setActiveInterface('chat-page');
  }, [setActiveInterface]);

  // Initialize streaming state from config
  useEffect(() => {
    if (aiConfig?.enableStreaming !== undefined) {
      setEnableStreaming(aiConfig.enableStreaming);
    }
  }, [aiConfig?.enableStreaming]);

  // Load saved AI configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai-service-config');
    if (savedConfig && !aiConfig) {
      try {
        const config = JSON.parse(savedConfig);
        updateConfig(config);
      } catch (error) {
        console.error('Failed to load saved AI config:', error);
      }
    }
  }, [aiConfig, updateConfig]);

  // Sync scroll position when switching to this interface
  useEffect(() => {
    if (chatContainerRef.current && scrollState?.lastActiveInterface !== 'chat-page') {
      const targetScrollTop = syncScrollPosition('chat-page');
      if (targetScrollTop > 0) {
        chatContainerRef.current.scrollTop = targetScrollTop;
      }
    }
  }, [scrollState?.lastActiveInterface, syncScrollPosition]);

  // Handle scroll position updates with debouncing
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Debounce scroll position updates
    scrollTimeoutRef.current = setTimeout(() => {
      updateScrollPosition('chat-page', scrollTop);
    }, 100);
  }, [updateScrollPosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>AI Chat Assistant</h1>
            <div className="connection-status">
              <div className={`status-indicator ${connectionStatus}`} />
              <span className="status-text">{getConnectionStatusText()}</span>
              {currentModel && (
                <span className="model-info">
                  {provider} • {currentModel}
                </span>
              )}
            </div>
          </div>
          <div className="header-actions">
            <button
              className="action-button secondary"
              onClick={() => setShowSettings(!showSettings)}
              title="Chat Settings"
            >
              ⚙️
            </button>
            <button
              className="action-button secondary"
              onClick={handleClearChat}
              title="Clear Chat History"
              disabled={messages.length === 0}
            >
              🗑️
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-tabs">
              <button
                className={`tab-button ${!showAdvancedSettings ? 'active' : ''}`}
                onClick={() => setShowAdvancedSettings(false)}
              >
                Quick Settings
              </button>
              <button
                className={`tab-button ${showAdvancedSettings ? 'active' : ''}`}
                onClick={() => setShowAdvancedSettings(true)}
              >
                Advanced
              </button>
            </div>

            {!showAdvancedSettings ? (
              // Quick Settings Tab
              <div className="quick-settings">
                <div className="setting-group">
                  <label htmlFor="provider-select">AI Provider:</label>
                  <select
                    id="provider-select"
                    value={provider || 'ollama'}
                    onChange={(e) => handleProviderChange(e.target.value as AIServiceConfig['provider'])}
                    disabled={isLoading}
                  >
                    <option value="ollama">Ollama (Local)</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label htmlFor="model-select">AI Model:</label>
                  <select
                    id="model-select"
                    value={currentModel || ''}
                    onChange={(e) => handleModelChange(e.target.value)}
                    disabled={!isConnected || availableModels.length === 0}
                  >
                    <option value="">Select a model...</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {availableModels.length === 0 && isConnected && (
                    <small className="setting-help">No models available</small>
                  )}
                </div>

                <div className="setting-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={enableStreaming}
                      onChange={handleToggleStreaming}
                      disabled={!isConnected}
                    />
                    <span className="checkbox-text">Enable streaming responses</span>
                  </label>
                  <small className="setting-help">
                    Stream responses in real-time for faster interaction
                  </small>
                </div>

                <div className="setting-group connection-status">
                  <label>Connection Status:</label>
                  <div className={`status-display ${connectionStatus}`}>
                    <div className="status-indicator" />
                    <span>{getConnectionStatusText()}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Advanced Settings Tab
              <div className="advanced-settings">
                <div className="setting-group">
                  <label htmlFor="base-url">Base URL:</label>
                  <input
                    id="base-url"
                    type="url"
                    value={tempConfig?.baseUrl || aiConfig?.baseUrl || ''}
                    onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                    placeholder={
                      (tempConfig?.provider || provider) === 'ollama' 
                        ? 'http://localhost:11434'
                        : (tempConfig?.provider || provider) === 'openai'
                        ? 'https://api.openai.com/v1'
                        : 'https://api.anthropic.com'
                    }
                  />
                </div>

                {(tempConfig?.provider || provider) !== 'ollama' && (
                  <div className="setting-group">
                    <label htmlFor="api-key">API Key:</label>
                    <input
                      id="api-key"
                      type="password"
                      value={tempConfig?.apiKey || aiConfig?.apiKey || ''}
                      onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                      placeholder="Enter your API key"
                    />
                    <small className="setting-help">
                      Your API key is stored locally and never sent to our servers.
                    </small>
                  </div>
                )}

                <div className="setting-group">
                  <label htmlFor="default-model">Default Model:</label>
                  <input
                    id="default-model"
                    type="text"
                    value={tempConfig?.model || aiConfig?.model || ''}
                    onChange={(e) => handleConfigChange('model', e.target.value)}
                    placeholder={
                      (tempConfig?.provider || provider) === 'ollama' 
                        ? 'llama2, codellama, etc.'
                        : (tempConfig?.provider || provider) === 'openai'
                        ? 'gpt-3.5-turbo, gpt-4, etc.'
                        : 'claude-3-sonnet-20240229, etc.'
                    }
                  />
                  <small className="setting-help">
                    Leave empty to use the first available model.
                  </small>
                </div>

                <div className="setting-actions">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                  {tempConfig && (
                    <button
                      type="button"
                      className="action-button primary"
                      onClick={handleSaveConfig}
                    >
                      Save Configuration
                    </button>
                  )}
                </div>

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
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}
      </div>

      <div 
        className="chat-page-content"
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!isConnected}
          placeholder={
            isConnected
              ? "Type your message..."
              : "Connect to AI service to start chatting..."
          }
          title="Chat Assistant"
          subtitle={getConnectionStatusText()}
          className="full-screen-chat"
          showTimestamps={true}
          autoScroll={scrollState?.lastActiveInterface === 'chat-page'}
        />
      </div>
    </div>
  );
};