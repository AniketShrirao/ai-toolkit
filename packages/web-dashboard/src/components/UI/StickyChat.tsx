import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { ChatInterface } from './ChatInterface';
import './StickyChat.scss';

export interface StickyChatProps {
  position?: 'bottom-right' | 'bottom-left';
  offset?: { x: number; y: number };
  onNavigateToChat?: () => void;
  className?: string;
}

export const StickyChat: React.FC<StickyChatProps> = ({
  position = 'bottom-right',
  offset = { x: 20, y: 20 },
  onNavigateToChat,
  className = '',
}) => {
  const {
    messages,
    isLoading,
    unreadCount,
    stickyExpanded,
    setStickyExpanded,
    stickyMinimized,
    setStickyMinimized,
    sendMessage,
    markAsRead,
    isConnected,
    connectionStatus,
    error,
    scrollState,
    updateScrollPosition,
    setActiveInterface,
    syncScrollPosition,
    currentModel,
    provider,
    aiConfig,
  } = useChatContext();

  const [isDragging, setIsDragging] = useState(false);
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle bubble click to expand/collapse
  const handleBubbleClick = useCallback(() => {
    if (stickyExpanded) {
      setStickyExpanded(false);
    } else {
      setStickyExpanded(true);
      setActiveInterface('sticky-chat');
      // Mark messages as read when expanding
      if (unreadCount > 0) {
        markAsRead();
      }
    }
  }, [stickyExpanded, setStickyExpanded, unreadCount, markAsRead, setActiveInterface]);

  // Handle header click to navigate to chat page
  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigateToChat) {
      onNavigateToChat();
    }
  }, [onNavigateToChat]);

  // Handle minimize button
  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setStickyMinimized(true);
    setStickyExpanded(false);
  }, [setStickyMinimized, setStickyExpanded]);

  // Handle restore from minimized state
  const handleRestore = useCallback(() => {
    setStickyMinimized(false);
  }, [setStickyMinimized]);

  // Handle message sending with proper error handling
  const handleSendMessage = useCallback(async (content: string) => {
    try {
      setActiveInterface('sticky-chat');
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message from sticky chat:', error);
      // The error is already handled by the ChatContext and useAIChat hook
      // which will add an error message to the chat
    }
  }, [sendMessage, setActiveInterface]);

  // Handle scroll position updates with debouncing
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Debounce scroll position updates
    scrollTimeoutRef.current = setTimeout(() => {
      updateScrollPosition('sticky-chat', scrollTop);
    }, 100);
  }, [updateScrollPosition]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        stickyExpanded &&
        !isDragging
      ) {
        setStickyExpanded(false);
      }
    };

    if (stickyExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [stickyExpanded, setStickyExpanded, isDragging]);

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (stickyExpanded) return; // Don't allow dragging when expanded
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, [stickyExpanded]);

  // Touch event handlers for mobile drag support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (stickyExpanded) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && touch) {
      dragStartRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
  }, [stickyExpanded]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const newX = touch.clientX - dragStartRef.current.x;
    const newY = touch.clientY - dragStartRef.current.y;
    
    // Constrain to viewport with mobile-friendly margins
    const margin = 10;
    const maxX = window.innerWidth - 60 - margin;
    const maxY = window.innerHeight - 60 - margin;
    
    setCustomPosition({
      x: Math.max(margin, Math.min(newX, maxX)),
      y: Math.max(margin, Math.min(newY, maxY)),
    });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 60; // Bubble width
    const maxY = window.innerHeight - 60; // Bubble height
    
    setCustomPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize to keep position valid
  useEffect(() => {
    const handleResize = () => {
      if (customPosition) {
        const margin = 20;
        const maxX = window.innerWidth - 60 - margin;
        const maxY = window.innerHeight - 60 - margin;
        
        // Adjust position if it's now off-screen
        if (customPosition.x > maxX || customPosition.y > maxY) {
          setCustomPosition({
            x: Math.min(customPosition.x, maxX),
            y: Math.min(customPosition.y, maxY),
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [customPosition]);

  // Sync scroll position when expanding sticky chat
  useEffect(() => {
    if (stickyExpanded && chatContentRef.current && scrollState?.lastActiveInterface !== 'sticky-chat') {
      const targetScrollTop = syncScrollPosition('sticky-chat');
      if (targetScrollTop > 0) {
        chatContentRef.current.scrollTop = targetScrollTop;
      }
    }
  }, [stickyExpanded, scrollState?.lastActiveInterface, syncScrollPosition]);

  // Reset position when navigating between pages to prevent off-screen issues
  useEffect(() => {
    // Reset custom position if it would place the chat off-screen
    if (customPosition) {
      const margin = 20;
      const maxX = window.innerWidth - 60 - margin;
      const maxY = window.innerHeight - 60 - margin;
      
      if (customPosition.x > maxX || customPosition.y > maxY || customPosition.x < margin || customPosition.y < margin) {
        setCustomPosition(null); // Reset to default position
      }
    }
  }, [customPosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Calculate position styles
  const getPositionStyles = (): React.CSSProperties => {
    if (customPosition) {
      return {
        position: 'fixed',
        left: `${customPosition.x}px`,
        top: `${customPosition.y}px`,
        right: 'auto',
        bottom: 'auto',
        zIndex: 1000,
      };
    }

    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    if (position === 'bottom-right') {
      return {
        ...baseStyles,
        right: `${offset.x}px`,
        bottom: `${offset.y}px`,
      };
    } else {
      return {
        ...baseStyles,
        left: `${offset.x}px`,
        bottom: `${offset.y}px`,
      };
    }
  };

  // Get connection status display
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'Online', className: 'connected' };
      case 'connecting':
        return { text: 'Connecting...', className: 'connecting' };
      case 'error':
        return { text: 'Error', className: 'error' };
      default:
        return { text: 'Offline', className: 'disconnected' };
    }
  };

  const status = getConnectionStatus();
  const containerClasses = [
    'sticky-chat',
    className,
    stickyExpanded ? 'expanded' : 'collapsed',
    stickyMinimized ? 'minimized' : '',
    isDragging ? 'dragging' : '',
    status.className,
    `position-${position}`, // Add position class for CSS targeting
  ].filter(Boolean).join(' ');

  // Don't render if minimized
  if (stickyMinimized) {
    return (
      <div
        className="sticky-chat-minimized"
        style={getPositionStyles()}
        onClick={handleRestore}
        role="button"
        aria-label="Restore chat"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRestore();
          }
        }}
      >
        <div className="minimized-indicator">
          <span className="chat-icon" aria-hidden="true">💬</span>
          {unreadCount > 0 && (
            <div className="notification-badge" aria-label={`${unreadCount} unread messages`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={getPositionStyles()}
      role="dialog"
      aria-label="Chat assistant"
      aria-expanded={stickyExpanded}
    >
      {/* Chat Bubble (collapsed state) */}
      {!stickyExpanded && (
        <div
          className="chat-bubble"
          onClick={handleBubbleClick}
          onMouseDown={handleMouseDown}
          role="button"
          aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread messages)` : ''}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBubbleClick();
            }
          }}
        >
          <div className="bubble-content">
            <span className="chat-icon" aria-hidden="true">💬</span>
            {unreadCount > 0 && (
              <div className="notification-badge" aria-label={`${unreadCount} unread messages`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Chat Interface */}
      {stickyExpanded && (
        <div className="chat-expanded">
          {/* Header */}
          <div className="chat-header">
            <div 
              className="header-content"
              onClick={handleHeaderClick}
              role="button"
              aria-label="Open full chat page"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleHeaderClick(e as any);
                }
              }}
            >
              <div className="header-info">
                <h3 className="chat-title">AI Assistant</h3>
                <div className={`status-indicator ${status.className}`}>
                  <span className="status-dot" aria-hidden="true"></span>
                  <span className="status-text">{status.text}</span>
                  {currentModel && provider && (
                    <span className="model-info">
                      {provider} • {currentModel}
                    </span>
                  )}
                </div>
              </div>
              <div className="header-icon" aria-hidden="true">↗</div>
            </div>
            
            <div className="header-actions">
              <button
                className="minimize-button"
                onClick={handleMinimize}
                aria-label="Minimize chat"
                title="Minimize"
              >
                <span aria-hidden="true">−</span>
              </button>
              <button
                className="close-button"
                onClick={handleBubbleClick}
                aria-label="Close chat"
                title="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && connectionStatus === 'error' && (
            <div className="error-banner" role="alert">
              <div className="error-content">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div 
            className="chat-content"
            ref={chatContentRef}
            onScroll={handleScroll}
          >
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={!isConnected}
              placeholder={
                !isConnected 
                  ? "AI service not connected" 
                  : connectionStatus === 'connecting'
                  ? "Connecting..."
                  : "Type your message..."
              }
              title=""
              subtitle=""
              className="sticky-chat-interface"
              showTimestamps={false}
              autoScroll={scrollState?.lastActiveInterface === 'sticky-chat'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyChat;