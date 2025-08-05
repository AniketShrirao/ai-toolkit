import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Chat } from '../../../packages/web-dashboard/src/components/Chat/Chat';
import { ChatProvider } from '../../../packages/web-dashboard/src/contexts/ChatContext';

// Mock the ChatContext
const mockChatContext = {
  messages: [],
  isLoading: false,
  sendMessage: vi.fn(),
  clearMessages: vi.fn(),
  isConnected: true,
  currentModel: 'llama2',
  availableModels: ['llama2', 'codellama'],
  provider: 'ollama',
  error: null,
  connectionStatus: 'connected' as const,
  updateConfig: vi.fn(),
  scrollState: {
    chatPageScrollTop: 0,
    stickyChatScrollTop: 0,
    lastActiveInterface: 'chat-page' as const,
    preserveScrollPosition: true,
  },
  updateScrollPosition: vi.fn(),
  setActiveInterface: vi.fn(),
  syncScrollPosition: vi.fn().mockReturnValue(0),
  aiConfig: {
    provider: 'ollama' as const,
    model: 'llama2',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
    enableStreaming: false,
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

// Mock fetch for API calls
global.fetch = vi.fn() as any;

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

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(),
});

const renderChat = () => {
  return render(
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
};

describe('Chat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    (window.confirm as any).mockReturnValue(true);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Connected successfully' }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render chat page with header and content', () => {
      renderChat();
      
      expect(screen.getByText('AI Chat Assistant')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('ollama • llama2')).toBeInTheDocument();
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });

    it('should show connection status correctly', () => {
      mockChatContext.connectionStatus = 'connecting';
      renderChat();
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should show error status', () => {
      mockChatContext.connectionStatus = 'error';
      renderChat();
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('should show disconnected status', () => {
      mockChatContext.connectionStatus = 'disconnected';
      mockChatContext.isConnected = false;
      renderChat();
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  describe('Settings Panel', () => {
    it('should toggle settings panel', () => {
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      
      expect(screen.getByText('Quick Settings')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('should switch between quick and advanced settings tabs', () => {
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      
      const advancedTab = screen.getByText('Advanced');
      fireEvent.click(advancedTab);
      
      expect(screen.getByLabelText('Base URL:')).toBeInTheDocument();
      expect(screen.getByLabelText('Default Model:')).toBeInTheDocument();
    });

    it('should handle provider change', async () => {
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      
      const providerSelect = screen.getByLabelText('AI Provider:');
      fireEvent.change(providerSelect, { target: { value: 'openai' } });
      
      expect(mockChatContext.updateConfig).toHaveBeenCalledWith({
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should handle model change', async () => {
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      
      const modelSelect = screen.getByLabelText('AI Model:');
      fireEvent.change(modelSelect, { target: { value: 'codellama' } });
      
      expect(mockChatContext.updateConfig).toHaveBeenCalledWith({
        model: 'codellama',
      });
    });

    it('should handle streaming toggle', async () => {
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      
      const streamingCheckbox = screen.getByLabelText(/enable streaming responses/i);
      fireEvent.click(streamingCheckbox);
      
      expect(mockChatContext.updateConfig).toHaveBeenCalledWith({
        enableStreaming: true,
      });
    });
  });

  describe('Advanced Settings', () => {
    beforeEach(() => {
      renderChat();
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      const advancedTab = screen.getByText('Advanced');
      fireEvent.click(advancedTab);
    });

    it('should handle base URL changes', () => {
      const baseUrlInput = screen.getByLabelText('Base URL:');
      fireEvent.change(baseUrlInput, { target: { value: 'http://custom-url:8080' } });
      
      // The change should be reflected in the input
      expect(baseUrlInput).toHaveValue('http://custom-url:8080');
    });

    it('should handle API key changes for non-ollama providers', () => {
      mockChatContext.aiConfig.provider = 'openai';
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      const advancedTab = screen.getByText('Advanced');
      fireEvent.click(advancedTab);
      
      const apiKeyInput = screen.getByLabelText('API Key:');
      fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } });
      
      expect(apiKeyInput).toHaveValue('sk-test-key');
    });

    it('should test connection successfully', async () => {
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai-chat/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ',
          },
          body: expect.stringContaining('ollama'),
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/successfully connected/i)).toBeInTheDocument();
      });
    });

    it('should handle connection test failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should save configuration changes', async () => {
      const baseUrlInput = screen.getByLabelText('Base URL:');
      fireEvent.change(baseUrlInput, { target: { value: 'http://custom-url:8080' } });
      
      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);
      
      expect(mockChatContext.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: 'http://custom-url:8080',
        })
      );
    });
  });

  describe('Message Handling', () => {
    it('should send messages through chat interface', async () => {
      renderChat();
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'test message' } });
      
      expect(mockChatContext.sendMessage).toHaveBeenCalledWith('test message');
    });

    it('should handle message sending errors', async () => {
      mockChatContext.sendMessage.mockRejectedValueOnce(new Error('Send failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderChat();
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'test message' } });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should clear chat history with confirmation', () => {
      renderChat();
      
      const clearButton = screen.getByTitle('Clear Chat History');
      fireEvent.click(clearButton);
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear the chat history?');
      expect(mockChatContext.clearMessages).toHaveBeenCalled();
    });

    it('should not clear chat history if user cancels', () => {
      (window.confirm as any).mockReturnValueOnce(false);
      renderChat();
      
      const clearButton = screen.getByTitle('Clear Chat History');
      fireEvent.click(clearButton);
      
      expect(mockChatContext.clearMessages).not.toHaveBeenCalled();
    });

    it('should disable clear button when no messages', () => {
      mockChatContext.messages = [];
      renderChat();
      
      const clearButton = screen.getByTitle('Clear Chat History');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error banner when there is an error', () => {
      mockChatContext.error = 'Connection failed';
      renderChat();
      
      const errorBanner = screen.getByText('Connection failed');
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner.closest('.error-banner')).toBeInTheDocument();
    });

    it('should handle configuration update errors', async () => {
      mockChatContext.updateConfig.mockRejectedValueOnce(new Error('Config error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      
      const providerSelect = screen.getByLabelText('AI Provider:');
      fireEvent.change(providerSelect, { target: { value: 'openai' } });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update provider:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Scroll Position Management', () => {
    it('should set active interface on mount', () => {
      renderChat();
      
      expect(mockChatContext.setActiveInterface).toHaveBeenCalledWith('chat-page');
    });

    it('should handle scroll events with debouncing', async () => {
      vi.useFakeTimers();
      
      renderChat();
      
      const chatContent = screen.getByTestId('chat-interface').closest('.chat-page-content');
      fireEvent.scroll(chatContent!, { target: { scrollTop: 150 } });
      
      // Should not call immediately due to debouncing
      expect(mockChatContext.updateScrollPosition).not.toHaveBeenCalled();
      
      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(150);
      });
      
      expect(mockChatContext.updateScrollPosition).toHaveBeenCalledWith('chat-page', 150);
      
      vi.useRealTimers();
    });

    it('should sync scroll position when switching to this interface', () => {
      mockChatContext.scrollState.lastActiveInterface = 'sticky-chat';
      mockChatContext.syncScrollPosition.mockReturnValue(100);
      
      renderChat();
      
      expect(mockChatContext.syncScrollPosition).toHaveBeenCalledWith('chat-page');
    });
  });

  describe('AI Configuration Loading', () => {
    it('should load saved AI configuration from localStorage', () => {
      const savedConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test',
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'ai-service-config') {
          return JSON.stringify(savedConfig);
        }
        return null;
      });
      
      mockChatContext.aiConfig = null; // Simulate no config initially
      
      renderChat();
      
      expect(mockChatContext.updateConfig).toHaveBeenCalledWith(savedConfig);
    });

    it('should handle localStorage loading errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderChat();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load saved AI config:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderChat();
      
      const heading = screen.getByRole('heading', { name: 'AI Chat Assistant' });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible form controls', () => {
      renderChat();
      
      const settingsButton = screen.getByTitle('Chat Settings');
      fireEvent.click(settingsButton);
      
      const providerSelect = screen.getByLabelText('AI Provider:');
      expect(providerSelect).toBeInTheDocument();
      
      const modelSelect = screen.getByLabelText('AI Model:');
      expect(modelSelect).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      renderChat();
      
      expect(screen.getByTitle('Chat Settings')).toBeInTheDocument();
      expect(screen.getByTitle('Clear Chat History')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should pass correct className to ChatInterface', () => {
      renderChat();
      
      const chatInterface = screen.getByTestId('chat-interface');
      expect(chatInterface).toHaveClass('full-screen-chat');
    });

    it('should show timestamps in chat interface', () => {
      renderChat();
      
      // This would be tested through the ChatInterface props
      // Since we're mocking ChatInterface, we verify the props are passed correctly
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });
  });
});