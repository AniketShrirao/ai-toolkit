import { Priority, ProcessingOptions } from '@ai-toolkit/shared';

export interface QueueManager {
  // Job management
  addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<string>; // Returns job ID

  getJob(jobId: string): Promise<Job | null>;
  
  removeJob(jobId: string): Promise<boolean>;

  // Queue operations
  createQueue(
    name: string,
    options?: QueueOptions
  ): Promise<boolean>;

  deleteQueue(name: string): Promise<boolean>;
  
  pauseQueue(name: string): Promise<boolean>;
  
  resumeQueue(name: string): Promise<boolean>;
  
  drainQueue(name: string): Promise<boolean>;

  // Job processing
  processJobs<T = any>(
    queueName: string,
    processor: JobProcessor<T>,
    concurrency?: number
  ): Promise<void>;

  // Monitoring
  getQueueStatus(queueName: string): Promise<QueueStatus>;
  
  getAllQueues(): Promise<QueueInfo[]>;
  
  getJobCounts(queueName: string): Promise<JobCounts>;

  // Job control
  retryJob(jobId: string): Promise<boolean>;
  
  retryFailedJobs(queueName: string): Promise<number>;
  
  cleanCompletedJobs(
    queueName: string,
    olderThan?: Date
  ): Promise<number>;

  // Scheduling
  scheduleJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    scheduleTime: Date,
    options?: JobOptions
  ): Promise<string>;

  scheduleRecurringJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    cronExpression: string,
    options?: JobOptions
  ): Promise<string>;

  // Event handling
  onJobCompleted(callback: (job: Job, result: any) => void): void;
  onJobFailed(callback: (job: Job, error: Error) => void): void;
  onJobProgress(callback: (job: Job, progress: number) => void): void;
  onJobStalled(callback: (job: Job) => void): void;
}

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  opts: JobOptions;
  progress: number;
  returnvalue?: any;
  failedReason?: string;
  stacktrace?: string[];
  attemptsMade: number;
  processedOn?: Date;
  finishedOn?: Date;
  timestamp: Date;
}

export interface JobOptions {
  priority?: Priority;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number | boolean;
  removeOnFail?: number | boolean;
  timeout?: number;
  jobId?: string;
}

export interface QueueOptions {
  defaultJobOptions?: JobOptions;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  settings?: {
    stalledInterval?: number;
    maxStalledCount?: number;
  };
}

export interface JobProcessor<T = any> {
  (job: Job<T>): Promise<any>;
}

export interface QueueStatus {
  name: string;
  isPaused: boolean;
  isProcessing: boolean;
  counts: JobCounts;
}

export interface QueueInfo {
  name: string;
  status: QueueStatus;
  workers: number;
  processed: number;
  failed: number;
}

export interface JobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}