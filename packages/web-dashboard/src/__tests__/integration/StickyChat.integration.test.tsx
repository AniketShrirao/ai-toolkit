import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StickyChat } from '../../components/UI/StickyChat';
import { ChatProvider } from '../../contexts/ChatContext';

// Integration test for StickyChat backend API integration
describe('StickyChat Backend Integration', () => {
  // Mock fetch for API calls
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockClear();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  const renderStickyChat = () => {
    return render(
      <ChatProvider>
        <StickyChat />
      </ChatProvider>
    );
  };

  it('should integrate with backend API for message sending', async () => {
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'llama2' }] }),
      }) // For health check/model fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Hello! How can I help you today?',
          model: 'llama2',
          provider: 'ollama',
        }),
      }); // For message send

    renderStickyChat();

    // Expand the chat
    const bubble = screen.getByRole('button', { name: /open chat/i });
    fireEvent.click(bubble);

    // Wait for chat interface to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find and interact with the message input
    const messageInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(messageInput, { target: { value: 'Hello AI' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Verify API was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Hello AI'),
        })
      );
    });

    // Verify response appears in chat
    await waitFor(() => {
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderStickyChat();

    // Expand the chat
    const bubble = screen.getByRole('button', { name: /open chat/i });
    fireEvent.click(bubble);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Try to send a message
    const messageInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText(/sorry, i encountered an error/i)).toBeInTheDocument();
    });
  });

  it('should show connection status correctly', async () => {
    // Mock connection failure
    mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

    renderStickyChat();

    // Expand the chat
    const bubble = screen.getByRole('button', { name: /open chat/i });
    fireEvent.click(bubble);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Should show offline status
    await waitFor(() => {
      expect(screen.getByText(/offline|error/i)).toBeInTheDocument();
    });
  });
});