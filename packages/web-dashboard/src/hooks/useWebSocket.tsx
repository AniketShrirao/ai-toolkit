import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketContextType {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  lastUpdate: Date | null;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = 'http://localhost:3001', // Default API server URL
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      setConnectionStatus('error');
      console.error('WebSocket connection error:', error);
    });

    newSocket.on('reconnect', () => {
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      console.log('WebSocket reconnected');
    });

    // Generic message handler for updates
    newSocket.on('status_update', () => {
      setLastUpdate(new Date());
    });

    return () => {
      newSocket.close();
    };
  }, [url]);

  const emit = (event: string, data?: any) => {
    if (socket && connectionStatus === 'connected') {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value: WebSocketContextType = {
    socket,
    connectionStatus,
    lastUpdate,
    emit,
    on,
    off,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};