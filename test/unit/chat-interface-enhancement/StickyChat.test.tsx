import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StickyChat } from '../../../packages/web-dashboard/src/components/UI/StickyChat';
import { ChatProvider } from '../../../packages/web-dashboard/src/contexts/ChatContext';

// Mock the ChatContext
const mockChatContext = {
  messages: [],
  isLoading: false,
  unreadCount: 0,
  stickyExpanded: false,
  setStickyExpanded: vi.fn(),
  stickyMinimized: false,
  setStickyMinimized: vi.fn(),
  sendMessage: vi.fn(),
  markAsRead: vi.fn(),
  isConnected: true,
  connectionStatus: 'connected' as const,
  error: null,
  scrollState: {
    chatPageScrollTop: 0,
    stickyChatScrollTop: 0,
    lastActiveInterface: 'chat-page' as const,
    preserveScrollPosition: true,
  },
  updateScrollPosition: vi.fn(),
  setActiveInterface: vi.fn(),
  syncScrollPosition: vi.fn().mockReturnValue(0),
  currentModel: 'llama2',
  provider: 'ollama',
  aiConfig: {
    provider: 'ollama' as const,
    model: 'llama2',
  },
};

// Mock the useChatContext hook
vi.mock('../../../packages/web-dashboard/src/contexts/ChatContext', async () => {
  const actual = await vi.importActual('../../../packages/web-dashboard/src/contexts/ChatContext');
  return {
    ...(actual || {}),
    useChatContext: () => mockChatContext,
  };
});

// Mock the ChatInterface component
vi.mock('../../../packages/web-dashboard/src/components/UI/ChatInterface', () => ({
  ChatInterface: ({ onSendMessage, isLoading, disabled, placeholder, className }: any) => (
    <div data-testid="chat-interface" className={className}>
      <input
        data-testid="message-input"
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          if (e.target.value === 'test message') {
            onSendMessage('test message');
          }
        }}
      />
      {isLoading && <div data-testid="loading">Loading...</div>}
    </div>
  ),
}));

const renderStickyChat = (props = {}) => {
  return render(
    <ChatProvider>
      <StickyChat {...props} />
    </ChatProvider>
  );
};

describe('StickyChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Bubble State (Collapsed)', () => {
    it('should render chat bubble in collapsed state by default', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      expect(bubble).toBeInTheDocument();
      expect(bubble.closest('.sticky-chat')).toHaveClass('collapsed');
    });

    it('should show notification badge when there are unread messages', () => {
      mockChatContext.unreadCount = 3;
      renderStickyChat();
      
      const badge = screen.getByLabelText('3 unread messages');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('should show 99+ for unread count over 99', () => {
      mockChatContext.unreadCount = 150;
      renderStickyChat();
      
      const badge = screen.getByLabelText('150 unread messages');
      expect(badge).toHaveTextContent('99+');
    });

    it('should expand when bubble is clicked', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(bubble);
      
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(true);
      expect(mockChatContext.setActiveInterface).toHaveBeenCalledWith('sticky-chat');
    });

    it('should mark messages as read when expanding with unread messages', () => {
      mockChatContext.unreadCount = 5;
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat.*5 unread messages/i });
      fireEvent.click(bubble);
      
      expect(mockChatContext.markAsRead).toHaveBeenCalled();
    });

    it('should support keyboard activation', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.keyDown(bubble, { key: 'Enter' });
      
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(true);
    });

    it('should support space key activation', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.keyDown(bubble, { key: ' ' });
      
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(true);
    });
  });

  describe('Expanded State', () => {
    beforeEach(() => {
      mockChatContext.stickyExpanded = true;
    });

    it('should render expanded chat interface when expanded', () => {
      renderStickyChat();
      
      const dialog = screen.getByRole('dialog', { name: /chat assistant/i });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('expanded');
      
      const chatInterface = screen.getByTestId('chat-interface');
      expect(chatInterface).toBeInTheDocument();
    });

    it('should show AI Assistant title and connection status', () => {
      renderStickyChat();
      
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('ollama • llama2')).toBeInTheDocument();
    });

    it('should call onNavigateToChat when header is clicked', () => {
      const mockNavigate = vi.fn();
      renderStickyChat({ onNavigateToChat: mockNavigate });
      
      const headerButton = screen.getByRole('button', { name: /open full chat page/i });
      fireEvent.click(headerButton);
      
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should support keyboard navigation to chat page', () => {
      const mockNavigate = vi.fn();
      renderStickyChat({ onNavigateToChat: mockNavigate });
      
      const headerButton = screen.getByRole('button', { name: /open full chat page/i });
      fireEvent.keyDown(headerButton, { key: 'Enter' });
      
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should minimize when minimize button is clicked', () => {
      renderStickyChat();
      
      const minimizeButton = screen.getByRole('button', { name: /minimize chat/i });
      fireEvent.click(minimizeButton);
      
      expect(mockChatContext.setStickyMinimized).toHaveBeenCalledWith(true);
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(false);
    });

    it('should collapse when close button is clicked', () => {
      renderStickyChat();
      
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      fireEvent.click(closeButton);
      
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(false);
    });

    it('should send message through chat interface', async () => {
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'test message' } });
      
      expect(mockChatContext.sendMessage).toHaveBeenCalledWith('test message');
      expect(mockChatContext.setActiveInterface).toHaveBeenCalledWith('sticky-chat');
    });

    it('should handle message sending errors gracefully', async () => {
      mockChatContext.sendMessage.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'test message' } });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to send message from sticky chat:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should collapse when clicking outside', async () => {
      renderStickyChat();
      
      // Click outside the component
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(false);
      });
    });

    it('should not collapse when clicking inside', () => {
      renderStickyChat();
      
      const dialog = screen.getByRole('dialog');
      fireEvent.mouseDown(dialog);
      
      expect(mockChatContext.setStickyExpanded).not.toHaveBeenCalledWith(false);
    });
  });

  describe('Minimized State', () => {
    beforeEach(() => {
      mockChatContext.stickyMinimized = true;
    });

    it('should render minimized indicator when minimized', () => {
      renderStickyChat();
      
      const minimizedButton = screen.getByRole('button', { name: /restore chat/i });
      expect(minimizedButton).toBeInTheDocument();
      expect(minimizedButton.closest('.sticky-chat-minimized')).toBeInTheDocument();
    });

    it('should restores from minimized state when clicked', () => {
      renderStickyChat();
      
      const minimizedButton = screen.getByRole('button', { name: /restore chat/i });
      fireEvent.click(minimizedButton);
      
      expect(mockChatContext.setStickyMinimized).toHaveBeenCalledWith(false);
    });

    it('should support keyboard restoration', () => {
      renderStickyChat();
      
      const minimizedButton = screen.getByRole('button', { name: /restore chat/i });
      fireEvent.keyDown(minimizedButton, { key: 'Enter' });
      
      expect(mockChatContext.setStickyMinimized).toHaveBeenCalledWith(false);
    });

    it('should show notification badge in minimized state', () => {
      mockChatContext.unreadCount = 2;
      renderStickyChat();
      
      const badge = screen.getByLabelText('2 unread messages');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Connection Status Display', () => {
    beforeEach(() => {
      mockChatContext.stickyExpanded = true;
    });

    it('should show connecting status', () => {
      mockChatContext.connectionStatus = 'connecting';
      renderStickyChat();
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should show error status', () => {
      mockChatContext.connectionStatus = 'error';
      renderStickyChat();
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show offline status', () => {
      mockChatContext.connectionStatus = 'disconnected';
      mockChatContext.isConnected = false;
      renderStickyChat();
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should show error banner when connection fails', () => {
      mockChatContext.connectionStatus = 'error';
      mockChatContext.error = 'Failed to connect to AI service';
      renderStickyChat();
      
      const errorBanner = screen.getByRole('alert');
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner).toHaveTextContent('Failed to connect to AI service');
    });

    it('should disable input when not connected', () => {
      mockChatContext.isConnected = false;
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      expect(input).toBeDisabled();
    });

    it('should show appropriate placeholder when not connected', () => {
      mockChatContext.isConnected = false;
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      expect(input).toHaveAttribute('placeholder', 'AI service not connected');
    });

    it('should show connecting placeholder', () => {
      mockChatContext.connectionStatus = 'connecting';
      mockChatContext.isConnected = false;
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      expect(input).toHaveAttribute('placeholder', 'Connecting...');
    });
  });

  describe('Positioning', () => {
    it('should apply bottom-right position by default', () => {
      renderStickyChat();
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveStyle({
        position: 'fixed',
        right: '20px',
        bottom: '20px',
      });
    });

    it('should apply bottom-left position when specified', () => {
      renderStickyChat({ position: 'bottom-left' });
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveStyle({
        position: 'fixed',
        left: '20px',
        bottom: '20px',
      });
    });

    it('should apply custom offset', () => {
      renderStickyChat({ offset: { x: 50, y: 100 } });
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveStyle({
        position: 'fixed',
        right: '50px',
        bottom: '100px',
      });
    });

    it('should add position class for CSS targeting', () => {
      renderStickyChat({ position: 'bottom-left' });
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveClass('position-bottom-left');
    });
  });

  describe('Drag Functionality', () => {
    it('should handle mouse drag start', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.mouseDown(bubble, { clientX: 100, clientY: 200 });
      
      const container = bubble.closest('.sticky-chat');
      expect(container).toHaveClass('dragging');
    });

    it('should not allow dragging when expanded', () => {
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      const dialog = screen.getByRole('dialog');
      fireEvent.mouseDown(dialog, { clientX: 100, clientY: 200 });
      
      expect(dialog).not.toHaveClass('dragging');
    });

    it('should handle touch drag start', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 200 }],
      });
      
      const container = bubble.closest('.sticky-chat');
      expect(container).toHaveClass('dragging');
    });

    it('should constrain position to viewport bounds', () => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      
      // Start drag
      fireEvent.mouseDown(bubble, { clientX: 100, clientY: 200 });
      
      // Try to drag beyond viewport
      fireEvent.mouseMove(document, { clientX: 2000, clientY: 2000 });
      
      // Position should be constrained
      const container = bubble.closest('.sticky-chat');
      const style = window.getComputedStyle(container!);
      
      // The exact values depend on the implementation, but should be within bounds
      expect(parseInt(style.left || '0')).toBeLessThanOrEqual(1024 - 60); // 60px bubble width
      expect(parseInt(style.top || '0')).toBeLessThanOrEqual(768 - 60); // 60px bubble height
    });
  });

  describe('Scroll Position Management', () => {
    beforeEach(() => {
      mockChatContext.stickyExpanded = true;
    });

    it('should handle scroll events with debouncing', async () => {
      vi.useFakeTimers();
      
      renderStickyChat();
      
      const chatContent = screen.getByTestId('chat-interface').closest('.chat-content');
      fireEvent.scroll(chatContent!, { target: { scrollTop: 150 } });
      
      // Should not call immediately due to debouncing
      expect(mockChatContext.updateScrollPosition).not.toHaveBeenCalled();
      
      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(150);
      });
      
      expect(mockChatContext.updateScrollPosition).toHaveBeenCalledWith('sticky-chat', 150);
      
      vi.useRealTimers();
    });

    it('should sync scroll position when expanding', () => {
      mockChatContext.scrollState.lastActiveInterface = 'chat-page';
      mockChatContext.syncScrollPosition.mockReturnValue(100);
      
      renderStickyChat();
      
      expect(mockChatContext.syncScrollPosition).toHaveBeenCalledWith('sticky-chat');
    });

    it('should not sync scroll position if already active', () => {
      mockChatContext.scrollState.lastActiveInterface = 'sticky-chat';
      
      renderStickyChat();
      
      expect(mockChatContext.syncScrollPosition).not.toHaveBeenCalled();
    });
  });

  describe('Window Resize Handling', () => {
    it('should adjust position on window resize', () => {
      renderStickyChat();
      
      // Set a custom position that would be off-screen after resize
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.mouseDown(bubble, { clientX: 100, clientY: 200 });
      fireEvent.mouseMove(document, { clientX: 900, clientY: 600 });
      fireEvent.mouseUp(document);
      
      // Simulate window resize to smaller dimensions
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
      
      fireEvent.resize(window);
      
      // Position should be adjusted to stay within bounds
      const container = bubble.closest('.sticky-chat');
      const style = window.getComputedStyle(container!);
      
      expect(parseInt(style.left || '0')).toBeLessThanOrEqual(800 - 80); // Account for margin
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      expect(bubble).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper ARIA attributes in expanded state', () => {
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      const dialog = screen.getByRole('dialog', { name: /chat assistant/i });
      expect(dialog).toHaveAttribute('aria-expanded', 'true');
    });

    it('should provide screen reader friendly labels for notification badges', () => {
      mockChatContext.unreadCount = 7;
      renderStickyChat();
      
      const badge = screen.getByLabelText('7 unread messages');
      expect(badge).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      expect(screen.getByRole('button', { name: /minimize chat/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close chat/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open full chat page/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation for all interactive elements', () => {
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      const minimizeButton = screen.getByRole('button', { name: /minimize chat/i });
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      const headerButton = screen.getByRole('button', { name: /open full chat page/i });
      
      expect(minimizeButton).toHaveAttribute('tabIndex', expect.any(String));
      expect(closeButton).toHaveAttribute('tabIndex', expect.any(String));
      expect(headerButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      renderStickyChat({ className: 'custom-sticky-chat' });
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveClass('custom-sticky-chat');
    });

    it('should handle missing onNavigateToChat prop', () => {
      mockChatContext.stickyExpanded = true;
      renderStickyChat(); // No onNavigateToChat prop
      
      const headerButton = screen.getByRole('button', { name: /open full chat page/i });
      
      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(headerButton);
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup timers on unmount', () => {
      const { unmount } = renderStickyChat();
      
      // Start a scroll event to create a timeout
      mockChatContext.stickyExpanded = true;
      const chatContent = screen.getByTestId('chat-interface').closest('.chat-content');
      fireEvent.scroll(chatContent!, { target: { scrollTop: 150 } });
      
      // Unmount should not cause any errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderStickyChat();
      
      // Start dragging to add event listeners
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.mouseDown(bubble, { clientX: 100, clientY: 200 });
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
});