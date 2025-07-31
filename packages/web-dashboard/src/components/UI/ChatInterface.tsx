import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatInterface.scss';

// Message types and interfaces
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  maxHeight?: string;
  showTimestamps?: boolean;
  autoScroll?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

// Individual message component
interface MessageProps {
  message: ChatMessage;
  showTimestamp?: boolean;
  className?: string;
}

const Message: React.FC<MessageProps> = ({ 
  message, 
  showTimestamp = false, 
  className = '' 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`message ${message.type} ${className}`}
      role="listitem"
      aria-label={`${message.type === 'user' ? 'You' : 'Assistant'} message`}
    >
      <div className="message-bubble">
        <div className="message-content">
          <pre>
            {message.content}
          </pre>
        </div>
        {showTimestamp && (
          <div className="message-time" aria-label={`Sent at ${formatTime(message.timestamp)}`}>
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

// Loading indicator component
const LoadingMessage: React.FC = () => (
  <div className="message-loading" role="status" aria-label="Assistant is typing">
    <div className="loading-bubble">
      <div className="loading-dots" aria-hidden="true">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState: React.FC = () => (
  <div className="chat-empty" role="status">
    <div className="empty-icon" aria-hidden="true">
      💬
    </div>
    <h3 className="empty-title">Start a conversation</h3>
    <p className="empty-description">
      Send a message to begin chatting with the assistant
    </p>
  </div>
);

// Main ChatInterface component
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message...",
  title = "Chat Assistant",
  subtitle = "Online",
  className = '',
  showTimestamps = false,
  autoScroll = true,
  onTyping,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Handle input changes with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Handle typing indicator
    if (onTyping) {
      if (!isTyping && value.length > 0) {
        setIsTyping(true);
        onTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    }

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || disabled || isLoading) return;

    onSendMessage(trimmedValue);
    setInputValue('');
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // Clear typing indicator
    if (onTyping && isTyping) {
      setIsTyping(false);
      onTyping(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const containerClasses = [
    'modern-chat',
    className,
  ].filter(Boolean).join(' ');

  const hasMessages = messages.length > 0;

  return (
    <div 
      className={containerClasses}
      role="region"
      aria-label="Chat interface"
    >
      {/* Chat Header */}
      <header className="chat-header" role="banner">
        <h2 className="chat-title">{title}</h2>
        <div className="chat-status">
          <div 
            className="status-indicator" 
            aria-label={`Status: ${subtitle}`}
            role="status"
          />
          <span>{subtitle}</span>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        className="chat-messages"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {!hasMessages && !isLoading && <EmptyState />}
        
        {hasMessages && (
          <div role="list" aria-label={`${messages.length} messages`}>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                showTimestamp={showTimestamps}
              />
            ))}
          </div>
        )}
        
        {isLoading && <LoadingMessage />}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input Area */}
      <form 
        className="chat-input"
        onSubmit={handleSubmit}
        role="form"
        aria-label="Send message"
      >
        <div className="input-container">
          <textarea
            ref={inputRef}
            className="message-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            aria-label="Message input"
            aria-describedby="send-button"
            maxLength={2000}
          />
          <button
            id="send-button"
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || disabled || isLoading}
            aria-label={isLoading ? "Sending message..." : "Send message"}
          >
            {isLoading ? (
              <span className="send-icon" aria-hidden="true">⏳</span>
            ) : (
              <span className="send-icon" aria-hidden="true">➤</span>
            )}
            <span className="sr-only">
              {isLoading ? "Sending..." : "Send"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Hook for managing chat state
export const useChatInterface = (initialMessages: ChatMessage[] = []) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((content: string, type: 'user' | 'assistant') => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      timestamp: new Date(),
      status: type === 'user' ? 'sent' : undefined,
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (
    content: string, 
    onResponse?: (response: string) => void
  ) => {
    // Add user message
    const userMessageId = addMessage(content, 'user');
    
    try {
      setIsLoading(true);
      
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add assistant response
      const response = `Echo: ${content}`;
      addMessage(response, 'assistant');
      
      if (onResponse) {
        onResponse(response);
      }
    } catch (error) {
      // Handle error - could update message status or add error message
      updateMessage(userMessageId, { status: 'error' });
      addMessage('Sorry, there was an error processing your message.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateMessage]);

  return {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    sendMessage,
    setIsLoading,
  };
};

// Utility function to create a message
export const createChatMessage = (
  content: string, 
  type: 'user' | 'assistant',
  id?: string
): ChatMessage => ({
  id: id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  content,
  type,
  timestamp: new Date(),
  status: type === 'user' ? 'sent' : undefined,
});

// Types are already exported above with their declarations