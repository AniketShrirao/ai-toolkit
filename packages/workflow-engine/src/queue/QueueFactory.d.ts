import { QueueManager, RetryConfig } from "../interfaces/QueueManager.js";
export interface QueueManagerConfig {
    redis?: {
        host?: string;
        port?: number;
        password?: string;
        db?: number;
    };
    defaultRetryConfig?: RetryConfig;
    defaultConcurrency?: number;
}
export declare class QueueFactory {
    private static instance;
    static createQueueManager(config?: QueueManagerConfig): Promise<QueueManager>;
    static getInstance(): QueueManager | null;
    static shutdown(): Promise<void>;
}
export declare const QUEUE_NAMES: {
    readonly DOCUMENT_PROCESSING: "document-processing";
    readonly AI_ANALYSIS: "ai-analysis";
    readonly WORKFLOW_EXECUTION: "workflow-execution";
    readonly FILE_OPERATIONS: "file-operations";
    readonly NOTIFICATIONS: "notifications";
};
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
//# sourceMappingURL=QueueFactory.d.ts.map