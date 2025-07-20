import React from 'react';
import { ConnectionStatus } from '@hooks/useWebSocket';
import './StatusIndicator.css';
type StatusType = ConnectionStatus | 'connected' | 'disconnected' | 'warning' | 'success' | 'error';
interface StatusIndicatorProps {
    status: StatusType;
    lastUpdate?: Date | null;
    label?: string;
}
export declare const StatusIndicator: React.FC<StatusIndicatorProps>;
export {};
//# sourceMappingURL=StatusIndicator.d.ts.map