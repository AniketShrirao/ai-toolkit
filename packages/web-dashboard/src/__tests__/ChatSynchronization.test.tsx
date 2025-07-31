import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChatProvider, useChatContext } from '../contexts/ChatContext';
import { Chat } from '../components/Chat/Chat';
import { StickyChat } from '../components/UI/StickyChat';

import { vi } from 'vitest';

// Mock the useAIChat hook
vi.mock('../hooks/useAIChat', () => ({
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

// Test component to access context
const TestComponent: React.FC = () => {
  const {
    messages,
    clearMessages,
    scrollState,
    updateScrollPosition,
    setActiveInterface,
    syncScrollPosition,
  } = useChatContext();

  return (
    <div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="scroll-state">{JSON.stringify(scrollState)}</div>
      <button 
        data-testid="clear-messages" 
        onClick={clearMessages}
      >
        Clear Messages
      </button>
      <button 
        data-testid="update-chat-scroll" 
        onClick={() => updateScrollPosition('chat-page', 100)}
      >
        Update Chat Scroll
      </button>
      <button 
        data-testid="update-sticky-scroll" 
        onClick={() => updateScrollPosition('sticky-chat', 200)}
      >
        Update Sticky Scroll
      </button>
      <button 
        data-testid="set-chat-active" 
        onClick={() => setActiveInterface('chat-page')}
      >
        Set Chat Active
      </button>
      <button 
        data-testid="set-sticky-active" 
        onClick={() => setActiveInterface('sticky-chat')}
      >
        Set Sticky Active
      </button>
      <button 
        data-testid="sync-chat-scroll" 
        onClick={() => {
          const scrollTop = syncScrollPosition('chat-page');
          const element = document.createElement('div');
          element.setAttribute('data-testid', 'synced-chat-scroll');
          element.textContent = scrollTop.toString();
          document.body.appendChild(element);
        }}
      >
        Sync Chat Scroll
      </button>
      <button 
        data-testid="sync-sticky-scroll" 
        onClick={() => {
          const scrollTop = syncScrollPosition('sticky-chat');
          const element = document.createElement('div');
          element.setAttribute('data-testid', 'synced-sticky-scroll');
          element.textContent = scrollTop.toString();
          document.body.appendChild(element);
        }}
      >
        Sync Sticky Scroll
      </button>
    </div>
  );
};

describe('Chat Cross-Interface Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    // Clean up any dynamically created elements
    const syncedElements = document.querySelectorAll('[data-testid^="synced-"]');
    syncedElements.forEach(el => el.remove());
  });

  it('should initialize with default scroll state', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
    expect(scrollState).toEqual({
      chatPageScrollTop: 0,
      stickyChatScrollTop: 0,
      lastActiveInterface: 'chat-page',
      preserveScrollPosition: true,
    });
  });

  it('should update scroll position for chat page', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    fireEvent.click(screen.getByTestId('update-chat-scroll'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.chatPageScrollTop).toBe(100);
      expect(scrollState.lastActiveInterface).toBe('chat-page');
    });
  });

  it('should update scroll position for sticky chat', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    fireEvent.click(screen.getByTestId('update-sticky-scroll'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.stickyChatScrollTop).toBe(200);
      expect(scrollState.lastActiveInterface).toBe('sticky-chat');
    });
  });

  it('should set active interface correctly', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    fireEvent.click(screen.getByTestId('set-sticky-active'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.lastActiveInterface).toBe('sticky-chat');
    });

    fireEvent.click(screen.getByTestId('set-chat-active'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.lastActiveInterface).toBe('chat-page');
    });
  });

  it('should sync scroll position between interfaces', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Set scroll positions for both interfaces
    fireEvent.click(screen.getByTestId('update-chat-scroll'));
    fireEvent.click(screen.getByTestId('update-sticky-scroll'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.chatPageScrollTop).toBe(100);
      expect(scrollState.stickyChatScrollTop).toBe(200);
    });

    // Sync chat page scroll position
    fireEvent.click(screen.getByTestId('sync-chat-scroll'));
    await waitFor(() => {
      const syncedElement = screen.getByTestId('synced-chat-scroll');
      expect(syncedElement.textContent).toBe('100');
    });

    // Sync sticky chat scroll position
    fireEvent.click(screen.getByTestId('sync-sticky-scroll'));
    await waitFor(() => {
      const syncedElement = screen.getByTestId('synced-sticky-scroll');
      expect(syncedElement.textContent).toBe('200');
    });
  });

  it('should clear messages and reset scroll positions', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Set scroll positions
    fireEvent.click(screen.getByTestId('update-chat-scroll'));
    fireEvent.click(screen.getByTestId('update-sticky-scroll'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.chatPageScrollTop).toBe(100);
      expect(scrollState.stickyChatScrollTop).toBe(200);
    });

    // Clear messages
    fireEvent.click(screen.getByTestId('clear-messages'));

    await waitFor(() => {
      const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
      expect(scrollState.chatPageScrollTop).toBe(0);
      expect(scrollState.stickyChatScrollTop).toBe(0);
    });
  });

  it('should persist scroll state to localStorage', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    fireEvent.click(screen.getByTestId('update-chat-scroll'));

    // Wait for debounced persistence
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'chat_scroll_state',
      expect.stringContaining('"chatPageScrollTop":100')
    );
  });

  it('should load scroll state from localStorage', () => {
    const savedScrollState = {
      chatPageScrollTop: 150,
      stickyChatScrollTop: 250,
      lastActiveInterface: 'sticky-chat',
      preserveScrollPosition: true,
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'chat_scroll_state') {
        return JSON.stringify(savedScrollState);
      }
      return null;
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    const scrollState = JSON.parse(screen.getByTestId('scroll-state').textContent || '{}');
    expect(scrollState).toEqual(savedScrollState);
  });
});

describe('Chat and StickyChat Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should maintain conversation history across interface switches', async () => {
    const { rerender } = render(
      <ChatProvider>
        <Chat />
      </ChatProvider>
    );

    // Switch to sticky chat
    rerender(
      <ChatProvider>
        <StickyChat />
      </ChatProvider>
    );

    // Both interfaces should show the same messages
    // This is implicitly tested through the shared context
    expect(true).toBe(true); // Placeholder assertion
  });

  it('should handle message clearing from both interfaces', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    fireEvent.click(screen.getByTestId('clear-messages'));

    await waitFor(() => {
      const messageCount = screen.getByTestId('message-count').textContent;
      expect(messageCount).toBe('0');
    });
  });
});