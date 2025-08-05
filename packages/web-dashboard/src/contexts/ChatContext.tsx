import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '../components/UI/ChatInterface';
import { AIChatConfig, useAIChat } from '../hooks/useAIChat';

// Enhanced ChatMessage interface with read status
export interface EnhancedChatMessage extends ChatMessage {
  isRead?: boolean;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    cost?: number;
  };
}

// Chat session interface for persistence
export interface ChatSession {
  id: string;
  title: string;
  messages: EnhancedChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  aiConfig: AIChatConfig;
}

// Sticky chat state interface
export interface StickyChatState {
  isExpanded: boolean;
  position: { x: number; y: number };
  isMinimized: boolean;
  lastInteraction: Date;
}

// Scroll position state for cross-interface synchronization
export interface ScrollState {
  chatPageScrollTop: number;
  stickyChatScrollTop: number;
  lastActiveInterface: 'chat-page' | 'sticky-chat';
  preserveScrollPosition: boolean;
}

// Context value interface
export interface ChatContextValue {
  // Shared state
  messages: EnhancedChatMessage[];
  isLoading: boolean;
  unreadCount: number;
  currentSession: ChatSession | null;
  
  // AI service state
  isConnected: boolean;
  currentModel: string | null;
  availableModels: string[];
  provider: string | null;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  markAsRead: () => void;
  markMessageAsRead: (messageId: string) => void;
  
  // Configuration
  aiConfig: AIChatConfig | null;
  updateConfig: (config: Partial<AIChatConfig>) => Promise<void>;
  
  // UI state
  stickyMinimized: boolean;
  setStickyMinimized: (minimized: boolean) => void;
  stickyExpanded: boolean;
  setStickyExpanded: (expanded: boolean) => void;
  
  // Cross-interface synchronization
  scrollState: ScrollState;
  updateScrollPosition: (interfaceType: 'chat-page' | 'sticky-chat', scrollTop: number) => void;
  setActiveInterface: (interfaceType: 'chat-page' | 'sticky-chat') => void;
  syncScrollPosition: (targetInterface: 'chat-page' | 'sticky-chat') => number;
  
  // Session management
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  saveSession: () => void;
  getSessions: () => ChatSession[];
  deleteSession: (sessionId: string) => void;
}

// Action types for reducer
type ChatAction =
  | { type: 'SET_MESSAGES'; payload: EnhancedChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: EnhancedChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<EnhancedChatMessage> } }
  | { type: 'MARK_ALL_READ' }
  | { type: 'MARK_MESSAGE_READ'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_STICKY_MINIMIZED'; payload: boolean }
  | { type: 'SET_STICKY_EXPANDED'; payload: boolean }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSession | null }
  | { type: 'SET_AI_CONFIG'; payload: AIChatConfig | null }
  | { type: 'UPDATE_SCROLL_POSITION'; payload: { interfaceType: 'chat-page' | 'sticky-chat'; scrollTop: number } }
  | { type: 'SET_ACTIVE_INTERFACE'; payload: 'chat-page' | 'sticky-chat' }
  | { type: 'SET_SCROLL_STATE'; payload: ScrollState };

// Initial state
interface ChatState {
  messages: EnhancedChatMessage[];
  isLoading: boolean;
  unreadCount: number;
  stickyMinimized: boolean;
  stickyExpanded: boolean;
  currentSession: ChatSession | null;
  aiConfig: AIChatConfig | null;
  scrollState: ScrollState;
}

const initialScrollState: ScrollState = {
  chatPageScrollTop: 0,
  stickyChatScrollTop: 0,
  lastActiveInterface: 'chat-page',
  preserveScrollPosition: true,
};

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  unreadCount: 0,
  stickyMinimized: false,
  stickyExpanded: false,
  currentSession: null,
  aiConfig: null,
  scrollState: initialScrollState,
};

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        unreadCount: action.payload.filter(msg => !msg.isRead && msg.type === 'assistant').length,
      };
    
    case 'ADD_MESSAGE':
      const newMessages = [...state.messages, action.payload];
      return {
        ...state,
        messages: newMessages,
        unreadCount: action.payload.type === 'assistant' && !action.payload.isRead 
          ? state.unreadCount + 1 
          : state.unreadCount,
      };
    
    case 'UPDATE_MESSAGE':
      const updatedMessages = state.messages.map(msg =>
        msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
      );
      return {
        ...state,
        messages: updatedMessages,
        unreadCount: updatedMessages.filter(msg => !msg.isRead && msg.type === 'assistant').length,
      };
    
    case 'MARK_ALL_READ':
      return {
        ...state,
        messages: state.messages.map(msg => ({ ...msg, isRead: true })),
        unreadCount: 0,
      };
    
    case 'MARK_MESSAGE_READ':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload ? { ...msg, isRead: true } : msg
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        unreadCount: 0,
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'SET_STICKY_MINIMIZED':
      return { ...state, stickyMinimized: action.payload };
    
    case 'SET_STICKY_EXPANDED':
      return { ...state, stickyExpanded: action.payload };
    
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    
    case 'SET_AI_CONFIG':
      return { ...state, aiConfig: action.payload };
    
    case 'UPDATE_SCROLL_POSITION':
      const interfaceKey = action.payload.interfaceType === 'chat-page' ? 'chatPageScrollTop' : 'stickyChatScrollTop';
      return {
        ...state,
        scrollState: {
          ...state.scrollState,
          [interfaceKey]: action.payload.scrollTop,
          lastActiveInterface: action.payload.interfaceType,
        },
      };
    
    case 'SET_ACTIVE_INTERFACE':
      return {
        ...state,
        scrollState: {
          ...state.scrollState,
          lastActiveInterface: action.payload,
        },
      };
    
    case 'SET_SCROLL_STATE':
      return { ...state, scrollState: action.payload };
    
    default:
      return state;
  }
}

// Local storage keys
const STORAGE_KEYS = {
  MESSAGES: 'chat_messages',
  SESSIONS: 'chat_sessions',
  CURRENT_SESSION: 'chat_current_session',
  STICKY_STATE: 'chat_sticky_state',
  AI_CONFIG: 'chat_ai_config',
  SCROLL_STATE: 'chat_scroll_state',
} as const;

// Create context
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const aiChat = useAIChat();
  const persistenceTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial data from localStorage
  useEffect(() => {
    try {
      // Load AI config
      const savedConfig = localStorage.getItem(STORAGE_KEYS.AI_CONFIG);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        dispatch({ type: 'SET_AI_CONFIG', payload: config });
        aiChat.initialize(config);
      }

      // Load sticky state
      const savedStickyState = localStorage.getItem(STORAGE_KEYS.STICKY_STATE);
      if (savedStickyState) {
        const stickyState = JSON.parse(savedStickyState);
        dispatch({ type: 'SET_STICKY_MINIMIZED', payload: stickyState.isMinimized || false });
        dispatch({ type: 'SET_STICKY_EXPANDED', payload: stickyState.isExpanded || false });
      }

      // Load scroll state
      const savedScrollState = localStorage.getItem(STORAGE_KEYS.SCROLL_STATE);
      if (savedScrollState) {
        const scrollState = JSON.parse(savedScrollState);
        dispatch({ type: 'SET_SCROLL_STATE', payload: scrollState });
      }

      // Load current session
      const savedSessionId = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (savedSessionId) {
        loadSession(savedSessionId);
      } else {
        // Load messages from legacy storage
        const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        if (savedMessages) {
          const messages = JSON.parse(savedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            isRead: msg.isRead ?? true, // Default to read for legacy messages
          }));
          dispatch({ type: 'SET_MESSAGES', payload: messages });
        }
      }
    } catch (error) {
      console.error('Failed to load chat data from localStorage:', error);
    }
  }, []);

  // Sync with AI chat hook messages
  useEffect(() => {
    const enhancedMessages: EnhancedChatMessage[] = aiChat.messages.map(msg => ({
      ...msg,
      isRead: msg.type === 'user' ? true : false, // User messages are always read, assistant messages default to unread
      metadata: {
        model: aiChat.currentModel || undefined,
        provider: aiChat.provider || undefined,
      },
    }));

    // Only update if messages have actually changed
    if (JSON.stringify(enhancedMessages) !== JSON.stringify(state.messages)) {
      dispatch({ type: 'SET_MESSAGES', payload: enhancedMessages });
    }
  }, [aiChat.messages, aiChat.currentModel, aiChat.provider]);

  // Sync loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: aiChat.isLoading });
  }, [aiChat.isLoading]);

  // Debounced persistence function
  const debouncedPersist = useCallback(() => {
    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
    }
    
    persistenceTimeoutRef.current = setTimeout(() => {
      try {
        // Save messages
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(state.messages));
        
        // Save sticky state
        const stickyState = {
          isMinimized: state.stickyMinimized,
          isExpanded: state.stickyExpanded,
          lastInteraction: new Date(),
        };
        localStorage.setItem(STORAGE_KEYS.STICKY_STATE, JSON.stringify(stickyState));
        
        // Save AI config
        if (state.aiConfig) {
          localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(state.aiConfig));
        }
        
        // Save scroll state
        localStorage.setItem(STORAGE_KEYS.SCROLL_STATE, JSON.stringify(state.scrollState));
        
        // Save current session if exists
        if (state.currentSession) {
          saveSession();
        }
      } catch (error) {
        console.error('Failed to persist chat data:', error);
      }
    }, 500); // 500ms debounce
  }, [state.messages, state.stickyMinimized, state.stickyExpanded, state.aiConfig, state.currentSession, state.scrollState]);

  // Persist data when state changes
  useEffect(() => {
    debouncedPersist();
  }, [debouncedPersist]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }
    };
  }, []);

  // Send message function with retry capability and streaming support
  const sendMessage = useCallback(async (content: string, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      // Check if AI service is connected before attempting to send
      if (!aiChat.isConnected) {
        throw new Error('AI service not connected. Please check your configuration and try again.');
      }

      // Check if streaming is enabled
      if (state.aiConfig?.enableStreaming) {
        // Handle streaming response
        const userMessage: EnhancedChatMessage = {
          id: `user-${Date.now()}`,
          content,
          type: 'user',
          timestamp: new Date(),
          status: 'sent',
          isRead: true,
          metadata: {
            model: aiChat.currentModel || undefined,
            provider: aiChat.provider || undefined,
          },
        };

        let streamingMessage: EnhancedChatMessage = {
          id: `streaming-${Date.now()}`,
          content: '',
          type: 'assistant',
          timestamp: new Date(),
          status: 'sending',
          isRead: false,
          metadata: {
            model: aiChat.currentModel || undefined,
            provider: aiChat.provider || undefined,
          },
        };

        // Add both messages to state
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'ADD_MESSAGE', payload: streamingMessage });
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
          // Use streaming API
          const response = await fetch('/api/ai-chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
            },
            body: JSON.stringify({
              message: content,
              provider: state.aiConfig.provider,
              model: state.aiConfig.model || aiChat.currentModel,
              config: {
                baseUrl: state.aiConfig.baseUrl,
                apiKey: state.aiConfig.apiKey,
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
                      dispatch({
                        type: 'UPDATE_MESSAGE',
                        payload: {
                          id: streamingMessage.id,
                          updates: { content: fullContent, status: 'sending' }
                        }
                      });
                    } else if (data.type === 'complete') {
                      dispatch({
                        type: 'UPDATE_MESSAGE',
                        payload: {
                          id: streamingMessage.id,
                          updates: { 
                            content: data.response || fullContent, 
                            status: 'sent',
                            metadata: {
                              model: data.model,
                              provider: data.provider,
                            }
                          }
                        }
                      });
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
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              id: streamingMessage.id,
              updates: { 
                content: 'Sorry, I encountered an error while processing your request.',
                status: 'error'
              }
            }
          });
          throw streamError;
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        // Use regular non-streaming response
        await aiChat.sendMessage(content);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Check if error is retryable and we haven't exceeded max retries
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isRetryable = errorMessage.includes('Network error') || 
                         errorMessage.includes('temporarily unavailable') ||
                         errorMessage.includes('Rate limit exceeded');
      
      if (isRetryable && retryCount < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return sendMessage(content, retryCount + 1);
      }
      
      throw error;
    }
  }, [aiChat, state.aiConfig, dispatch]);

  // Clear messages function - clears from both interfaces
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    aiChat.clearMessages();
    
    // Reset scroll positions when clearing messages
    dispatch({ 
      type: 'SET_SCROLL_STATE', 
      payload: {
        ...state.scrollState,
        chatPageScrollTop: 0,
        stickyChatScrollTop: 0,
      }
    });
  }, [aiChat, state.scrollState]);

  // Mark all messages as read
  const markAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  // Mark specific message as read
  const markMessageAsRead = useCallback((messageId: string) => {
    dispatch({ type: 'MARK_MESSAGE_READ', payload: messageId });
  }, []);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message || message.type !== 'user') return;
    
    try {
      // Update message status to sending
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { id: messageId, updates: { status: 'sending' } } 
      });
      
      await aiChat.sendMessage(message.content);
      
      // Update message status to sent
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { id: messageId, updates: { status: 'sent' } } 
      });
    } catch (error) {
      console.error('Failed to retry message:', error);
      
      // Update message status back to error
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { id: messageId, updates: { status: 'error' } } 
      });
      
      throw error;
    }
  }, [state.messages, aiChat]);

  // Update AI configuration
  const updateConfig = useCallback(async (config: Partial<AIChatConfig>) => {
    const newConfig = { ...state.aiConfig, ...config } as AIChatConfig;
    dispatch({ type: 'SET_AI_CONFIG', payload: newConfig });
    
    try {
      await aiChat.initialize(newConfig);
    } catch (error) {
      console.error('Failed to update AI configuration:', error);
      // Re-throw the error so calling code can handle it
      throw error;
    }
  }, [state.aiConfig, aiChat]);

  // Sticky chat state management
  const setStickyMinimized = useCallback((minimized: boolean) => {
    dispatch({ type: 'SET_STICKY_MINIMIZED', payload: minimized });
  }, []);

  const setStickyExpanded = useCallback((expanded: boolean) => {
    dispatch({ type: 'SET_STICKY_EXPANDED', payload: expanded });
  }, []);

  // Cross-interface synchronization functions
  const updateScrollPosition = useCallback((interfaceType: 'chat-page' | 'sticky-chat', scrollTop: number) => {
    dispatch({ 
      type: 'UPDATE_SCROLL_POSITION', 
      payload: { interfaceType, scrollTop } 
    });
  }, []);

  const setActiveInterface = useCallback((interfaceType: 'chat-page' | 'sticky-chat') => {
    dispatch({ type: 'SET_ACTIVE_INTERFACE', payload: interfaceType });
  }, []);

  const syncScrollPosition = useCallback((targetInterface: 'chat-page' | 'sticky-chat'): number => {
    const { scrollState } = state;
    
    if (!scrollState.preserveScrollPosition) {
      return 0;
    }

    // Return the scroll position for the target interface
    if (targetInterface === 'chat-page') {
      return scrollState.chatPageScrollTop;
    } else {
      return scrollState.stickyChatScrollTop;
    }
  }, [state.scrollState]);

  // Session management functions
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      aiConfig: state.aiConfig || {
        provider: 'ollama',
        model: 'llama2',
      },
    };
    
    dispatch({ type: 'SET_CURRENT_SESSION', payload: newSession });
    dispatch({ type: 'CLEAR_MESSAGES' });
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, newSession.id);
  }, [state.aiConfig]);

  const loadSession = useCallback((sessionId: string) => {
    try {
      const sessions = getSessions();
      const session = sessions.find(s => s.id === sessionId);
      
      if (session) {
        dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
        dispatch({ type: 'SET_MESSAGES', payload: session.messages });
        dispatch({ type: 'SET_AI_CONFIG', payload: session.aiConfig });
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
        
        // Initialize AI service with session config
        aiChat.initialize(session.aiConfig);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, [aiChat]);

  const saveSession = useCallback(() => {
    if (!state.currentSession) return;
    
    try {
      const sessions = getSessions();
      const updatedSession: ChatSession = {
        ...state.currentSession,
        messages: state.messages,
        updatedAt: new Date(),
        aiConfig: state.aiConfig || state.currentSession.aiConfig,
      };
      
      const sessionIndex = sessions.findIndex(s => s.id === state.currentSession!.id);
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = updatedSession;
      } else {
        sessions.push(updatedSession);
      }
      
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      dispatch({ type: 'SET_CURRENT_SESSION', payload: updatedSession });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [state.currentSession, state.messages, state.aiConfig]);

  const getSessions = useCallback((): ChatSession[] => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (savedSessions) {
        return JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    try {
      const sessions = getSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filteredSessions));
      
      // If deleting current session, clear it
      if (state.currentSession?.id === sessionId) {
        dispatch({ type: 'SET_CURRENT_SESSION', payload: null });
        dispatch({ type: 'CLEAR_MESSAGES' });
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [state.currentSession]);

  // Context value
  const contextValue: ChatContextValue = {
    // Shared state
    messages: state.messages,
    isLoading: state.isLoading,
    unreadCount: state.unreadCount,
    currentSession: state.currentSession,
    
    // AI service state
    isConnected: aiChat.isConnected,
    currentModel: aiChat.currentModel,
    availableModels: aiChat.availableModels,
    provider: aiChat.provider,
    error: aiChat.error,
    connectionStatus: aiChat.connectionStatus,
    
    // Actions
    sendMessage,
    retryMessage,
    clearMessages,
    markAsRead,
    markMessageAsRead,
    
    // Configuration
    aiConfig: state.aiConfig,
    updateConfig,
    
    // UI state
    stickyMinimized: state.stickyMinimized,
    setStickyMinimized,
    stickyExpanded: state.stickyExpanded,
    setStickyExpanded,
    
    // Cross-interface synchronization
    scrollState: state.scrollState,
    updateScrollPosition,
    setActiveInterface,
    syncScrollPosition,
    
    // Session management
    createNewSession,
    loadSession,
    saveSession,
    getSessions,
    deleteSession,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

// Export context for testing
export { ChatContext };