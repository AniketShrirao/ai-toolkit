export interface SystemStatus {
    websocket: 'connected' | 'disconnected' | 'connecting' | 'error';
    ollama: 'connected' | 'disconnected' | 'checking';
    queue: 'idle' | 'processing' | 'error';
}
export interface ActivityItem {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}
export interface DocumentItem {
    id: string;
    name: string;
    type: string;
    size: number;
    status: 'pending' | 'processing' | 'completed' | 'error';
    uploadedAt: Date;
    processedAt?: Date;
}
export interface WorkflowExecution {
    id: string;
    name: string;
    status: 'running' | 'completed' | 'failed' | 'queued';
    startedAt: Date;
    completedAt?: Date;
    progress: number;
}
export interface SystemConfig {
    ollamaUrl: string;
    defaultModel: string;
    autoProcess: boolean;
    notifications: boolean;
    maxConcurrentJobs: number;
}
//# sourceMappingURL=index.d.ts.map