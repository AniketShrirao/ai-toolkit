import { useState, useCallback, useRef, useEffect } from 'react';

export interface AIServiceConfig {
  provider: 'ollama' | 'openai' | 'anthropic';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface AIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  metadata?: {
    model?: string;
    provider?: string;
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
    cost?: number;
  };
}

export interface AIServiceState {
  isConnected: boolean;
  isLoading: boolean;
  currentModel: string | null;
  availableModels: string[];
  provider: string | null;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

// Helper function to generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// API base URL - can be configured
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAIService = (initialConfig?: AIServiceConfig) => {
  const [state, setState] = useState<AIServiceState>({
    isConnected: false,
    isLoading: false,
    currentModel: null,
    availableModels: [],
    provider: null,
    error: null,
    connectionStatus: 'disconnected',
  });

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const configRef = useRef<AIServiceConfig | null>(initialConfig || null);

  // Initialize service based on provider
  const initializeService = useCallback(async (config: AIServiceConfig) => {
    setState(prev => ({ ...prev, isLoading: true, connectionStatus: 'connecting', error: null }));
    
    try {
      if (config.provider === 'ollama') {
        // Test Ollama connection directly
        const response = await fetch(`${config.baseUrl || 'http://localhost:11434'}/api/tags`);
        
        if (!response.ok) {
          throw new Error('Failed to connect to Ollama service. Make sure Ollama is running on the specified URL.');
        }
        
        const data = await response.json();
        const modelNames = data.models?.map((m: any) => m.name) || [];
        
        if (modelNames.length === 0) {
          throw new Error('No models available. Please pull a model using: ollama pull llama2');
        }
        
        const defaultModel = config.model || modelNames[0];
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          connectionStatus: 'connected',
          currentModel: defaultModel,
          availableModels: modelNames,
          provider: 'ollama',
        }));
        
      } else {
        // Test cloud service via our API
        if (!config.apiKey) {
          throw new Error(`API key is required for ${config.provider} service`);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/ai-chat/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
          },
          body: JSON.stringify({
            provider: config.provider,
            config: {
              apiKey: config.apiKey,
              baseUrl: config.baseUrl,
            },
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || `Failed to connect to ${config.provider} service`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || `Invalid configuration for ${config.provider} service`);
        }
        
        const modelNames = data.models || [];
        const defaultModel = config.model || modelNames[0];
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          connectionStatus: 'connected',
          currentModel: defaultModel,
          availableModels: modelNames,
          provider: config.provider,
        }));
      }
      
      configRef.current = config;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        connectionStatus: 'error',
        error: errorMessage,
      }));
      console.error('Failed to initialize AI service:', error);
      throw error; // Re-throw to allow calling code to handle
    }
  }, []);

  // Send message to AI service
  const sendMessage = useCallback(async (content: string): Promise<AIMessage> => {
    if (!state.isConnected || !configRef.current) {
      throw new Error('AI service not connected');
    }

    const userMessage: AIMessage = {
      id: generateId('user'),
      content,
      role: 'user',
      timestamp: new Date(),
      status: 'sent',
      metadata: {
        model: state.currentModel || undefined,
        provider: state.provider || undefined,
      },
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      let response: Response;
      let responseData: any;

      if (configRef.current.provider === 'ollama') {
        // Direct Ollama API call
        try {
          response = await fetch(`${configRef.current.baseUrl || 'http://localhost:11434'}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: state.currentModel,
              prompt: content,
              stream: false,
              options: {
                temperature: 0.7,
                num_predict: 2000,
              },
            }),
          });

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Model "${state.currentModel}" not found. Please pull the model using: ollama pull ${state.currentModel}`);
            } else if (response.status >= 500) {
              throw new Error('Ollama server error. Please check if Ollama is running properly.');
            } else {
              throw new Error(`Failed to generate response from Ollama (${response.status})`);
            }
          }

          responseData = await response.json();
        } catch (fetchError) {
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            throw new Error('Failed to connect to Ollama. Please ensure Ollama is running and accessible.');
          }
          throw fetchError;
        }
      } else {
        // Use our API for cloud services
        try {
          response = await fetch(`${API_BASE_URL}/api/ai-chat/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
            },
            body: JSON.stringify({
              message: content,
              provider: configRef.current.provider,
              model: state.currentModel,
              config: {
                apiKey: configRef.current.apiKey,
                baseUrl: configRef.current.baseUrl,
              },
              options: {
                temperature: 0.7,
                maxTokens: 2000,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 401) {
              throw new Error('Authentication failed. Please check your API key.');
            } else if (response.status === 429) {
              throw new Error('Rate limit exceeded. Please wait before sending another message.');
            } else if (response.status >= 500) {
              throw new Error('AI service temporarily unavailable. Please try again later.');
            } else {
              throw new Error(errorData.details || `Failed to generate response (${response.status})`);
            }
          }

          responseData = await response.json();
        } catch (fetchError) {
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection.');
          }
          throw fetchError;
        }
      }

      const assistantMessage: AIMessage = {
        id: generateId('assistant'),
        content: configRef.current.provider === 'ollama' ? responseData.response : responseData.response,
        role: 'assistant',
        timestamp: new Date(),
        status: 'sent',
        metadata: {
          model: state.currentModel || undefined,
          provider: state.provider || undefined,
          tokenUsage: responseData.usage ? {
            input: responseData.usage.input_tokens || responseData.usage.inputTokens,
            output: responseData.usage.output_tokens || responseData.usage.outputTokens,
            total: responseData.usage.total_tokens || responseData.usage.totalTokens,
          } : undefined,
          cost: responseData.cost,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      setState(prev => ({ ...prev, isLoading: false }));

      return assistantMessage;

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate response';
      
      // Update connection status if it's a connection error
      if (errorMessage.includes('Failed to connect') || errorMessage.includes('Network error')) {
        setState(prev => ({ ...prev, connectionStatus: 'error', error: errorMessage }));
      }
      
      const errorResponse: AIMessage = {
        id: generateId('error'),
        content: `Sorry, I encountered an error: ${errorMessage}`,
        role: 'assistant',
        timestamp: new Date(),
        status: 'error',
        metadata: {
          model: state.currentModel || undefined,
          provider: state.provider || undefined,
        },
      };

      setMessages(prev => [...prev, errorResponse]);
      throw error;
    }
  }, [state.isConnected, state.currentModel, state.provider]);

  // Send message with streaming response (simplified for now)
  const sendMessageStream = useCallback(async function* (content: string): AsyncGenerator<string, AIMessage, unknown> {
    // For now, just use regular sendMessage and yield the full response
    // In the future, this could be enhanced with proper streaming
    const message = await sendMessage(content);
    yield message.content;
    return message;
  }, [sendMessage]);

  // Switch model
  const switchModel = useCallback(async (modelName: string) => {
    if (!state.isConnected) {
      throw new Error('AI service not connected');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // For now, just update the state
      // In the future, this could validate the model exists
      setState(prev => ({
        ...prev,
        currentModel: modelName,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      console.error('Failed to switch model:', error);
      throw error;
    }
  }, [state.isConnected]);

  // Disconnect service
  const disconnect = useCallback(async () => {
    configRef.current = null;
    
    setState({
      isConnected: false,
      isLoading: false,
      currentModel: null,
      availableModels: [],
      provider: null,
      error: null,
      connectionStatus: 'disconnected',
    });
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Health check
  const healthCheck = useCallback(async (): Promise<boolean> => {
    if (!configRef.current) return false;

    try {
      if (configRef.current.provider === 'ollama') {
        const response = await fetch(`${configRef.current.baseUrl || 'http://localhost:11434'}/api/tags`);
        return response.ok;
      } else {
        const response = await fetch(`${API_BASE_URL}/api/ai-chat/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
          },
          body: JSON.stringify({
            provider: configRef.current.provider,
            config: {
              apiKey: configRef.current.apiKey,
              baseUrl: configRef.current.baseUrl,
            },
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success;
        }
        return false;
      }
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }, []);

  // Initialize service on mount if config provided
  useEffect(() => {
    if (initialConfig && !state.isConnected && state.connectionStatus === 'disconnected') {
      initializeService(initialConfig);
    }
  }, [initialConfig]); // Remove initializeService from dependencies to prevent infinite loop

  return {
    // State
    ...state,
    messages,
    
    // Actions
    initializeService,
    sendMessage,
    sendMessageStream,
    switchModel,
    disconnect,
    clearMessages,
    healthCheck,
  };
};