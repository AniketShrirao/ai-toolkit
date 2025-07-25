import { Job } from "bullmq";
import { QueueManager, QueueConfig, JobData, JobStatus, JobProgress, JobResult, QueueStats } from "../interfaces/QueueManager.js";
import { Priority } from "@ai-toolkit/shared";
export declare class BullMQManager implements QueueManager {
    private redis;
    private queues;
    private workers;
    private queueEvents;
    private jobProcessors;
    private initialized;
    constructor(redisConfig?: {
        host?: string;
        port?: number;
        password?: string;
        db?: number;
    });
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    isHealthy(): Promise<boolean>;
    createQueue(config: QueueConfig): Promise<void>;
    registerJobProcessor(queueName: string, processor: (job: Job) => Promise<any>): void;
    addJob(queueName: string, jobData: JobData, priority?: Priority): Promise<string>;
    getJob(jobId: string): Promise<JobStatus | null>;
    removeJob(jobId: string): Promise<boolean>;
    retryJob(jobId: string): Promise<boolean>;
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
    private getPriorityValue;
    private mapJobToStatus;
}
//# sourceMappingURL=BullMQManager.d.ts.map