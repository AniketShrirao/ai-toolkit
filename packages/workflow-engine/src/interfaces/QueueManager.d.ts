import { Priority, ProcessingOptions } from "@ai-toolkit/shared";
export interface JobData {
    id: string;
    type: string;
    payload: any;
    options?: ProcessingOptions;
    createdAt: Date;
}
export interface JobProgress {
    current: number;
    total: number;
    message?: string;
    data?: any;
}
export interface JobResult {
    success: boolean;
    data?: any;
    error?: string;
    duration: number;
    completedAt: Date;
}
export interface JobStatus {
    id: string;
    status: "waiting" | "active" | "completed" | "failed" | "delayed" | "paused";
    progress?: JobProgress;
    result?: JobResult;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    failedReason?: string;
}
export interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
}
export interface RetryConfig {
    maxRetries: number;
    backoffStrategy: "linear" | "exponential";
    initialDelay: number;
    maxDelay: number;
}
export interface QueueConfig {
    name: string;
    concurrency: number;
    retryConfig: RetryConfig;
    defaultJobOptions?: {
        removeOnComplete?: number;
        removeOnFail?: number;
        delay?: number;
    };
}
export interface QueueManager {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    isHealthy(): Promise<boolean>;
    addJob(queueName: string, jobData: JobData, priority?: Priority): Promise<string>;
    getJob(jobId: string): Promise<JobStatus | null>;
    removeJob(jobId: string): Promise<boolean>;
    retryJob(jobId: string): Promise<boolean>;
    createQueue(config: QueueConfig): Promise<void>;
    pauseQueue(queueName: string): Promise<void>;
    resumeQueue(queueName: string): Promise<void>;
    cleanQueue(queueName: string, grace: number, status?: "completed" | "failed"): Promise<number>;
    getQueueStats(queueName: string): Promise<QueueStats>;
    getActiveJobs(queueName: string): Promise<JobStatus[]>;
    getFailedJobs(queueName: string, limit?: number): Promise<JobStatus[]>;
    getCompletedJobs(queueName: string, limit?: number): Promise<JobStatus[]>;
    onJobProgress(queueName: string, callback: (jobId: string, progress: JobProgress) => void): void;
    onJobCompleted(queueName: string, callback: (jobId: string, result: JobResult) => void): void;
    onJobFailed(queueName: string, callback: (jobId: string, error: string) => void): void;
    addBulkJobs(queueName: string, jobs: Array<{
        data: JobData;
        priority?: Priority;
    }>): Promise<string[]>;
    pauseAllQueues(): Promise<void>;
    resumeAllQueues(): Promise<void>;
    getSystemStats(): Promise<{
        totalQueues: number;
        totalJobs: number;
        activeJobs: number;
        failedJobs: number;
        completedJobs: number;
    }>;
}
//# sourceMappingURL=QueueManager.d.ts.map