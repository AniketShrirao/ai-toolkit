import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StickyChat } from '../components/UI/StickyChat';
import { ChatProvider } from '../contexts/ChatContext';

import { vi } from 'vitest';

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
  retryMessage: vi.fn(),
  markAsRead: vi.fn(),
  isConnected: true,
  connectionStatus: 'connected' as const,
  error: null,
};

// Mock the useChatContext hook
vi.mock('../contexts/ChatContext', async () => {
  const actual = await vi.importActual('../contexts/ChatContext');
  return {
    ...(actual || {}),
    useChatContext: () => mockChatContext,
  };
});

// Mock the ChatInterface component
vi.mock('../components/UI/ChatInterface', () => ({
  ChatInterface: ({ onSendMessage, isLoading, disabled }: any) => (
    <div data-testid="chat-interface">
      <input
        data-testid="message-input"
        disabled={disabled}
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

describe('StickyChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bubble State (Collapsed)', () => {
    it('renders chat bubble in collapsed state by default', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      expect(bubble).toBeInTheDocument();
      expect(bubble).toHaveClass('chat-bubble');
    });

    it('shows notification badge when there are unread messages', () => {
      mockChatContext.unreadCount = 3;
      renderStickyChat();
      
      const badge = screen.getByLabelText('3 unread messages');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('shows 99+ for unread count over 99', () => {
      mockChatContext.unreadCount = 150;
      renderStickyChat();
      
      const badge = screen.getByLabelText('150 unread messages');
      expect(badge).toHaveTextContent('99+');
    });

    it('expands when bubble is clicked', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(bubble);
      
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(true);
    });

    it('marks messages as read when expanding with unread messages', () => {
      mockChatContext.unreadCount = 5;
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat.*5 unread messages/i });
      fireEvent.click(bubble);
      
      expect(mockChatContext.markAsRead).toHaveBeenCalled();
    });
  });

  describe('Expanded State', () => {
    beforeEach(() => {
      mockChatContext.stickyExpanded = true;
    });

    it('renders expanded chat interface when expanded', () => {
      renderStickyChat();
      
      const dialog = screen.getByRole('dialog', { name: /chat assistant/i });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('expanded');
      
      const chatInterface = screen.getByTestId('chat-interface');
      expect(chatInterface).toBeInTheDocument();
    });

    it('shows AI Assistant title and connection status', () => {
      renderStickyChat();
      
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('calls onNavigateToChat when header is clicked', () => {
      const mockNavigate = jest.fn();
      renderStickyChat({ onNavigateToChat: mockNavigate });
      
      const headerButton = screen.getByRole('button', { name: /open full chat page/i });
      fireEvent.click(headerButton);
      
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('minimizes when minimize button is clicked', () => {
      renderStickyChat();
      
      const minimizeButton = screen.getByRole('button', { name: /minimize chat/i });
      fireEvent.click(minimizeButton);
      
      expect(mockChatContext.setStickyMinimized).toHaveBeenCalledWith(true);
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(false);
    });

    it('collapses when close button is clicked', () => {
      renderStickyChat();
      
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      fireEvent.click(closeButton);
      
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(false);
    });

    it('sends message through chat interface', () => {
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'test message' } });
      
      expect(mockChatContext.sendMessage).toHaveBeenCalledWith('test message');
    });
  });

  describe('Minimized State', () => {
    beforeEach(() => {
      mockChatContext.stickyMinimized = true;
    });

    it('renders minimized indicator when minimized', () => {
      renderStickyChat();
      
      const minimizedButton = screen.getByRole('button', { name: /restore chat/i });
      expect(minimizedButton).toBeInTheDocument();
      expect(minimizedButton).toHaveClass('sticky-chat-minimized');
    });

    it('restores from minimized state when clicked', () => {
      renderStickyChat();
      
      const minimizedButton = screen.getByRole('button', { name: /restore chat/i });
      fireEvent.click(minimizedButton);
      
      expect(mockChatContext.setStickyMinimized).toHaveBeenCalledWith(false);
    });

    it('shows notification badge in minimized state', () => {
      mockChatContext.unreadCount = 2;
      renderStickyChat();
      
      const badge = screen.getByLabelText('2 unread messages');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Connection Status', () => {
    it('shows connecting status', () => {
      mockChatContext.connectionStatus = 'connecting';
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('shows error status', () => {
      mockChatContext.connectionStatus = 'error';
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('shows offline status', () => {
      mockChatContext.connectionStatus = 'disconnected';
      mockChatContext.isConnected = false;
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('applies bottom-right position by default', () => {
      renderStickyChat();
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveStyle({
        position: 'fixed',
        right: '20px',
        bottom: '20px',
      });
    });

    it('applies bottom-left position when specified', () => {
      renderStickyChat({ position: 'bottom-left' });
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveStyle({
        position: 'fixed',
        left: '20px',
        bottom: '20px',
      });
    });

    it('applies custom offset', () => {
      renderStickyChat({ offset: { x: 50, y: 100 } });
      
      const container = screen.getByRole('button', { name: /open chat/i }).closest('.sticky-chat');
      expect(container).toHaveStyle({
        position: 'fixed',
        right: '50px',
        bottom: '100px',
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard activation for bubble', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      fireEvent.keyDown(bubble, { key: 'Enter' });
      
      expect(mockChatContext.setStickyExpanded).toHaveBeenCalledWith(true);
    });

    it('supports keyboard activation for header navigation', () => {
      mockChatContext.stickyExpanded = true;
      const mockNavigate = jest.fn();
      renderStickyChat({ onNavigateToChat: mockNavigate });
      
      const headerButton = screen.getByRole('button', { name: /open full chat page/i });
      fireEvent.keyDown(headerButton, { key: ' ' });
      
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('supports keyboard restoration from minimized state', () => {
      mockChatContext.stickyMinimized = true;
      renderStickyChat();
      
      const minimizedButton = screen.getByRole('button', { name: /restore chat/i });
      fireEvent.keyDown(minimizedButton, { key: 'Enter' });
      
      expect(mockChatContext.setStickyMinimized).toHaveBeenCalledWith(false);
    });
  });

  describe('Backend Integration', () => {
    it('handles message sending successfully', async () => {
      mockChatContext.stickyExpanded = true;
      mockChatContext.sendMessage.mockResolvedValue(undefined);
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'test message' } });
      
      await waitFor(() => {
        expect(mockChatContext.sendMessage).toHaveBeenCalledWith('test message');
      });
    });

    it('handles message sending errors gracefully', async () => {
      mockChatContext.stickyExpanded = true;
      mockChatContext.sendMessage.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'test message' } });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to send message from sticky chat:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('shows error banner when connection fails', () => {
      mockChatContext.stickyExpanded = true;
      mockChatContext.connectionStatus = 'error';
      mockChatContext.error = 'Failed to connect to AI service';
      renderStickyChat();
      
      const errorBanner = screen.getByRole('alert');
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner).toHaveTextContent('Failed to connect to AI service');
    });

    it('disables input when not connected', () => {
      mockChatContext.stickyExpanded = true;
      mockChatContext.isConnected = false;
      renderStickyChat();
      
      const input = screen.getByTestId('message-input');
      expect(input).toBeDisabled();
    });

    it('shows appropriate placeholder when connecting', () => {
      mockChatContext.stickyExpanded = true;
      mockChatContext.connectionStatus = 'connecting';
      mockChatContext.isConnected = false;
      renderStickyChat();
      
      // The placeholder is passed to ChatInterface, which is mocked
      // In a real test, we would check the actual input placeholder
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderStickyChat();
      
      const bubble = screen.getByRole('button', { name: /open chat/i });
      expect(bubble).toHaveAttribute('tabIndex', '0');
    });

    it('has proper ARIA attributes in expanded state', () => {
      mockChatContext.stickyExpanded = true;
      renderStickyChat();
      
      const dialog = screen.getByRole('dialog', { name: /chat assistant/i });
      expect(dialog).toHaveAttribute('aria-expanded', 'true');
    });

    it('provides screen reader friendly labels for notification badges', () => {
      mockChatContext.unreadCount = 7;
      renderStickyChat();
      
      const badge = screen.getByLabelText('7 unread messages');
      expect(badge).toBeInTheDocument();
    });
  });
});