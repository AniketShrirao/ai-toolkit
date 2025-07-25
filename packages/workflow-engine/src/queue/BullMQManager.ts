import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import {
  QueueManager,
  QueueConfig,
  JobData,
  JobStatus,
  JobProgress,
  JobResult,
  QueueStats,
  RetryConfig,
} from "../interfaces/QueueManager.js";
import { Priority } from "@ai-toolkit/shared";

export class BullMQManager implements QueueManager {
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private jobProcessors: Map<string, (job: Job) => Promise<any>> = new Map();
  private initialized = false;

  constructor(redisConfig?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  }) {
    this.redis = new Redis({
      host: redisConfig?.host || "localhost",
      port: redisConfig?.port || 6379,
      password: redisConfig?.password,
      db: redisConfig?.db || 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.redis.connect();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Redis connection: ${error}`);
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    // Close all workers
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    // Close all queue events
    for (const queueEvent of this.queueEvents.values()) {
      await queueEvent.close();
    }

    // Close all queues
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    // Close Redis connection
    await this.redis.quit();

    this.queues.clear();
    this.workers.clear();
    this.queueEvents.clear();
    this.jobProcessors.clear();
    this.initialized = false;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  async createQueue(config: QueueConfig): Promise<void> {
    if (!this.initialized) {
      throw new Error("QueueManager not initialized");
    }

    if (this.queues.has(config.name)) {
      return; // Queue already exists
    }

    const queue = new Queue(config.name, {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: config.defaultJobOptions?.removeOnComplete || 100,
        removeOnFail: config.defaultJobOptions?.removeOnFail || 50,
        attempts: config.retryConfig.maxRetries + 1,
        backoff: {
          type: config.retryConfig.backoffStrategy,
          delay: config.retryConfig.initialDelay,
        },
        delay: config.defaultJobOptions?.delay || 0,
      },
    });

    // Create worker for processing jobs
    const worker = new Worker(
      config.name,
      async (job: Job) => {
        const processor = this.jobProcessors.get(config.name);
        if (!processor) {
          throw new Error(`No processor registered for queue: ${config.name}`);
        }
        return await processor(job);
      },
      {
        connection: this.redis,
        concurrency: config.concurrency,
      }
    );

    // Create queue events for monitoring
    const queueEvents = new QueueEvents(config.name, {
      connection: this.redis,
    });

    this.queues.set(config.name, queue);
    this.workers.set(config.name, worker);
    this.queueEvents.set(config.name, queueEvents);
  }

  registerJobProcessor(
    queueName: string,
    processor: (job: Job) => Promise<any>
  ): void {
    this.jobProcessors.set(queueName, processor);
  }

  async addJob(
    queueName: string,
    jobData: JobData,
    priority?: Priority
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const priorityValue = this.getPriorityValue(priority);

    const job = await queue.add(
      jobData.type,
      {
        ...jobData,
        createdAt: new Date(),
      },
      {
        priority: priorityValue,
        attempts: jobData.options?.retries
          ? jobData.options.retries + 1
          : undefined,
        delay: jobData.options?.timeout ? 0 : undefined,
      }
    );

    return job.id!;
  }

  async getJob(jobId: string): Promise<JobStatus | null> {
    // Search through all queues to find the job
    for (const [queueName, queue] of this.queues) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          return this.mapJobToStatus(job);
        }
      } catch {
        // Continue searching in other queues
      }
    }
    return null;
  }

  async removeJob(jobId: string): Promise<boolean> {
    for (const queue of this.queues.values()) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          await job.remove();
          return true;
        }
      } catch {
        // Continue searching in other queues
      }
    }
    return false;
  }

  async retryJob(jobId: string): Promise<boolean> {
    for (const queue of this.queues.values()) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          await job.retry();
          return true;
        }
      } catch {
        // Continue searching in other queues
      }
    }
    return false;
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }
    await queue.pause();
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }
    await queue.resume();
  }

  async cleanQueue(
    queueName: string,
    grace: number,
    status?: "completed" | "failed"
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    if (status === "completed") {
      const jobs = await queue.clean(grace, 100, "completed");
      return Array.isArray(jobs) ? jobs.length : jobs;
    } else if (status === "failed") {
      const jobs = await queue.clean(grace, 100, "failed");
      return Array.isArray(jobs) ? jobs.length : jobs;
    } else {
      const completedJobs = await queue.clean(grace, 100, "completed");
      const failedJobs = await queue.clean(grace, 100, "failed");
      const completedCount = Array.isArray(completedJobs)
        ? completedJobs.length
        : completedJobs;
      const failedCount = Array.isArray(failedJobs)
        ? failedJobs.length
        : failedJobs;
      return completedCount + failedCount;
    }
  }

  async getQueueStats(queueName: string): Promise<QueueStats> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const counts = await queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0,
    };
  }

  async getActiveJobs(queueName: string): Promise<JobStatus[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const jobs = await queue.getActive();
    return jobs.map((job) => this.mapJobToStatus(job));
  }

  async getFailedJobs(queueName: string, limit = 50): Promise<JobStatus[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const jobs = await queue.getFailed(0, limit - 1);
    return jobs.map((job) => this.mapJobToStatus(job));
  }

  async getCompletedJobs(queueName: string, limit = 50): Promise<JobStatus[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const jobs = await queue.getCompleted(0, limit - 1);
    return jobs.map((job) => this.mapJobToStatus(job));
  }

  onJobProgress(
    queueName: string,
    callback: (jobId: string, progress: JobProgress) => void
  ): void {
    const queueEvents = this.queueEvents.get(queueName);
    if (!queueEvents) {
      throw new Error(`Queue events not found: ${queueName}`);
    }

    queueEvents.on("progress", ({ jobId, data }) => {
      callback(jobId, data as JobProgress);
    });
  }

  onJobCompleted(
    queueName: string,
    callback: (jobId: string, result: JobResult) => void
  ): void {
    const queueEvents = this.queueEvents.get(queueName);
    if (!queueEvents) {
      throw new Error(`Queue events not found: ${queueName}`);
    }

    queueEvents.on("completed", ({ jobId, returnvalue }) => {
      callback(jobId, {
        success: true,
        data: returnvalue,
        duration: 0, // Will be calculated elsewhere
        completedAt: new Date(),
      });
    });
  }

  onJobFailed(
    queueName: string,
    callback: (jobId: string, error: string) => void
  ): void {
    const queueEvents = this.queueEvents.get(queueName);
    if (!queueEvents) {
      throw new Error(`Queue events not found: ${queueName}`);
    }

    queueEvents.on("failed", ({ jobId, failedReason }) => {
      callback(jobId, failedReason || "Unknown error");
    });
  }

  async addBulkJobs(
    queueName: string,
    jobs: Array<{ data: JobData; priority?: Priority }>
  ): Promise<string[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const bulkJobs = jobs.map(({ data, priority }) => ({
      name: data.type,
      data: {
        ...data,
        createdAt: new Date(),
      },
      opts: {
        priority: this.getPriorityValue(priority),
        attempts: data.options?.retries ? data.options.retries + 1 : undefined,
      },
    }));

    const addedJobs = await queue.addBulk(bulkJobs);
    return addedJobs.map((job) => job.id!);
  }

  async pauseAllQueues(): Promise<void> {
    const promises = Array.from(this.queues.keys()).map((queueName) =>
      this.pauseQueue(queueName)
    );
    await Promise.all(promises);
  }

  async resumeAllQueues(): Promise<void> {
    const promises = Array.from(this.queues.keys()).map((queueName) =>
      this.resumeQueue(queueName)
    );
    await Promise.all(promises);
  }

  async getSystemStats(): Promise<{
    totalQueues: number;
    totalJobs: number;
    activeJobs: number;
    failedJobs: number;
    completedJobs: number;
  }> {
    const queueNames = Array.from(this.queues.keys());
    const statsPromises = queueNames.map((name) => this.getQueueStats(name));
    const allStats = await Promise.all(statsPromises);

    return allStats.reduce(
      (total, stats) => ({
        totalQueues: queueNames.length,
        totalJobs:
          total.totalJobs +
          stats.waiting +
          stats.active +
          stats.completed +
          stats.failed,
        activeJobs: total.activeJobs + stats.active,
        failedJobs: total.failedJobs + stats.failed,
        completedJobs: total.completedJobs + stats.completed,
      }),
      {
        totalQueues: 0,
        totalJobs: 0,
        activeJobs: 0,
        failedJobs: 0,
        completedJobs: 0,
      }
    );
  }

  private getPriorityValue(priority?: Priority): number {
    switch (priority) {
      case "critical":
        return 1;
      case "high":
        return 2;
      case "medium":
        return 3;
      case "low":
        return 4;
      default:
        return 3; // medium priority by default
    }
  }

  private mapJobToStatus(job: Job): JobStatus {
    const state = job.finishedOn
      ? job.failedReason
        ? "failed"
        : "completed"
      : job.processedOn
        ? "active"
        : "waiting";

    return {
      id: job.id!,
      status: state,
      progress: job.progress ? (job.progress as JobProgress) : undefined,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts || 1,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      failedReason: job.failedReason || undefined,
      result:
        job.finishedOn && !job.failedReason
          ? {
              success: true,
              data: job.returnvalue,
              duration: job.finishedOn - (job.processedOn || job.timestamp),
              completedAt: new Date(job.finishedOn),
            }
          : undefined,
    };
  }
}
