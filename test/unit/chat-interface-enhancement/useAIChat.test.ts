import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAIChat, AIChatConfig } from '../../../packages/web-dashboard/src/hooks/useAIChat';

// Mock the useAIService hook
const mockAIService = {
  messages: [],
  isConnected: false,
  isLoading: false,
  currentModel: null,
  availableModels: [],
  provider: null,
  error: null,
  connectionStatus: 'disconnected' as const,
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

// Mock fetch for streaming API
global.fetch = vi.fn();

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

describe('useAIChat Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        }),
      },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAIChat());
      
      expect(result.current.messages).toEqual([]);
      expect(result.current.isTyping).toBe(false);
      expect(result.current.streamingMessageId).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with config', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        baseUrl: 'http://localhost:11434',
        systemPrompt: 'You are a helpful assistant',
        welcomeMessage: 'Hello! How can I help you?',
      };

      const { result } = renderHook(() => useAIChat(config));
      
      await act(async () => {
        await result.current.initialize(config);
      });
      
      expect(mockAIService.initializeService).toHaveBeenCalledWith(config);
    });

    it('should add welcome message when connected', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        welcomeMessage: 'Welcome to AI Chat!',
      };

      mockAIService.isConnected = true;

      const { result } = renderHook(() => useAIChat(config));
      
      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('Welcome to AI Chat!');
        expect(result.current.messages[0].type).toBe('assistant');
      });
    });
  });

  describe('Message Synchronization', () => {
    it('should sync messages from AI service', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          role: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
        {
          id: 'msg-2',
          content: 'Hi there!',
          role: 'assistant' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIService.messages = aiMessages;

      const { result } = renderHook(() => useAIChat());
      
      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[0].type).toBe('user');
        expect(result.current.messages[1].type).toBe('assistant');
      });
    });

    it('should convert AI message roles to chat message types', async () => {
      const aiMessages = [
        {
          id: 'msg-1',
          content: 'Test message',
          role: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];

      mockAIService.messages = aiMessages;

      const { result } = renderHook(() => useAIChat());
      
      await waitFor(() => {
        expect(result.current.messages[0].type).toBe('user');
        expect(result.current.messages[0].content).toBe('Test message');
      });
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      mockAIService.isConnected = true;
      mockAIService.sendMessage.mockResolvedValue(undefined);
    });

    it('should send message through AI service', async () => {
      const { result } = renderHook(() => useAIChat());
      
      await act(async () => {
        await result.current.sendMessage('Hello AI');
      });
      
      expect(mockAIService.sendMessage).toHaveBeenCalledWith('Hello AI');
    });

    it('should add system prompt to message', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        systemPrompt: 'You are a helpful assistant.',
      };

      const { result } = renderHook(() => useAIChat(config));
      
      await act(async () => {
        await result.current.sendMessage('Hello');
      });
      
      expect(mockAIService.sendMessage).toHaveBeenCalledWith(
        'You are a helpful assistant.\n\nUser: Hello'
      );
    });

    it('should handle message sending errors', async () => {
      mockAIService.sendMessage.mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useAIChat());
      
      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('Network error');
    });

    it('should throw error when not connected', async () => {
      mockAIService.isConnected = false;
      
      const { result } = renderHook(() => useAIChat());
      
      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('AI service not connected');
    });

    it('should set typing state during message sending', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockAIService.sendMessage.mockReturnValue(promise);
      
      const { result } = renderHook(() => useAIChat());
      
      act(() => {
        result.current.sendMessage('Hello');
      });
      
      expect(result.current.isTyping).toBe(true);
      
      await act(async () => {
        resolvePromise!();
        await promise;
      });
      
      expect(result.current.isTyping).toBe(false);
    });
  });

  describe('Streaming Support', () => {
    beforeEach(() => {
      mockAIService.isConnected = true;
    });

    it('should handle streaming responses', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        enableStreaming: true,
      };

      // Mock streaming response
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"chunk","content":"Hello"}\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"chunk","content":" there!"}\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"complete","response":"Hello there!"}\n'),
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined,
          }),
        releaseLock: vi.fn(),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { result } = renderHook(() => useAIChat(config));
      
      await act(async () => {
        await result.current.sendMessage('Hello');
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/ai-chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ',
        },
        body: expect.stringContaining('Hello'),
      });
      
      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2); // User message + assistant response
        expect(result.current.messages[1].content).toBe('Hello there!');
      });
    });

    it('should handle streaming errors', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        enableStreaming: true,
      };

      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"error","error":"Stream failed"}\n'),
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined,
          }),
        releaseLock: vi.fn(),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { result } = renderHook(() => useAIChat(config));
      
      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('Stream failed');
    });

    it('should handle network errors during streaming', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        enableStreaming: true,
      };

      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useAIChat(config));
      
      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors during streaming', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        enableStreaming: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      
      const { result } = renderHook(() => useAIChat(config));
      
      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle missing response body reader', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        enableStreaming: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        body: null,
      });
      
      const { result } = renderHook(() => useAIChat(config));
      
      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('No response body reader available');
    });

    it('should track streaming message ID', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        enableStreaming: true,
      };

      let resolveRead: (value: any) => void;
      const readPromise = new Promise((resolve) => {
        resolveRead = resolve;
      });

      const mockReader = {
        read: vi.fn().mockReturnValue(readPromise),
        releaseLock: vi.fn(),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { result } = renderHook(() => useAIChat(config));
      
      act(() => {
        result.current.sendMessage('Hello');
      });
      
      // Should have a streaming message ID while streaming
      await waitFor(() => {
        expect(result.current.streamingMessageId).toBeTruthy();
      });
      
      // Complete the stream
      await act(async () => {
        resolveRead!({ done: true, value: undefined });
        await readPromise;
      });
      
      // Should clear streaming message ID when done
      expect(result.current.streamingMessageId).toBeNull();
    });
  });

  describe('Chat Management', () => {
    it('should clear chat messages', () => {
      const { result } = renderHook(() => useAIChat());
      
      act(() => {
        result.current.clearMessages();
      });
      
      expect(mockAIService.clearMessages).toHaveBeenCalled();
    });

    it('should initialize with new config', async () => {
      const { result } = renderHook(() => useAIChat());
      
      const newConfig: AIChatConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test',
      };
      
      await act(async () => {
        await result.current.initialize(newConfig);
      });
      
      expect(mockAIService.initializeService).toHaveBeenCalledWith(newConfig);
    });

    it('should switch models', async () => {
      const { result } = renderHook(() => useAIChat());
      
      await act(async () => {
        await result.current.switchModel('new-model');
      });
      
      expect(mockAIService.switchModel).toHaveBeenCalledWith('new-model');
    });

    it('should disconnect from service', () => {
      const { result } = renderHook(() => useAIChat());
      
      act(() => {
        result.current.disconnect();
      });
      
      expect(mockAIService.disconnect).toHaveBeenCalled();
    });

    it('should perform health check', async () => {
      const { result } = renderHook(() => useAIChat());
      
      await act(async () => {
        await result.current.healthCheck();
      });
      
      expect(mockAIService.healthCheck).toHaveBeenCalled();
    });
  });

  describe('State Synchronization', () => {
    it('should sync connection state', () => {
      mockAIService.isConnected = true;
      mockAIService.connectionStatus = 'connected';
      
      const { result } = renderHook(() => useAIChat());
      
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should sync loading state', () => {
      mockAIService.isLoading = true;
      
      const { result } = renderHook(() => useAIChat());
      
      expect(result.current.isLoading).toBe(true);
    });

    it('should sync model information', () => {
      mockAIService.currentModel = 'llama2';
      mockAIService.availableModels = ['llama2', 'codellama'];
      mockAIService.provider = 'ollama';
      
      const { result } = renderHook(() => useAIChat());
      
      expect(result.current.currentModel).toBe('llama2');
      expect(result.current.availableModels).toEqual(['llama2', 'codellama']);
      expect(result.current.provider).toBe('ollama');
    });

    it('should sync error state', () => {
      mockAIService.error = 'Connection failed';
      
      const { result } = renderHook(() => useAIChat());
      
      expect(result.current.error).toBe('Connection failed');
    });
  });

  describe('Welcome Message Behavior', () => {
    it('should not add welcome message if messages already exist', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        welcomeMessage: 'Welcome!',
      };

      // Simulate existing messages
      mockAIService.messages = [
        {
          id: 'existing-msg',
          content: 'Existing message',
          role: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ];
      mockAIService.isConnected = true;

      const { result } = renderHook(() => useAIChat(config));
      
      await waitFor(() => {
        // Should have the existing message, not the welcome message
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('Existing message');
      });
    });

    it('should not add welcome message if not connected', async () => {
      const config: AIChatConfig = {
        provider: 'ollama',
        model: 'llama2',
        welcomeMessage: 'Welcome!',
      };

      mockAIService.isConnected = false;

      const { result } = renderHook(() => useAIChat(config));
      
      // Wait a bit to ensure no welcome message is added
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      mockAIService.initializeService.mockRejectedValueOnce(new Error('Init failed'));
      
      const { result } = renderHook(() => useAIChat());
      
      await expect(
        act(async () => {
          await result.current.initialize({
            provider: 'ollama',
            model: 'llama2',
          });
        })
      ).rejects.toThrow('Init failed');
    });

    it('should handle model switching errors', async () => {
      mockAIService.switchModel.mockRejectedValueOnce(new Error('Switch failed'));
      
      const { result } = renderHook(() => useAIChat());
      
      await expect(
        act(async () => {
          await result.current.switchModel('new-model');
        })
      ).rejects.toThrow('Switch failed');
    });

    it('should handle health check errors', async () => {
      mockAIService.healthCheck.mockRejectedValueOnce(new Error('Health check failed'));
      
      const { result } = renderHook(() => useAIChat());
      
      await expect(
        act(async () => {
          await result.current.healthCheck();
        })
      ).rejects.toThrow('Health check failed');
    });
  });

  describe('Memory Management', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useAIChat());
      
      // Should not throw any errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle rapid re-renders without memory leaks', async () => {
      const { result, rerender } = renderHook(() => useAIChat());
      
      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender();
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
        });
      }
      
      // Should not cause any issues
      expect(result.current.messages).toBeDefined();
    });
  });
});