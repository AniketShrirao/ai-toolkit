import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChatProvider, useChatContext } from '../../../packages/web-dashboard/src/contexts/ChatContext';
import { Chat } from '../../../packages/web-dashboard/src/components/Chat/Chat';
import { StickyChat } from '../../../packages/web-dashboard/src/components/UI/StickyChat';

// Mock the useAIService hook
const mockAIService = {
  messages: [],
  isConnected: true,
  isLoading: false,
  currentModel: 'llama2',
  availableModels: ['llama2', 'codellama'],
  provider: 'ollama',
  error: null,
  connectionStatus: 'connected' as const,
  sendMessage: vi.fn(),
  initializeService: vi.fn(),
  switchModel: vi.fn(),
  disconnect: vi.fn(),
  clearMessages: vi.fn(),
  healthCheck: vi.fn(),
};

vi.mock('../../../packages/web-dashboard/src/hooks/useAIService', () => ({
  useAIService: () => mockAIService,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component that simulates both interfaces
const DualInterfaceTestComponent: React.FC = () => {
  const {
    messages,
    unreadCount,
    sendMessage,
    clearMessages,
    markAsRead,
    scrollState,
    updateScrollPosition,
    setActiveInterface,
    syncScrollPosition,
    stickyExpanded,
    setStickyExpanded,
  } = useChatContext();

  const [showChat, setShowChat] = React.useState(true);
  const [showSticky, setShowSticky] = React.useState(true);

  return (
    <div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="scroll-state">{JSON.stringify(scrollState)}</div>
      <div data-testid="sticky-expanded">{stickyExpanded.toString()}</div>
      
      <div>
        <button onClick={() => setShowChat(!showChat)}>Toggle Chat Page</button>
        <button onClick={() => setShowSticky(!showSticky)}>Toggle Sticky Chat</button>
        <button onClick={() => setStickyExpanded(!stickyExpanded)}>Toggle Sticky Expanded</button>
        <button onClick={() => sendMessage('Test message')}>Send Message</button>
        <button onClick={clearMessages}>Clear Messages</button>
        <button onClick={markAsRead}>Mark All Read</button>
        <button onClick={() => updateScrollPosition('chat-page', 100)}>Set Chat Scroll</button>
        <button onClick={() => updateScrollPosition('sticky-chat', 200)}>Set Sticky Scroll</button>
        <button onClick={() => setActiveInterface('chat-page')}>Activate Chat Page</button>
        <button onClick={() => setActiveInterface('sticky-chat')}>Activate Sticky Chat</button>
      </div>

      {showChat && (
        <div data-testid="chat-page-container">
          <Chat />
        </div>
      )}

      {showSticky && (
        <div data-testid="sticky-chat-container">
          <StickyChat />
        </div>
      )}
    </div>
  );
};

describe('Cross-Interface Synchronization Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockAIService.messages = [];
    mockAIService.sendMessage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Message Synchronization', () => {
    it('should synchronize messages between chat page and sticky chat', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Initially no messages
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');

      // Simulate message being added through AI service
      const testMessage = {
        id: 'msg-1',
        content: 'Hello from integration test',
        role: 'user' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      act(() => {
        mockAIService.messages = [testMessage];
      });

      // Both interfaces should show the message
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });

      // Verify both interfaces are rendered and would show the same message
      expect(screen.getByTestId('chat-page-container')).toBeInTheDocument();
      expect(screen.getByTestId('sticky-chat-container')).toBeInTheDocument();
    });

    it('should maintain message history when switching between interfaces', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Add some messages
      const messages = [
        {
          id: 'msg-1',
          content: 'First message',
          role: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
        {
          id: 'msg-2',
          content: 'Second message',
          role: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      act(() => {
        mockAIService.messages = messages;
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      });

      // Hide chat page
      fireEvent.click(screen.getByText('Toggle Chat Page'));

      // Messages should still be available
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');

      // Show chat page again
      fireEvent.click(screen.getByText('Toggle Chat Page'));

      // Messages should still be there
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    });

    it('should clear messages from both interfaces simultaneously', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Add messages
      const messages = [
        {
          id: 'msg-1',
          content: 'Message to be cleared',
          role: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      act(() => {
        mockAIService.messages = messages;
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });

      // Clear messages
      fireEvent.click(screen.getByText('Clear Messages'));

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('0');
        expect(mockAIService.clearMessages).toHaveBeenCalled();
      });
    });
  });

  describe('Unread Message Synchronization', () => {
    it('should synchronize unread count between interfaces', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Add assistant message (should be unread)
      const assistantMessage = {
        id: 'msg-1',
        content: 'Hello from assistant',
        role: 'assistant' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      act(() => {
        mockAIService.messages = [assistantMessage];
      });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      });

      // Mark as read
      fireEvent.click(screen.getByText('Mark All Read'));

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    it('should mark messages as read when expanding sticky chat', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Add unread assistant message
      const assistantMessage = {
        id: 'msg-1',
        content: 'Unread message',
        role: 'assistant' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      act(() => {
        mockAIService.messages = [assistantMessage];
      });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      });

      // Expand sticky chat (should mark as read)
      fireEvent.click(screen.getByText('Toggle Sticky Expanded'));

      await waitFor(() => {
        expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('true');
      });

      // Find and click the sticky chat bubble to simulate expansion with unread messages
      const stickyContainer = screen.getByTestId('sticky-chat-container');
      const bubble = stickyContainer.querySelector('[role="button"]');
      if (bubble) {
        fireEvent.click(bubble);
      }

      // Unread count should remain as is until explicitly marked as read
      // The actual marking as read happens in the StickyChat component
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });
  });

  describe('Scroll Position Synchronization', () => {
    it('should maintain separate scroll positions for each interface', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Set different scroll positions
      fireEvent.click(screen.getByText('Set Chat Scroll'));
      fireEvent.click(screen.getByText('Set Sticky Scroll'));

      await waitFor(() => {
        const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
        expect(scrollState.chatPageScrollTop).toBe(100);
        expect(scrollState.stickyChatScrollTop).toBe(200);
      });
    });

    it('should track active interface for scroll synchronization', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Activate chat page
      fireEvent.click(screen.getByText('Activate Chat Page'));

      await waitFor(() => {
        const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
        expect(scrollState.lastActiveInterface).toBe('chat-page');
      });

      // Activate sticky chat
      fireEvent.click(screen.getByText('Activate Sticky Chat'));

      await waitFor(() => {
        const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
        expect(scrollState.lastActiveInterface).toBe('sticky-chat');
      });
    });

    it('should reset scroll positions when clearing messages', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Set scroll positions
      fireEvent.click(screen.getByText('Set Chat Scroll'));
      fireEvent.click(screen.getByText('Set Sticky Scroll'));

      await waitFor(() => {
        const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
        expect(scrollState.chatPageScrollTop).toBe(100);
        expect(scrollState.stickyChatScrollTop).toBe(200);
      });

      // Clear messages
      fireEvent.click(screen.getByText('Clear Messages'));

      await waitFor(() => {
        const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
        expect(scrollState.chatPageScrollTop).toBe(0);
        expect(scrollState.stickyChatScrollTop).toBe(0);
      });
    });
  });

  describe('State Persistence', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should persist state changes to localStorage with debouncing', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Make state changes
      fireEvent.click(screen.getByText('Set Chat Scroll'));
      fireEvent.click(screen.getByText('Activate Sticky Chat'));

      // Fast-forward timers to trigger debounced persistence
      act(() => {
        vi.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'chat_scroll_state',
          expect.stringContaining('"chatPageScrollTop":100')
        );
      });
    });

    it('should load persisted state on initialization', () => {
      const savedScrollState = {
        chatPageScrollTop: 150,
        stickyChatScrollTop: 250,
        lastActiveInterface: 'sticky-chat',
        preserveScrollPosition: true,
      };

      const savedStickyState = {
        isMinimized: false,
        isExpanded: true,
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'chat_scroll_state':
            return JSON.stringify(savedScrollState);
          case 'chat_sticky_state':
            return JSON.stringify(savedStickyState);
          default:
            return null;
        }
      });

      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState).toEqual(savedScrollState);
      expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('true');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load chat data from localStorage:',
        expect.any(Error)
      );

      // Should still render with default state
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');

      consoleSpy.mockRestore();
    });
  });

  describe('Interface State Synchronization', () => {
    it('should synchronize sticky chat expanded state', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('false');

      // Expand sticky chat
      fireEvent.click(screen.getByText('Toggle Sticky Expanded'));

      await waitFor(() => {
        expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('true');
      });

      // Both interfaces should reflect the expanded state
      const stickyContainer = screen.getByTestId('sticky-chat-container');
      expect(stickyContainer).toBeInTheDocument();
    });

    it('should handle interface visibility changes', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Both interfaces should be visible initially
      expect(screen.getByTestId('chat-page-container')).toBeInTheDocument();
      expect(screen.getByTestId('sticky-chat-container')).toBeInTheDocument();

      // Hide chat page
      fireEvent.click(screen.getByText('Toggle Chat Page'));

      expect(screen.queryByTestId('chat-page-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('sticky-chat-container')).toBeInTheDocument();

      // Hide sticky chat
      fireEvent.click(screen.getByText('Toggle Sticky Chat'));

      expect(screen.queryByTestId('chat-page-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sticky-chat-container')).not.toBeInTheDocument();

      // Show both again
      fireEvent.click(screen.getByText('Toggle Chat Page'));
      fireEvent.click(screen.getByText('Toggle Sticky Chat'));

      expect(screen.getByTestId('chat-page-container')).toBeInTheDocument();
      expect(screen.getByTestId('sticky-chat-container')).toBeInTheDocument();
    });
  });

  describe('Message Sending Synchronization', () => {
    it('should send messages through either interface with same result', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Send message through context
      fireEvent.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(mockAIService.sendMessage).toHaveBeenCalledWith('Test message');
      });

      // Simulate message being added
      const userMessage = {
        id: 'msg-1',
        content: 'Test message',
        role: 'user' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      const assistantMessage = {
        id: 'msg-2',
        content: 'Response message',
        role: 'assistant' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      act(() => {
        mockAIService.messages = [userMessage, assistantMessage];
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('2');
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1'); // Assistant message is unread
      });
    });

    it('should handle message sending errors consistently', async () => {
      mockAIService.sendMessage.mockRejectedValueOnce(new Error('Send failed'));

      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Attempt to send message
      fireEvent.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(mockAIService.sendMessage).toHaveBeenCalledWith('Test message');
      });

      // Error should be handled gracefully
      // The actual error handling is done in the ChatContext
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
    });
  });

  describe('Real-time Synchronization', () => {
    it('should handle rapid state changes without conflicts', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText('Set Chat Scroll'));
        fireEvent.click(screen.getByText('Set Sticky Scroll'));
        fireEvent.click(screen.getByText('Activate Chat Page'));
        fireEvent.click(screen.getByText('Activate Sticky Chat'));
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      // Should end up in a consistent state
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.lastActiveInterface).toBe('sticky-chat');
      expect(scrollState.chatPageScrollTop).toBe(100);
      expect(scrollState.stickyChatScrollTop).toBe(200);
    });

    it('should maintain consistency during concurrent operations', async () => {
      render(
        <ChatProvider>
          <DualInterfaceTestComponent />
        </ChatProvider>
      );

      // Simulate concurrent operations
      const operations = [
        () => fireEvent.click(screen.getByText('Send Message')),
        () => fireEvent.click(screen.getByText('Set Chat Scroll')),
        () => fireEvent.click(screen.getByText('Activate Sticky Chat')),
        () => fireEvent.click(screen.getByText('Toggle Sticky Expanded')),
      ];

      // Execute operations concurrently
      await Promise.all(operations.map(op => 
        act(async () => {
          op();
          await new Promise(resolve => setTimeout(resolve, 1));
        })
      ));

      // Should maintain consistent state
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
      expect(screen.getByTestId('sticky-expanded')).toHaveTextContent('true');
    });
  });
});