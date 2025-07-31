import { useState, useCallback, useEffect } from 'react';
import { useAIService, AIServiceConfig, AIMessage } from './useAIService';
import { ChatMessage } from '../components/UI/ChatInterface';

export interface AIChatConfig extends AIServiceConfig {
  systemPrompt?: string;
  welcomeMessage?: string;
  enableStreaming?: boolean;
}

export const useAIChat = (config?: AIChatConfig) => {
  const aiService = useAIService(); // Don't pass config to prevent auto-initialization
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Sync AI messages with chat messages
  useEffect(() => {
    const convertToChat = (aiMessage: AIMessage): ChatMessage => ({
      id: aiMessage.id,
      content: aiMessage.content,
      type: aiMessage.role === 'user' ? 'user' : 'assistant',
      timestamp: aiMessage.timestamp,
      status: aiMessage.status,
    });

    const chatMsgs = aiService.messages.map(convertToChat);
    setChatMessages(chatMsgs);
  }, [aiService.messages]);

  // Add welcome message when connected
  useEffect(() => {
    if (aiService.isConnected && config?.welcomeMessage && chatMessages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        content: config.welcomeMessage,
        type: 'assistant',
        timestamp: new Date(),
        status: 'sent',
      };
      setChatMessages([welcomeMsg]);
    }
  }, [aiService.isConnected, config?.welcomeMessage, chatMessages.length]);

  // Send message function for chat interface with streaming support
  const sendChatMessage = useCallback(async (content: string) => {
    if (!aiService.isConnected) {
      throw new Error('AI service not connected');
    }

    try {
      setIsTyping(true);
      
      // Add system prompt if configured
      let prompt = content;
      if (config?.systemPrompt) {
        prompt = `${config.systemPrompt}\n\nUser: ${content}`;
      }

      if (config?.enableStreaming) {
        // Handle streaming response
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          content,
          type: 'user',
          timestamp: new Date(),
          status: 'sent',
        };

        const streamingMessage: ChatMessage = {
          id: `streaming-${Date.now()}`,
          content: '',
          type: 'assistant',
          timestamp: new Date(),
          status: 'sending',
        };

        // Add both messages to state
        setChatMessages(prev => [...prev, userMessage, streamingMessage]);
        setStreamingMessageId(streamingMessage.id);

        try {
          // Use streaming API endpoint
          const response = await fetch('/api/ai-chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
            },
            body: JSON.stringify({
              message: prompt,
              provider: config?.provider || 'ollama',
              model: config?.model || aiService.currentModel,
              config: {
                baseUrl: config?.baseUrl,
                apiKey: config?.apiKey,
              },
              options: {
                temperature: 0.7,
                stream: true,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }

          const decoder = new TextDecoder();
          let fullContent = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.type === 'chunk') {
                      fullContent += data.content;
                      setChatMessages(prev => 
                        prev.map(msg => 
                          msg.id === streamingMessage.id 
                            ? { ...msg, content: fullContent, status: 'sending' }
                            : msg
                        )
                      );
                    } else if (data.type === 'complete') {
                      setChatMessages(prev => 
                        prev.map(msg => 
                          msg.id === streamingMessage.id 
                            ? { 
                                ...msg, 
                                content: data.response || fullContent, 
                                status: 'sent'
                              }
                            : msg
                        )
                      );
                      break;
                    } else if (data.type === 'error') {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', parseError);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

        } catch (streamError) {
          console.error('Streaming error:', streamError);
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessage.id 
                ? { 
                    ...msg, 
                    content: 'Sorry, I encountered an error while processing your request.',
                    status: 'error' 
                  }
                : msg
            )
          );
          throw streamError;
        } finally {
          setStreamingMessageId(null);
        }
      } else {
        // Handle regular response
        await aiService.sendMessage(prompt);
      }
    } finally {
      setIsTyping(false);
    }
  }, [aiService, config?.systemPrompt, config?.enableStreaming, config?.provider, config?.model, config?.baseUrl, config?.apiKey]);

  // Initialize with config
  const initialize = useCallback(async (newConfig: AIChatConfig) => {
    await aiService.initializeService(newConfig);
  }, [aiService]);

  // Clear chat messages
  const clearChat = useCallback(() => {
    setChatMessages([]);
    aiService.clearMessages();
  }, [aiService]);

  return {
    // Chat-specific state
    messages: chatMessages,
    isTyping,
    streamingMessageId,
    
    // AI service state
    isConnected: aiService.isConnected,
    isLoading: aiService.isLoading,
    currentModel: aiService.currentModel,
    availableModels: aiService.availableModels,
    provider: aiService.provider,
    error: aiService.error,
    connectionStatus: aiService.connectionStatus,
    
    // Actions
    sendMessage: sendChatMessage,
    initialize,
    switchModel: aiService.switchModel,
    disconnect: aiService.disconnect,
    clearMessages: clearChat,
    healthCheck: aiService.healthCheck,
  };
};