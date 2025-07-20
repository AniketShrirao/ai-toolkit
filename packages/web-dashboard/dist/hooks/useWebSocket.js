import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const WebSocketContext = createContext(undefined);
export const WebSocketProvider = ({ children, url = 'http://localhost:3001', // Default API server URL
 }) => {
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [lastUpdate, setLastUpdate] = useState(null);
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
    const emit = (event, data) => {
        if (socket && connectionStatus === 'connected') {
            socket.emit(event, data);
        }
    };
    const on = (event, callback) => {
        if (socket) {
            socket.on(event, callback);
        }
    };
    const off = (event, callback) => {
        if (socket) {
            socket.off(event, callback);
        }
    };
    const value = {
        socket,
        connectionStatus,
        lastUpdate,
        emit,
        on,
        off,
    };
    return (_jsx(WebSocketContext.Provider, { value: value, children: children }));
};
export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
//# sourceMappingURL=useWebSocket.js.map