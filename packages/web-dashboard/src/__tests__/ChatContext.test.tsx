import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChatProvider, useChatContext, EnhancedChatMessage, ChatSession } from '../contexts/ChatContext';
import { AIChatConfig } from '../hooks/useAIChat';

// Mock the useAIChat hook
const mockAIChat = {
  messages: [],
  isLoading: false,
  isConnected: false,
  currentModel: null,
  availableModels: [],
  provider: null,
  error: null,
  connectionStatus: 'disconnected' as const,
  sendMessage: vi.fn(),
  initialize: vi.fn(),
  clearMessages: vi.fn(),
};

vi.mock('../hooks/useAIChat', () => ({
  useAIChat: () => mockAIChat,
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the context
const TestComponent: React.FC = () => {
  const context = useChatContext();
  
  return (
    <div>
      <div data-testid="messages-count">{context.messages.length}</div>
      <div data-testid="unread-count">{context.unreadCount}</div>
      <div data-testid="is-loading">{context.isLoading.toString()}</div>
      <div data-testid="is-connected">{context.isConnected.toString()}</div>
      <div data-testid="sticky-minimized">{context.stickyMinimized.toString()}</div>
      <div data-testid="sticky-expanded">{context.stickyExpanded.toString()}</div>
      <button onClick={() => context.sendMessage('test message')}>Send Message</button>
      <button onClick={() => context.clearMessages()}>Clear Messages</button>
      <button onClick={() => context.markAsRead()}>Mark All Read</button>
      <button onClick={() => context.markMessageAsRead('msg-1')}>Mark Message Read</button>
      <button onClick={() => context.setStickyMinimized(true)}>Minimize Sticky</button>
      <button onClick={() => context.setStickyExpanded(true)}>Expand Sticky</button>
      <button onClick={() => context.createNewSession()}>New Session</button>
    </div>
  );
};

describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Provider Initialization', () => {
    it('should render children without crashing', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
    });

    it('should load initial data from localStorage', () => {
      const savedMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          type: 'user',
          timestamp: new Date().toISOString(),
          isRead: true,
        },
        {
          id: 'msg-2',
          content: 'Hi there',
          type: 'assistant',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      const savedConfig = {
        provider: 'ollama',
        model: 'llama2',
      };

      const savedStickyState = {
        isMinimized: true,
        isExpanded: false,
      };

      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'chat_messages':
            return JSON.stringify(savedMessages);
          case 'chat_ai_config':
            return JSON.stringify(savedConfig);
          case 'chat_sticky_state':
            return JSON.stringify(savedStickyState);
          default:
            return null;
        }
      });

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      expect(screen.getByTestId('sticky-minimized')).toHaveTextContent('true');
      expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('false');
      expect(mockAIChat.initialize).toHaveBeenCalledWith(savedConfig);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load chat data from localStorage:',
        expect.any(Error)
      );
      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');

      consoleSpy.mockRestore();
    });
  });

  describe('Message Management', () => {
    it('should sync messages from AI chat hook', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          type: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
        {
          id: 'msg-2',
          content: 'Hi there',
          type: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIChat.messages = aiMessages;
      mockAIChat.currentModel = 'llama2';
      mockAIChat.provider = 'ollama';

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1'); // Assistant message is unread
      });
    });

    it('should send messages through AI chat hook', async () => {
      mockAIChat.sendMessage.mockResolvedValue(undefined);

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send Message');
      
      await act(async () => {
        sendButton.click();
      });

      expect(mockAIChat.sendMessage).toHaveBeenCalledWith('test message');
    });

    it('should clear messages', async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      const clearButton = screen.getByText('Clear Messages');
      
      await act(async () => {
        clearButton.click();
      });

      expect(mockAIChat.clearMessages).toHaveBeenCalled();
    });

    it('should mark all messages as read', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          type: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIChat.messages = aiMessages;

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      });

      const markReadButton = screen.getByText('Mark All Read');
      
      await act(async () => {
        markReadButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    it('should mark specific message as read', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          type: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIChat.messages = aiMessages;

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      });

      const markMessageReadButton = screen.getByText('Mark Message Read');
      
      await act(async () => {
        markMessageReadButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Sticky Chat State Management', () => {
    it('should manage sticky minimized state', async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('sticky-minimized')).toHaveTextContent('false');

      const minimizeButton = screen.getByText('Minimize Sticky');
      
      await act(async () => {
        minimizeButton.click();
      });

      expect(screen.getByTestId('sticky-minimized')).toHaveTextContent('true');
    });

    it('should manage sticky expanded state', async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('false');

      const expandButton = screen.getByText('Expand Sticky');
      
      await act(async () => {
        expandButton.click();
      });

      expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('true');
    });
  });

  describe('Configuration Management', () => {
    it('should update AI configuration', async () => {
      mockAIChat.initialize.mockResolvedValue(undefined);

      const TestConfigComponent: React.FC = () => {
        const context = useChatContext();
        
        return (
          <div>
            <button 
              onClick={() => context.updateConfig({ provider: 'openai', model: 'gpt-4' })}
            >
              Update Config
            </button>
          </div>
        );
      };

      render(
        <ChatProvider>
          <TestConfigComponent />
        </ChatProvider>
      );

      const updateButton = screen.getByText('Update Config');
      
      await act(async () => {
        updateButton.click();
      });

      expect(mockAIChat.initialize).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'gpt-4',
      });
    });

    it('should handle configuration update errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAIChat.initialize.mockRejectedValue(new Error('Config error'));

      const TestConfigComponent: React.FC = () => {
        const context = useChatContext();
        
        return (
          <div>
            <button 
              onClick={async () => {
                try {
                  await context.updateConfig({ provider: 'openai' });
                } catch (error) {
                  // Expected error - handled in component
                }
              }}
            >
              Update Config
            </button>
          </div>
        );
      };

      render(
        <ChatProvider>
          <TestConfigComponent />
        </ChatProvider>
      );

      const updateButton = screen.getByText('Update Config');
      
      await act(async () => {
        updateButton.click();
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update AI configuration:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Session Management', () => {
    it('should create new session', async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      const newSessionButton = screen.getByText('New Session');
      
      await act(async () => {
        newSessionButton.click();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chat_current_session',
        expect.stringMatching(/^session-\d+-[a-z0-9]+$/)
      );
    });

    it('should load session from localStorage', () => {
      const sessionId = 'session-123';
      const session: ChatSession = {
        id: sessionId,
        title: 'Test Session',
        messages: [
          {
            id: 'msg-1',
            content: 'Hello',
            type: 'user',
            timestamp: new Date(),
            isRead: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        aiConfig: {
          provider: 'ollama',
          model: 'llama2',
        },
      };

      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'chat_current_session':
            return sessionId;
          case 'chat_sessions':
            return JSON.stringify([session]);
          default:
            return null;
        }
      });

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(mockAIChat.initialize).toHaveBeenCalledWith(session.aiConfig);
    });
  });

  describe('Data Persistence', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should persist data to localStorage with debouncing', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          type: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIChat.messages = aiMessages;

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      // Wait for initial render and state sync
      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });

      // Fast-forward timers to trigger debounced persistence
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chat_messages',
        expect.stringContaining('Hello')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chat_sticky_state',
        expect.any(String)
      );
    });

    it('should handle persistence errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          type: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIChat.messages = aiMessages;

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to persist chat data:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Hook Usage', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useChatContext must be used within a ChatProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Loading State Sync', () => {
    it('should sync loading state from AI chat hook', async () => {
      // Start with loading false
      mockAIChat.isLoading = false;

      const { rerender } = render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      // Update loading state to true
      mockAIChat.isLoading = true;

      // Force re-render
      rerender(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
      });
    });
  });

  describe('Unread Count Calculation', () => {
    it('should calculate unread count correctly', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'User message',
          type: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
        {
          id: 'msg-2',
          content: 'Assistant message 1',
          type: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
        {
          id: 'msg-3',
          content: 'Assistant message 2',
          type: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIChat.messages = aiMessages;

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('2'); // 2 assistant messages
      });
    });

    it('should update unread count when marking messages as read', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Assistant message',
          type: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIChat.messages = aiMessages;

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      });

      const markReadButton = screen.getByText('Mark All Read');
      
      await act(async () => {
        markReadButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      });
    });
  });
});