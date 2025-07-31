import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatProvider, useChatContext } from '../../contexts/ChatContext';

// Mock the useAIChat hook
vi.mock('../../hooks/useAIChat', () => ({
  useAIChat: () => ({
    messages: [],
    isLoading: false,
    isConnected: true,
    currentModel: 'test-model',
    availableModels: ['test-model'],
    provider: 'test-provider',
    error: null,
    connectionStatus: 'connected',
    sendMessage: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    clearMessages: vi.fn(),
  }),
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
const IntegrationTestComponent: React.FC = () => {
  const {
    messages,
    scrollState,
    updateScrollPosition,
    setActiveInterface,
    syncScrollPosition,
    clearMessages,
  } = useChatContext();

  const [currentInterface, setCurrentInterface] = React.useState<'chat-page' | 'sticky-chat'>('chat-page');

  const handleSwitchInterface = (newInterface: 'chat-page' | 'sticky-chat') => {
    setActiveInterface(newInterface);
    setCurrentInterface(newInterface);
    
    // Simulate scroll position sync when switching
    const targetScrollTop = syncScrollPosition(newInterface);
    console.log(`Switching to ${newInterface}, synced scroll position: ${targetScrollTop}`);
  };

  const handleScroll = (scrollTop: number) => {
    updateScrollPosition(currentInterface, scrollTop);
  };

  return (
    <div>
      <div data-testid="current-interface">{currentInterface}</div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="scroll-state">{JSON.stringify(scrollState)}</div>
      
      {/* Interface switcher */}
      <div>
        <button 
          data-testid="switch-to-chat"
          onClick={() => handleSwitchInterface('chat-page')}
        >
          Switch to Chat Page
        </button>
        <button 
          data-testid="switch-to-sticky"
          onClick={() => handleSwitchInterface('sticky-chat')}
        >
          Switch to Sticky Chat
        </button>
      </div>

      {/* Scroll simulation */}
      <div>
        <button 
          data-testid="scroll-to-100"
          onClick={() => handleScroll(100)}
        >
          Scroll to 100
        </button>
        <button 
          data-testid="scroll-to-200"
          onClick={() => handleScroll(200)}
        >
          Scroll to 200
        </button>
      </div>

      {/* Clear messages */}
      <button 
        data-testid="clear-all"
        onClick={clearMessages}
      >
        Clear All Messages
      </button>
    </div>
  );
};

describe('Chat Cross-Interface Synchronization Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should maintain scroll position when switching between interfaces', async () => {
    render(
      <ChatProvider>
        <IntegrationTestComponent />
      </ChatProvider>
    );

    // Start on chat page
    expect(screen.getByTestId('current-interface')).toHaveTextContent('chat-page');

    // Scroll to position 100 on chat page
    fireEvent.click(screen.getByTestId('scroll-to-100'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.chatPageScrollTop).toBe(100);
      expect(scrollState.lastActiveInterface).toBe('chat-page');
    });

    // Switch to sticky chat
    fireEvent.click(screen.getByTestId('switch-to-sticky'));

    await waitFor(() => {
      expect(screen.getByTestId('current-interface')).toHaveTextContent('sticky-chat');
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.lastActiveInterface).toBe('sticky-chat');
    });

    // Scroll to position 200 on sticky chat
    fireEvent.click(screen.getByTestId('scroll-to-200'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.stickyChatScrollTop).toBe(200);
      expect(scrollState.chatPageScrollTop).toBe(100); // Should preserve chat page scroll
    });

    // Switch back to chat page
    fireEvent.click(screen.getByTestId('switch-to-chat'));

    await waitFor(() => {
      expect(screen.getByTestId('current-interface')).toHaveTextContent('chat-page');
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.lastActiveInterface).toBe('chat-page');
      // Both scroll positions should be preserved
      expect(scrollState.chatPageScrollTop).toBe(100);
      expect(scrollState.stickyChatScrollTop).toBe(200);
    });
  });

  it('should clear messages and reset scroll positions from both interfaces', async () => {
    render(
      <ChatProvider>
        <IntegrationTestComponent />
      </ChatProvider>
    );

    // Set scroll positions for both interfaces
    fireEvent.click(screen.getByTestId('scroll-to-100'));
    fireEvent.click(screen.getByTestId('switch-to-sticky'));
    fireEvent.click(screen.getByTestId('scroll-to-200'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.chatPageScrollTop).toBe(100);
      expect(scrollState.stickyChatScrollTop).toBe(200);
    });

    // Clear all messages
    fireEvent.click(screen.getByTestId('clear-all'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.chatPageScrollTop).toBe(0);
      expect(scrollState.stickyChatScrollTop).toBe(0);
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
    });
  });

  it('should persist state changes to localStorage', async () => {
    render(
      <ChatProvider>
        <IntegrationTestComponent />
      </ChatProvider>
    );

    // Make some state changes
    fireEvent.click(screen.getByTestId('scroll-to-100'));
    fireEvent.click(screen.getByTestId('switch-to-sticky'));

    // Wait for debounced persistence
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chat_scroll_state',
        expect.stringContaining('"chatPageScrollTop":100')
      );
    }, { timeout: 1000 });
  });
});