import {
  QueueManager,
  QueueConfig,
  RetryConfig,
} from "../interfaces/QueueManager.js";
import { BullMQManager } from "./BullMQManager.js";

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

export class QueueFactory {
  private static instance: QueueManager | null = null;

  static async createQueueManager(
    config?: QueueManagerConfig
  ): Promise<QueueManager> {
    if (QueueFactory.instance) {
      return QueueFactory.instance;
    }

    const manager = new BullMQManager(config?.redis);
    await manager.initialize();

    // Create default queues
    const defaultRetryConfig: RetryConfig = config?.defaultRetryConfig || {
      maxRetries: 3,
      backoffStrategy: "exponential",
      initialDelay: 1000,
      maxDelay: 30000,
    };

    const defaultConcurrency = config?.defaultConcurrency || 5;

    // Create standard workflow queues
    const queueConfigs: QueueConfig[] = [
      {
        name: "document-processing",
        concurrency: defaultConcurrency,
        retryConfig: defaultRetryConfig,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: "ai-analysis",
        concurrency: Math.max(1, Math.floor(defaultConcurrency / 2)), // AI operations are more resource intensive
        retryConfig: {
          ...defaultRetryConfig,
          maxRetries: 2, // Fewer retries for AI operations
        },
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
        },
      },
      {
        name: "workflow-execution",
        concurrency: defaultConcurrency,
        retryConfig: defaultRetryConfig,
        defaultJobOptions: {
          removeOnComplete: 200,
          removeOnFail: 100,
        },
      },
      {
        name: "file-operations",
        concurrency: defaultConcurrency * 2, // File operations can be more concurrent
        retryConfig: {
          ...defaultRetryConfig,
          maxRetries: 5, // More retries for file operations
        },
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
        },
      },
      {
        name: "notifications",
        concurrency: defaultConcurrency,
        retryConfig: {
          ...defaultRetryConfig,
          maxRetries: 2,
        },
        defaultJobOptions: {
          removeOnComplete: 25,
          removeOnFail: 10,
        },
      },
    ];

    // Create all queues
    for (const queueConfig of queueConfigs) {
      await manager.createQueue(queueConfig);
    }

    QueueFactory.instance = manager;
    return manager;
  }

  static getInstance(): QueueManager | null {
    return QueueFactory.instance;
  }

  static async shutdown(): Promise<void> {
    if (QueueFactory.instance) {
      await QueueFactory.instance.shutdown();
      QueueFactory.instance = null;
    }
  }
}

// Predefined queue names for type safety
export const QUEUE_NAMES = {
  DOCUMENT_PROCESSING: "document-processing",
  AI_ANALYSIS: "ai-analysis",
  WORKFLOW_EXECUTION: "workflow-execution",
  FILE_OPERATIONS: "file-operations",
  NOTIFICATIONS: "notifications",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
