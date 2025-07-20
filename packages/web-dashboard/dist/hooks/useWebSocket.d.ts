import React, { ReactNode } from 'react';
import { Socket } from 'socket.io-client';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
interface WebSocketContextType {
    socket: Socket | null;
    connectionStatus: ConnectionStatus;
    lastUpdate: Date | null;
    emit: (event: string, data?: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback?: (data: any) => void) => void;
}
interface WebSocketProviderProps {
    children: ReactNode;
    url?: string;
}
export declare const WebSocketProvider: React.FC<WebSocketProviderProps>;
export declare const useWebSocket: () => WebSocketContextType;
export {};
//# sourceMappingURL=useWebSocket.d.ts.map